/**
 * worker.ts
 * الـ Worker الفعلي: كياخد job من الـ queue وكيدير الـ pipeline كامل
 * (توليد فيديو → metadata → جدولة → نشر → إشعار)
 *
 * هذا الملف خاصو يتشغل كـ process مستقل دائم التشغيل عبر PM2:
 *   pm2 start dist/queue/worker.js --name quran-worker
 */

import { Worker, Job } from "bullmq";
import { PrismaClient, ContentType } from "@prisma/client";
import { connection, ContentGenerationJobData, WORKER_CONCURRENCY } from "./queue";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { publishVideo } from "../services/youtubePublisher";
import { publishToAllPlatforms } from "../services/multiPlatformPublisher";
import { uploadToR2, deleteFromR2 } from "../services/r2Uploader";
import { notifyPublishSuccess, notifyPublishFailure } from "../services/notifier";
import { cleanupWorkDir } from "../services/videoRenderer";
import { RECITER_ARABIC_NAMES, RECITERS, RECITER_WEIGHTS } from "../services/audioFetcher";
import { unlink } from "fs/promises";

const prisma = new PrismaClient();

async function processJob(job: Job<ContentGenerationJobData>) {
  const { contentType } = job.data;
  let dbRecordId: string | undefined;
  let workDirToClean: string | undefined;

  try {
    // 1. توليد الفيديو الكامل (verseSelector → fetch → compose → render)
    // اختيار القارئ عشوائياً مع تفضيل الجودة العالية
    const reciterKeys = Object.keys(RECITERS) as (keyof typeof RECITERS)[];
    const weights = reciterKeys.map((k) => RECITER_WEIGHTS[k] ?? 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let chosenReciter = reciterKeys[0];
    for (let i = 0; i < reciterKeys.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { chosenReciter = reciterKeys[i]; break; }
    }
    const generated = await generateContent(contentType, chosenReciter);
    workDirToClean = generated.workDir;
    const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;

    // 2. توليد العنوان/الوصف/الهاشتاغات بالذكاء الاصطناعي
    const metadata = await generateMetadata(generated.verses, contentType, reciterArabic, generated.reciter);

    // 3. تحديد وقت النشر الأمثل
    const scheduledAt = await getNextOptimalPublishTime(contentType);

    // 4. تسجيل أولي فقاعدة البيانات (status: GENERATING -> READY)
    const record = await prisma.publishedContent.create({
      data: {
        contentType,
        surahNumber: generated.surahNumber,
        fromAyah: generated.fromAyah,
        toAyah: generated.toAyah,
        reciter: generated.reciter,
        videoFilePath: generated.videoPath,
        title: metadata.title,
        description: metadata.description,
        status: "READY",
        scheduledAt: new Date(scheduledAt),
      },
    });
    dbRecordId = record.id;

    // 5. النشر الفعلي على يوتيوب (إذا skipYouTube=true، نتجاوز)
    let youtubeVideoId: string | null = null;
    let youtubeVideoUrl: string | null = null;

    if (!job.data.skipYouTube) {
      const result = await publishVideo({
        videoFilePath: generated.videoPath,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        isShort: contentType === ContentType.SHORT,
        scheduledPublishTime: scheduledAt,
      });
      youtubeVideoId = result.youtubeVideoId;
      youtubeVideoUrl = result.videoUrl;
    } else {
      console.log("⏭️ تخطي رفع يوتيوب (skipYouTube=true) — باقي المنصات مستمرة");
    }

    // 6. رفع الفيديو إلى R2 (لـ Instagram + Threads — يحتاجون رابط عام)
    //    إذا R2 مش مهيأ، Instagram + Threads يتخطوا بهدوء
    const publicVideoUrl = await uploadToR2(generated.videoPath);

    // 7. نشر على باقي المنصات (Facebook + Instagram + Threads) — بالتوازي
    //    كل منصة كتتخطى بهدوء إذا الإعدادات ناقصة

    const multiResult = await publishToAllPlatforms(
      {
        videoFilePath: generated.videoPath,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        isShort: contentType === ContentType.SHORT,
        videoUrl: publicVideoUrl,
      },
      youtubeVideoId ?? "",
      youtubeVideoUrl ?? ""
    );

    // 8. تحديث السجل بعد النشر الناجح — نخزن IDs جميع المنصات
    await prisma.publishedContent.update({
      where: { id: record.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        youtubeVideoId,
        facebookVideoId: multiResult.facebook?.facebookVideoId || null,
        instagramMediaId: multiResult.instagram?.instagramMediaId || null,
        threadsPostId: multiResult.threads?.threadsPostId || null,
      },
    });

    // 9. إشعار Telegram بالنجاح
    const allUrls = [
      youtubeVideoUrl && `🎬 يوتيوب: ${youtubeVideoUrl}`,
      multiResult.facebook?.facebookVideoId && `📘 فيسبوك: ${multiResult.facebook.postUrl}`,
      multiResult.instagram?.instagramMediaId && `📸 انستغرام: ${multiResult.instagram.postUrl}`,
      multiResult.threads?.threadsPostId && `🧵 تريدز: ${multiResult.threads.postUrl}`,
    ].filter(Boolean).join("\n");

    await notifyPublishSuccess({
      title: metadata.title,
      videoUrl: youtubeVideoUrl ?? "",
      surahName: generated.verses[0].surahNameArabic,
      fromAyah: generated.fromAyah,
      toAyah: generated.toAyah,
      contentType,
      scheduledAt,
      extraPlatforms: allUrls,
    });

    // 9. تنظيف الملفات المؤقتة + حذف الفيديو من R2 + حذف الفيديو النهائي
    //    (تكون جميع المنصات انتهت من الرفع قبل هاد الخطوة)
    await cleanupWorkDir(generated.workDir);
    await unlink(generated.videoPath).catch(() => {});
    if (publicVideoUrl) await deleteFromR2(generated.videoPath);

    return {
      success: true,
      videoId: youtubeVideoId ?? "",
      platforms: {
        youtube: youtubeVideoId,
        facebook: multiResult.facebook?.facebookVideoId || null,
        instagram: multiResult.instagram?.instagramMediaId || null,
        threads: multiResult.threads?.threadsPostId || null,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (dbRecordId) {
      await prisma.publishedContent.update({
        where: { id: dbRecordId },
        data: { status: "FAILED" },
      });
    }

    await notifyPublishFailure({
      step: "content-generation-pipeline",
      error: errorMessage,
      contentType,
    });

    if (workDirToClean) {
      await cleanupWorkDir(workDirToClean).catch(() => {});
    }

    throw err; // كنرميه مرة أخرى باش BullMQ يدير retry logic (attempts: 2)
  }
}

export const worker = new Worker<ContentGenerationJobData>(
  "content-generation",
  processJob,
  {
    connection: connection as any,
    concurrency: WORKER_CONCURRENCY,
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} نجح:`, job.returnvalue);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} فشل بعد كل المحاولات:`, err.message);
});

console.log("🚀 Quran Content Worker بدأ التشغيل...");

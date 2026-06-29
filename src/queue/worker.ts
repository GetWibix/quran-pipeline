/**
 * worker.ts
 * الـ Worker الفعلي: ينفذ pipeline التوليد والنشر مع توجيه ذكي للمنصات
 */

import { Worker, Job } from "bullmq";
import { PrismaClient, ContentType } from "@prisma/client";
import { connection, ContentGenerationJobData, WORKER_CONCURRENCY, PlatformRouting } from "./queue";
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

function getDefaultRouting(): PlatformRouting {
  return { youtube: true, facebook: true, instagram: true, threads: true };
}

function pickReciter(): (keyof typeof RECITERS) {
  const keys = Object.keys(RECITERS) as (keyof typeof RECITERS)[];
  const weights = keys.map((k) => RECITER_WEIGHTS[k] ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return keys[i];
  }
  return keys[0];
}

async function processJob(job: Job<ContentGenerationJobData>) {
  const { contentType } = job.data;
  const routing = job.data.platformRouting ?? getDefaultRouting();
  let dbRecordId: string | undefined;
  let workDirToClean: string | undefined;

  try {
    const chosenReciter = pickReciter();
    const generated = await generateContent(contentType, chosenReciter);
    workDirToClean = generated.workDir;
    const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;

    const metadata = await generateMetadata(generated.verses, contentType, reciterArabic, generated.reciter);

    const scheduledAt = job.data.forcePublishAt ?? (await getNextOptimalPublishTime(contentType));

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

    // ─── النشر على يوتيوب ────────────────────────────────────
    let youtubeVideoId: string | null = null;
    let youtubeVideoUrl: string | null = null;

    if (routing.youtube) {
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
      console.log(`⏭️ تخطي يوتيوب (routing disabled)`);
    }

    // ─── النشر على باقي المنصات ──────────────────────────────
    let publicVideoUrl: string | undefined;
    let multiResult: Awaited<ReturnType<typeof publishToAllPlatforms>> = {
      youtube: null,
      facebook: null,
      instagram: null,
      threads: null,
      errors: [],
    };

    const shouldPublishOthers = routing.facebook || routing.instagram || routing.threads;
    if (shouldPublishOthers) {
      publicVideoUrl = await uploadToR2(generated.videoPath);

      multiResult = await publishToAllPlatforms(
        {
          videoFilePath: generated.videoPath,
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          isShort: contentType === ContentType.SHORT,
          videoUrl: publicVideoUrl,
        },
        {
          youtube: routing.youtube,
          facebook: routing.facebook,
          instagram: routing.instagram,
          threads: routing.threads,
        },
        youtubeVideoId ?? undefined,
        youtubeVideoUrl ?? undefined,
      );
    } else {
      console.log(`⏭️ تخطي باقي المنصات (كلها disabled)`);
    }

    // ─── تحديث السجل ─────────────────────────────────────────
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

    // ─── إشعار Telegram ──────────────────────────────────────
    const publishedPlatforms = [
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
      extraPlatforms: publishedPlatforms,
    });

    // ─── تنظيف ───────────────────────────────────────────────
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

    throw err;
  }
}

export const worker = new Worker<ContentGenerationJobData>("content-generation", processJob, {
  connection: connection as any,
  concurrency: WORKER_CONCURRENCY,
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} نجح:`, job.returnvalue);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} فشل:`, err.message);
});

console.log("🚀 Quran Content Worker بدأ التشغيل...");

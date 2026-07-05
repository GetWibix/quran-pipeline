/**
 * worker.ts
 * الـ Worker الفعلي: ينفذ pipeline التوليد والنشر مع توجيه ذكي للمنصات
 */

import { Worker, Job } from "bullmq";
import { ContentType } from "@prisma/client";
import { connection, ContentGenerationJobData, WORKER_CONCURRENCY, PlatformRouting } from "./queue";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { generateSeoMetadata } from "../services/seoEngine";
import type { SeoInput } from "../services/seoEngine";
import { publishVideo } from "../services/youtubePublisher";
import { addVideoToSurahPlaylist } from "../services/playlistManager";
import { publishToAllPlatforms } from "../services/multiPlatformPublisher";
import { uploadToR2, deleteFromR2 } from "../services/r2Uploader";
import { notifyPublishSuccess, notifyPublishFailure } from "../services/notifier";
import { cleanupWorkDir } from "../services/videoRenderer";
import { generatePoster } from "../services/posterService";
import { publishPhotoToFacebook } from "../services/facebookPhotoPublisher";
import { SITE_LINK } from "../site";
import { selectNextRange } from "../services/verseSelector";
import { getVerse, getSurahMeta, VerseData } from "../services/verseFetcher";
import { RECITER_ARABIC_NAMES, RECITERS, RECITER_WEIGHTS } from "../services/audioFetcher";
import { rename, unlink, mkdir, writeFile } from "fs/promises";
import path from "path";

import prisma from "../lib/prisma";

function getDefaultRouting(): PlatformRouting {
  return { youtube: true, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true };
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
    // ─── بوستر ─────────────────────────────────────────
    if (job.data.posterData || contentType === ContentType.POSTER) {
      const posterContentType = ContentType.POSTER;
      const range = await selectNextRange(posterContentType);
      const surahMeta = await getSurahMeta(range.surahNumber);
      const surahName = `سورة ${surahMeta.nameArabic}`;

      const verses: { number: number; text: string }[] = [];
      const verseData: VerseData[] = [];
      for (let i = range.fromAyah; i <= range.toAyah; i++) {
        const v = await getVerse(range.surahNumber, i);
        verses.push({ number: i, text: v.textArabic });
        verseData.push(v);
      }

      // ─── بناء العنوان: ﴿بداية الآية﷽ 🕋 #هاشتاغ ──────
      const firstVerse = verses[0].text.replace(/[\u0617-\u061A\u064B-\u0652]/g, "").trim();
      const titlePrefix = firstVerse.length > 60 ? firstVerse.slice(0, 60) + "..." : firstVerse;
      const posterTitle = `﴿${titlePrefix}﴾ 🕋 #${surahMeta.nameArabic.replace(/\s+/g, "_")}`;

      // ─── AI يولد caption ─────────────────────────────
      const metadata = await generateMetadata(verseData, posterContentType, "", "alafasy");
      const scheduledAt = await getNextOptimalPublishTime(posterContentType);
      const caption = metadata.description + SITE_LINK;
      const label = posterTitle;

      const imageBuffer = await generatePoster({ surahName: label, verses });

      // حفظ الصورة محلياً للتوثيق
      const posterDir = path.join(__dirname, "../../output/posters");
      const posterFile = `surah${range.surahNumber}-${range.fromAyah}-${range.toAyah}-${Date.now()}.png`;
      const posterPath = path.join(posterDir, posterFile);
      await mkdir(posterDir, { recursive: true });
      await writeFile(posterPath, imageBuffer);

      let fbResult: Awaited<ReturnType<typeof publishPhotoToFacebook>> | undefined;
      if (routing.facebook) {
        fbResult = await publishPhotoToFacebook(imageBuffer, caption);
        console.log(`✅ بوستر منشور على فيسبوك: ${fbResult.postUrl}`);
      }

      await prisma.publishedContent.create({
        data: {
          contentType: posterContentType,
          surahNumber: range.surahNumber,
          fromAyah: range.fromAyah,
          toAyah: range.toAyah,
          reciter: "alafasy",
          videoFilePath: posterPath,
          title: posterTitle,
          description: caption,
          status: "PUBLISHED",
          scheduledAt: new Date(scheduledAt),
          publishedAt: new Date(),
          facebookVideoId: fbResult?.facebookPhotoId ?? "",
        },
      });

      await notifyPublishSuccess({
        title: posterTitle,
        videoUrl: "",
        surahName,
        fromAyah: range.fromAyah,
        toAyah: range.toAyah,
        contentType: posterContentType,
        scheduledAt: new Date().toISOString(),
        extraPlatforms: fbResult?.postUrl ? `📘 بوستر فيسبوك: ${fbResult.postUrl}` : "📘 فيسبوك: تم النشر",
      });

      // حذف الملف من القرص بعد النشر لتوفير المساحة
      await unlink(posterPath).catch(() => {});

      return { success: true, type: "poster", facebookPhotoId: fbResult?.facebookPhotoId ?? "" };
    }

    // ─── فيديو ──────────────────────────────────────────
    const chosenReciter = pickReciter();
    const generated = await generateContent(contentType, chosenReciter, job.data.forceSurahNumber);
    workDirToClean = generated.workDir;
    const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;

    const metadata = await generateMetadata(generated.verses, contentType, reciterArabic, generated.reciter);

    // إعادة تسمية الفيديو ليشمل عنوان الفيديو بدل الأرقام (لتحسين SEO)
    const safeName = metadata.title
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/[^\w_\u0600-\u06FF-]/g, "")
      .slice(0, 100)
      .replace(/_+$/, "");
    const newVideoPath = generated.videoPath.replace(/[^/\\]+\.mp4$/, `${safeName || "video"}.mp4`);
    if (newVideoPath !== generated.videoPath) {
      await rename(generated.videoPath, newVideoPath);
      generated.videoPath = newVideoPath;
    }

    // قصاصة الشورتس من الفيديو الطويل — إعادة تسمية أيضاً
    let shortVideoPath: string | undefined;
    if (generated.shortVideoPath) {
      const newShortPath = generated.shortVideoPath.replace(
        /[^/\\]+\.mp4$/, `${safeName || "video"}-shorts.mp4`
      );
      if (newShortPath !== generated.shortVideoPath) {
        await rename(generated.shortVideoPath, newShortPath);
        generated.shortVideoPath = newShortPath;
      }
      shortVideoPath = generated.shortVideoPath;
    }

    // ─── تحسين SEO عبر seoEngine ──────────────────────────────
    const surahName = generated.verses[0].surahNameArabic;
    const verseText = generated.verses.map((v) => v.textArabic).join(" ");
    const seoInput: SeoInput = {
      surahName,
      surahNumber: generated.surahNumber,
      fromAyah: generated.fromAyah,
      toAyah: generated.toAyah,
      reciter: chosenReciter,
      reciterArabic,
      contentType,
      verseText,
      aiHook: metadata.title,
      aiDescription: metadata.description,
      aiTags: metadata.tags,
    };
    const seoOutput = await generateSeoMetadata(seoInput);

    // إضافة Chapters للفيديوهات الطويلة
    let finalDescription = seoOutput.description;
    if (contentType === ContentType.LONG_VIDEO && generated.sceneDurations.length > 1) {
      const chapters = generated.verses.map((v, i) => {
        const startSec = generated.sceneDurations
          .slice(0, i)
          .reduce((sum, d) => sum + d, 0);
        const mm = Math.floor(startSec / 60);
        const ss = Math.floor(startSec % 60);
        const time = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        return `${time} - الآية ${v.ayahNumber}`;
      }).join("\n");
      finalDescription = `${seoOutput.description}\n\n${chapters}`;
    }

    finalDescription += SITE_LINK;

    const scheduledAt = job.data.forcePublishAt ?? (await getNextOptimalPublishTime(contentType));

    const record = await prisma.publishedContent.create({
      data: {
        contentType,
        surahNumber: generated.surahNumber,
        fromAyah: generated.fromAyah,
        toAyah: generated.toAyah,
        reciter: generated.reciter,
        videoFilePath: generated.videoPath,
        title: seoOutput.title,
        description: finalDescription,
        status: "READY",
        scheduledAt: new Date(scheduledAt),
        titlePatternId: seoOutput.patternId,
      },
    });
    dbRecordId = record.id;

    // ─── النشر على يوتيوب ────────────────────────────────────
    let youtubeVideoId: string | null = null;
    let youtubeVideoUrl: string | null = null;

    if (routing.youtube) {
      const result = await publishVideo({
        videoFilePath: generated.videoPath,
        title: seoOutput.title,
        description: finalDescription,
        tags: seoOutput.tags,
        isShort: contentType === ContentType.SHORT,
        scheduledPublishTime: scheduledAt,
        surahName,
        fromAyah: generated.fromAyah,
        toAyah: generated.toAyah,
      });
      youtubeVideoId = result.youtubeVideoId;
      youtubeVideoUrl = result.videoUrl;

      // ─── إضافة الفيديو إلى بلاي ليست السورة ────────────────
      if (youtubeVideoId) {
        addVideoToSurahPlaylist(youtubeVideoId, generated.surahNumber, surahName).catch((e) =>
          console.warn(`⚠️ فشل إضافة الفيديو إلى بلاي ليست السورة:`, e instanceof Error ? e.message : String(e))
        );
      }
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
      facebookStory: null,
      instagramStory: null,
      errors: [],
    };

    const shouldPublishOthers = routing.facebook || routing.instagram || routing.threads;
    if (shouldPublishOthers) {
      publicVideoUrl = await uploadToR2(generated.videoPath);

      multiResult = await publishToAllPlatforms(
        {
          videoFilePath: generated.videoPath,
          title: seoOutput.title,
          description: finalDescription,
          tags: seoOutput.tags,
          isShort: contentType === ContentType.SHORT,
          videoUrl: publicVideoUrl,
          surahName,
          fromAyah: generated.fromAyah,
          toAyah: generated.toAyah,
          scheduledPublishTime: scheduledAt,
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

    // ─── نشر قصاصة الشورتس (إن وجدت) ─────────────────────────
    let shortYoutubeVideoId: string | null = null;
    let shortMultiResult: Awaited<ReturnType<typeof publishToAllPlatforms>> = {
      youtube: null, facebook: null, instagram: null, threads: null,
      facebookStory: null, instagramStory: null, errors: [],
    };

    if (shortVideoPath) {
      console.log(`📱 نشر قصاصة الشورتس من الفيديو الطويل...`);
      const shortScheduledAt = new Date(Date.now() + 86400000).toISOString();

      if (routing.youtube) {
        const shortRes = await publishVideo({
          videoFilePath: shortVideoPath,
          title: seoOutput.title,
          description: finalDescription,
          tags: seoOutput.tags,
          isShort: true,
          scheduledPublishTime: shortScheduledAt,
          surahName,
          fromAyah: generated.fromAyah,
          toAyah: generated.toAyah,
        }).catch((e) => {
          console.warn(`⚠️ فشل نشر الشورتس على يوتيوب:`, e instanceof Error ? e.message : String(e));
          return null;
        });
        shortYoutubeVideoId = shortRes?.youtubeVideoId ?? null;
      }

      if (shouldPublishOthers) {
        const shortUrl = await uploadToR2(shortVideoPath).catch(() => undefined);

        shortMultiResult = await publishToAllPlatforms(
          {
            videoFilePath: shortVideoPath,
            title: seoOutput.title,
            description: finalDescription,
            tags: seoOutput.tags,
            isShort: true,
            videoUrl: shortUrl ?? "",
            surahName,
            fromAyah: generated.fromAyah,
            toAyah: generated.toAyah,
            scheduledPublishTime: shortScheduledAt,
          },
          { youtube: false, facebook: routing.facebook, instagram: routing.instagram, threads: routing.threads },
          shortYoutubeVideoId ?? undefined,
          undefined,
        ).catch((e) => {
          console.warn(`⚠️ فشل نشر الشورتس على المنصات:`, e instanceof Error ? e.message : String(e));
          return shortMultiResult;
        });
      }
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
    const mainLink = youtubeVideoUrl
      ?? multiResult.facebook?.postUrl
      ?? multiResult.instagram?.postUrl
      ?? multiResult.threads?.postUrl
      ?? "";

    const publishedPlatforms = [
      youtubeVideoUrl && `🎬 يوتيوب: ${youtubeVideoUrl}`,
      multiResult.facebook?.facebookVideoId && `📘 فيسبوك: ${multiResult.facebook.postUrl}`,
      multiResult.instagram?.instagramMediaId && `📸 انستغرام: ${multiResult.instagram.postUrl}`,
      multiResult.threads?.threadsPostId && `🧵 تريدز: ${multiResult.threads.postUrl}`,
      multiResult.facebookStory?.storyId && `📱 قصة فيسبوك`,
      multiResult.instagramStory?.instagramMediaId && `📱 قصة انستغرام`,
    ].filter(Boolean).join("\n");

    await notifyPublishSuccess({
      title: seoOutput.title,
      videoUrl: mainLink,
      surahName,
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
    if (shortVideoPath) await unlink(shortVideoPath).catch(() => {});

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

async function shutdown(signal: string) {
  console.log(`\n🛑 استقبلت ${signal} — إيقاف العامل...`);
  await worker.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
  await connection.quit().catch(() => {});
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

console.log("🚀 Quran Content Worker بدأ التشغيل...");

/**
 * worker.ts
 * الـ Worker الفعلي: ينفذ pipeline التوليد والنشر مع توجيه ذكي للمنصات
 */

import { Worker, Job } from "bullmq";
import { ContentType } from "@prisma/client";
import { connection, ContentGenerationJobData, WORKER_CONCURRENCY, PlatformRouting, contentQueue, FacebookVerificationData } from "./queue";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { generateSeoMetadata } from "../services/seoEngine";
import type { SeoInput } from "../services/seoEngine";
import { publishVideo } from "../services/youtubePublisher";
import { addVideoToSurahPlaylist } from "../services/playlistManager";
import { verifyFacebookPost, generateContentHash } from "../services/facebookPublisher";
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
  if (job.name === "verify-facebook-post") {
    return processVerification(job as unknown as Job<FacebookVerificationData>);
  }
  const { contentType } = job.data;
  let routing = { ...(job.data.platformRouting ?? getDefaultRouting()) };
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

      const posterDir = path.join(__dirname, "../../output/posters");
      const posterFile = `surah${range.surahNumber}-${range.fromAyah}-${range.toAyah}-${Date.now()}.png`;
      const posterPath = path.join(posterDir, posterFile);
      await mkdir(posterDir, { recursive: true });
      await writeFile(posterPath, imageBuffer);

      const posterHash = generateContentHash(range.surahNumber, range.fromAyah, range.toAyah, "alafasy", posterContentType);
      const existingPoster = posterHash ? await prisma.publishedContent.findFirst({
        where: { contentHash: posterHash, facebookVideoId: { not: null } },
        select: { facebookVideoId: true },
      }) : null;
      if (existingPoster?.facebookVideoId) {
        console.log(`⏭️ بوستر مكرر: ${existingPoster.facebookVideoId}`);
        await unlink(posterPath).catch(() => {});
        await notifyPublishSuccess({
          title: posterTitle,
          videoUrl: "",
          surahName,
          fromAyah: range.fromAyah,
          toAyah: range.toAyah,
          contentType: posterContentType,
          scheduledAt: new Date().toISOString(),
          extraPlatforms: `📘 بوستر مكرر (موجود): ${existingPoster.facebookVideoId}`,
        });
        return { success: true, type: "poster_skipped", facebookPhotoId: existingPoster.facebookVideoId };
      }

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
          contentHash: posterHash,
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
    const chosenReciter = job.data.forceSurahNumber ? "alafasy" : pickReciter();
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
    const contentHash = generateContentHash(generated.surahNumber, generated.fromAyah, generated.toAyah, generated.reciter, contentType);
    const isScheduled = scheduledAt && (new Date(scheduledAt).getTime() - Date.now() > 10 * 60 * 1000);

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
        contentHash,
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

    let existingFacebookId: string | undefined;
    if (routing.facebook && contentHash) {
      const dup = await prisma.publishedContent.findFirst({
        where: { contentHash, facebookVideoId: { not: null } },
        select: { facebookVideoId: true },
      });
      if (dup?.facebookVideoId) {
        existingFacebookId = dup.facebookVideoId;
        routing = { ...routing, facebook: false };
        console.log(`⏭️ Facebook: مكرر — استخدام المعرف ${existingFacebookId}`);
      }
    }

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
          scheduledPublishTime: isScheduled ? scheduledAt : undefined,
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
    if (existingFacebookId && !multiResult.facebook?.facebookVideoId) {
      multiResult.facebook = {
        facebookVideoId: existingFacebookId,
        postUrl: `https://www.facebook.com/watch/?v=${existingFacebookId}`,
      };
    }

    await prisma.publishedContent.update({
      where: { id: record.id },
      data: {
        status: isScheduled ? "SCHEDULED" : "PUBLISHED",
        publishedAt: new Date(),
        facebookPostStatus: multiResult.facebook?.facebookVideoId
          ? (isScheduled ? "SCHEDULED" : "PUBLISHED")
          : null,
        youtubeVideoId,
        facebookVideoId: multiResult.facebook?.facebookVideoId || null,
        instagramMediaId: multiResult.instagram?.instagramMediaId || null,
        threadsPostId: multiResult.threads?.threadsPostId || null,
      },
    });

    if (isScheduled && multiResult.facebook?.facebookVideoId) {
      const verificationDelay = Math.max(
        new Date(scheduledAt).getTime() - Date.now() + 30 * 60 * 1000,
        60000
      );
      await (contentQueue as any).add("verify-facebook-post", {
        recordId: record.id,
        facebookVideoId: multiResult.facebook.facebookVideoId,
        scheduledTime: scheduledAt,
      }, {
        delay: verificationDelay,
      });
      console.log(`🔍 تمت جدولة التحقق من منشور فيسبوك بعد ${Math.round(verificationDelay / 60000)} دقيقة`);
    }

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

async function processVerification(job: Job<FacebookVerificationData>) {
  const { recordId, facebookVideoId } = job.data;
  try {
    const status = await verifyFacebookPost(facebookVideoId);
    if (status.isHidden) {
      console.warn(`⚠️ منشور فيسبوك ${facebookVideoId} مخفي — تحديث السجل`);
      await prisma.publishedContent.update({
        where: { id: recordId },
        data: { facebookPostStatus: "HIDDEN", status: "FAILED" },
      });
    } else if (status.isPublished) {
      console.log(`✅ منشور فيسبوك ${facebookVideoId} منشور ومرئي`);
      await prisma.publishedContent.update({
        where: { id: recordId },
        data: { facebookPostStatus: "PUBLISHED", status: "PUBLISHED", publishedAt: new Date() },
      });
    }
  } catch (err) {
    console.error(`❌ فشل التحقق من منشور فيسبوك ${facebookVideoId}:`, err instanceof Error ? err.message : String(err));
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

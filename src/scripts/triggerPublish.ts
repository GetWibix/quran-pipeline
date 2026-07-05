/**
 * triggerPublish.ts
 * يشغل pipeline كامل + رفع حقيقي على يوتيوب بشكل يدوي فوري
 * Usage: npx ts-node src/scripts/triggerPublish.ts [SHORT|LONG_VIDEO]
 */

import { PrismaClient, ContentType } from "@prisma/client";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { generateSeoMetadata } from "../services/seoEngine";
import type { SeoInput } from "../services/seoEngine";
import { publishVideo } from "../services/youtubePublisher";
import { publishToAllPlatforms } from "../services/multiPlatformPublisher";
import { uploadToR2, deleteFromR2 } from "../services/r2Uploader";
import { notifyPublishSuccess, notifyPublishFailure } from "../services/notifier";
import { cleanupWorkDir } from "../services/videoRenderer";
import { RECITER_ARABIC_NAMES, RECITERS, RECITER_WEIGHTS } from "../services/audioFetcher";
import { rename, unlink } from "fs/promises";

const prisma = new PrismaClient();
const contentType = (process.argv[2]?.toUpperCase() === "LONG_VIDEO" ? "LONG_VIDEO" : "SHORT") as ContentType;

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     🚀  نشر حقيقي على يوتيوب  🚀          ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`📐 النوع: ${contentType}`);
  console.log("");

  // اختيار القارئ بالأوزان
  const reciterKeys = Object.keys(RECITERS) as (keyof typeof RECITERS)[];
  const weights = reciterKeys.map((k) => RECITER_WEIGHTS[k] ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let chosenReciter = reciterKeys[0];
  for (let i = 0; i < reciterKeys.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { chosenReciter = reciterKeys[i]; break; }
  }

  console.log("━".repeat(50));
  console.log("📦 [1/5] توليد الفيديو...");
  console.time("⏱️  المدة الإجمالية");
  const generated = await generateContent(contentType, chosenReciter);
  const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;
  console.log(`   ✅ الفيديو: ${generated.videoPath}`);
  console.log(`   ✅ المدة: ${generated.totalDurationSeconds.toFixed(1)}ث`);

  console.log("━".repeat(50));
  console.log("🤖 [2/5] توليد الميتاداتا (AI)...");
  const metadata = await generateMetadata(generated.verses, contentType, reciterArabic, generated.reciter);
  console.log(`   ✅ العنوان (AI): ${metadata.title}`);

  // تحسين SEO
  console.log("━".repeat(50));
  console.log("🔍 [2.5/5] تحسين SEO...");
  const surahName = generated.verses[0].surahNameArabic;
  const verseText = generated.verses.map((v) => v.textArabic).join(" ");
  const seoInput: SeoInput = {
    surahName,
    surahNumber: generated.surahNumber,
    fromAyah: generated.fromAyah,
    toAyah: generated.toAyah,
    reciter: generated.reciter,
    reciterArabic,
    contentType,
    verseText,
    aiHook: metadata.title,
    aiDescription: metadata.description,
    aiTags: metadata.tags,
  };
  const seoOutput = await generateSeoMetadata(seoInput);
  console.log(`   ✅ العنوان (SEO): ${seoOutput.title}`);

  // إعادة تسمية الفيديو
  const safeName = seoOutput.title
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
    console.log(`   ✅ أعيدت التسمية: ${safeName}.mp4`);
  }

  // إضافة Chapters للفيديوهات الطويلة
  let finalDescription = seoOutput.description;
  if (contentType === ContentType.LONG_VIDEO && generated.sceneDurations.length > 1) {
    const chapters = generated.verses.map((v, i) => {
      const startSec = generated.sceneDurations.slice(0, i).reduce((sum, d) => sum + d, 0);
      const mm = Math.floor(startSec / 60);
      const ss = Math.floor(startSec % 60);
      return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} - الآية ${v.ayahNumber}`;
    }).join("\n");
    finalDescription = `${seoOutput.description}\n\n${chapters}`;
  }

  console.log("━".repeat(50));
  console.log("⏰ [3/5] تحديد وقت النشر الأمثل...");
  const scheduledAt = await getNextOptimalPublishTime(contentType);
  console.log(`   ✅ الوقت: ${scheduledAt}`);

  console.log("━".repeat(50));
  console.log("💾 [4/5] تسجيل في DB...");
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
  console.log(`   ✅ السجل: ${record.id}`);

  console.log("━".repeat(50));
  console.log("🌐 [5/5] رفع على يوتيوب...");
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

  console.log(`   ✅ يوتيوب: ${result.videoUrl}`);

  // نشر على فيسبوك (مباشر بدون R2)
  let multiResult: Awaited<ReturnType<typeof publishToAllPlatforms>> = {
    youtube: null, facebook: null, instagram: null, threads: null, facebookStory: null, instagramStory: null, errors: [],
  };

  const r2Configured = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY && process.env.R2_SECRET_KEY);
  let publicVideoUrl: string | undefined;

  if (r2Configured) {
    publicVideoUrl = await uploadToR2(generated.videoPath);
  }

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
    },
    { youtube: false, facebook: true, instagram: r2Configured, threads: r2Configured },
    result.youtubeVideoId,
    result.videoUrl
  );

  await prisma.publishedContent.update({
    where: { id: record.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      youtubeVideoId: result.youtubeVideoId,
      facebookVideoId: multiResult.facebook?.facebookVideoId || null,
      instagramMediaId: multiResult.instagram?.instagramMediaId || null,
      threadsPostId: multiResult.threads?.threadsPostId || null,
    },
  });

  const allUrls = [
    `🎬 يوتيوب: ${result.videoUrl}`,
    multiResult.facebook?.facebookVideoId && `📘 فيسبوك: ${multiResult.facebook.postUrl}`,
    multiResult.instagram?.instagramMediaId && `📸 انستغرام: ${multiResult.instagram.postUrl}`,
    multiResult.threads?.threadsPostId && `🧵 تريدز: ${multiResult.threads.postUrl}`,
  ].filter(Boolean).join("\n");

  await notifyPublishSuccess({
    title: seoOutput.title,
    videoUrl: result.videoUrl,
    surahName,
    fromAyah: generated.fromAyah,
    toAyah: generated.toAyah,
    contentType,
    scheduledAt,
    extraPlatforms: allUrls,
  });

  console.timeEnd("⏱️  المدة الإجمالية");
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     ✅✅✅  نُشر بنجاح  ✅✅✅               ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`🔗 يوتيوب: ${result.videoUrl}`);
  if (multiResult.facebook?.facebookVideoId) console.log(`📘 فيسبوك: ${multiResult.facebook.postUrl}`);
  if (multiResult.instagram?.instagramMediaId) console.log(`📸 انستغرام: ${multiResult.instagram.postUrl}`);
  if (multiResult.threads?.threadsPostId) console.log(`🧵 تريدز: ${multiResult.threads.postUrl}`);

  // تنظيف
  await cleanupWorkDir(generated.workDir);
  await unlink(generated.videoPath).catch(() => {});
  if (r2Configured) await deleteFromR2(generated.videoPath).catch(() => {});

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ فشل:", err.message);
  console.error(err.stack);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

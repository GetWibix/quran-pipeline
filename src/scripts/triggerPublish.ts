/**
 * triggerPublish.ts
 * يشغل pipeline كامل + رفع حقيقي على يوتيوب بشكل يدوي فوري
 * Usage: npx ts-node src/scripts/triggerPublish.ts [SHORT|LONG_VIDEO]
 */

import { PrismaClient, ContentType } from "@prisma/client";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { publishVideo } from "../services/youtubePublisher";
import { notifyPublishSuccess, notifyPublishFailure } from "../services/notifier";
import { cleanupWorkDir } from "../services/videoRenderer";
import { RECITER_ARABIC_NAMES, RECITERS, RECITER_WEIGHTS } from "../services/audioFetcher";
import { unlink } from "fs/promises";
import { connection, defaultJobOptions } from "../queue/queue";

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
  console.log(`   ✅ العنوان: ${metadata.title}`);

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
      title: metadata.title,
      description: metadata.description,
      status: "READY",
      scheduledAt: new Date(scheduledAt),
    },
  });
  console.log(`   ✅ السجل: ${record.id}`);

  console.log("━".repeat(50));
  console.log("🌐 [5/5] رفع على يوتيوب...");
  const result = await publishVideo({
    videoFilePath: generated.videoPath,
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
    isShort: contentType === ContentType.SHORT,
    scheduledPublishTime: scheduledAt,
  });

  await prisma.publishedContent.update({
    where: { id: record.id },
    data: {
      status: "PUBLISHED",
      youtubeVideoId: result.youtubeVideoId,
      publishedAt: new Date(),
    },
  });

  console.log(`   ✅ تم الرفع: ${result.videoUrl}`);
  console.log(`   ✅ YouTube ID: ${result.youtubeVideoId}`);

  await notifyPublishSuccess({
    title: metadata.title,
    videoUrl: result.videoUrl,
    surahName: generated.verses[0].surahNameArabic,
    fromAyah: generated.fromAyah,
    toAyah: generated.toAyah,
    contentType,
    scheduledAt,
  });

  console.timeEnd("⏱️  المدة الإجمالية");
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     ✅✅✅  نُشر بنجاح  ✅✅✅               ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`🔗 الرابط: ${result.videoUrl}`);

  // تنظيف
  await cleanupWorkDir(generated.workDir);
  await unlink(generated.videoPath).catch(() => {});

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ فشل:", err.message);
  console.error(err.stack);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

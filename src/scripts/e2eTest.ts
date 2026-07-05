/**
 * e2eTest.ts
 * اختبار شامل (End-to-End) يحاكي الـ pipeline بالكامل من البداية للنشر على يوتيوب،
 * لكن بدون رفع الفيديو فعلياً — باش تشوف النتيجة قبل النشر الحقيقي.
 *
 * كيعمل:
 *   1. اختيار الآيات (AI + قاعدة البيانات)
 *   2. تحميل الصوت
 *   3. رسم المشاهد
 *   4. توليد الفيديو (FFmpeg)
 *   5. توليد العنوان والوصف والهاشتاغات (AI عبر OpenRouter)
 *   6. تحديد وقت النشر الأمثل
 *   7. تسجيل الفيديو في قاعدة البيانات (حالة READY — مش PUBLISHED)
 *   8. تنظيف الملفات المؤقتة + الإبقاء على الفيديو النهائي
 *
 * ما كيديرش:
 *   ❌ رفع الفيديو على يوتيوب
 *   ❌ إرسال إشعار تيلغرام
 *   ❌ حذف الفيديو النهائي
 *
 * Usage:
 *   node dist/scripts/e2eTest.js                              ← Short (افتراضي)
 *   node dist/scripts/e2eTest.js --type LONG_VIDEO            ← فيديو طويل
 *   node dist/scripts/e2eTest.js --type SHORT --reciter maher ← قارئ مختلف
 *   npm run e2e                                               ← عبر السكربت
 */

import { ContentType } from "@prisma/client";
import { generateContent } from "../services/contentPipeline";
import { generateMetadata, getNextOptimalPublishTime } from "../services/decisionAgent";
import { cleanupWorkDir } from "../services/videoRenderer";
import { RECITER_ARABIC_NAMES, RECITERS } from "../services/audioFetcher";
import prisma from "../lib/prisma";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
  };
  const type = get("--type", "SHORT").toUpperCase();
  let reciter = get("--reciter", "") as keyof typeof RECITERS;

  if (!["SHORT", "LONG_VIDEO"].includes(type)) throw new Error("نوع المحتوى: SHORT أو LONG_VIDEO");

  // إذا ما حددش القارئ، نختارو عشوائياً
  const allKeys = Object.keys(RECITERS) as (keyof typeof RECITERS)[];
  if (!reciter || !RECITERS[reciter]) {
    reciter = allKeys[Math.floor(Math.random() * allKeys.length)];
  }

  return { contentType: type as ContentType, reciterKey: reciter };
}

async function main() {
  const opts = parseArgs();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     🧪 اختبار شامل (E2E) قبل النشر 🧪      ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`📐 النوع: ${opts.contentType}`);
  console.log(`🎙️ القارئ: ${opts.reciterKey}`);
  console.log("");

  // ─── 1. توليد الفيديو ───────────────────────────────────
  console.log("━".repeat(50));
  console.log("📦 [1/5] توليد الفيديو (اختيار آيات → صوت → رسم → رندر)...");
  console.time("⏱️  المدة الإجمالية");

  const generated = await generateContent(opts.contentType, opts.reciterKey);

  console.log(`   ✅ الفيديو: ${generated.videoPath}`);
  console.log(`   ✅ المدة: ${generated.totalDurationSeconds.toFixed(1)}ث`);
  console.log(`   ✅ الآيات: ${generated.surahNumber}:${generated.fromAyah}-${generated.toAyah}`);
  console.log(`   ✅ المشاهد: ${generated.verses.length}`);
  console.log("");

  // ─── 2. توليد الميتاداتا (AI) ────────────────────────────
  console.log("━".repeat(50));
  console.log("🤖 [2/5] توليد العنوان والوصف والهاشتاغات (AI)...");

  const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;
  const metadata = await generateMetadata(
    generated.verses,
    opts.contentType,
    reciterArabic,
    generated.reciter
  );

  console.log(`   ✅ العنوان: ${metadata.title}`);
  console.log(`   ✅ الوصف: ${metadata.description.substring(0, 120)}...`);
  console.log(`   ✅ الهاشتاغات: ${metadata.tags.join(", ")}`);
  console.log("");

  // ─── 3. وقت النشر الأمثل ─────────────────────────────────
  console.log("━".repeat(50));
  console.log("⏰ [3/5] تحديد وقت النشر الأمثل...");

  const scheduledAt = await getNextOptimalPublishTime(opts.contentType);
  const scheduledDate = new Date(scheduledAt);

  console.log(`   ✅ الوقت المحدد: ${scheduledDate.toLocaleString("ar-SA", { timeZone: "UTC" })} UTC`);
  console.log(`   ✅ بصيغة ISO: ${scheduledAt}`);
  console.log("");

  // ─── 4. تسجيل في قاعدة البيانات ──────────────────────────
  console.log("━".repeat(50));
  console.log("💾 [4/5] تسجيل الفيديو في قاعدة البيانات (حالة: READY)...");

  const record = await prisma.publishedContent.create({
    data: {
      contentType: opts.contentType,
      surahNumber: generated.surahNumber,
      fromAyah: generated.fromAyah,
      toAyah: generated.toAyah,
      reciter: generated.reciter,
      videoFilePath: generated.videoPath,
      title: metadata.title,
      description: metadata.description,
      status: "READY",
      scheduledAt: scheduledDate,
    },
  });

  console.log(`   ✅ السجل: ${record.id}`);
  console.log(`   ✅ الحالة: ${record.status}`);
  console.log(`   ✅ المسار: ${record.videoFilePath}`);
  console.log("");

  // ─── 5. تنظيف ────────────────────────────────────────────
  console.log("━".repeat(50));
  console.log("🧹 [5/5] تنظيف الملفات المؤقتة...");

  await cleanupWorkDir(generated.workDir);

  console.log(`   ✅ تم تنظيف ملفات العمل المؤقتة`);
  console.log(`   ✅ الفيديو محفوظ في: ${generated.videoPath}`);
  console.log("");

  // ─── الخلاصة ──────────────────────────────────────────────
  console.timeEnd("⏱️  المدة الإجمالية");
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     ✅✅✅  تم بنجاح  ✅✅✅                 ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`📁 الفيديو: ${generated.videoPath}`);
  console.log(`📝 العنوان: ${metadata.title}`);
  console.log(`🏷️  الهاشتاغات: ${metadata.tags.length}`);
  console.log(`🆔 السجل: ${record.id} (READY — مش PUBLISHED)`);
  console.log("");
  console.log("▶️  شغّل الفيديو محلياً وراجع الشكل قبل النشر.");
  console.log("📌 إذا عجبك، اقدر نشوّف النشر الحقيقي.");
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ فشل:", err.message);
  console.error(err.stack);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

/**
 * scheduler.ts
 * نقطة الدخول الرئيسية للـ cron جدولة — هذا الملف خاصو يتشغل كـ process مستقل دائم
 *   pm2 start dist/scheduler.js --name quran-scheduler
 *
 * استراتيجية النشر:
 * - يوتيوب: فيديو رئيسي واحد/يوم (11:15) + فيديو إضافي إذا زاد التفاعل (بوقت تجريبي)
 * - باقي المنصات: فيديوهين/يوم ثابتين (11:15 + 16:00) + زيادة حسب التفاعل
 * - فيديو طويل واحد/الأسبوع (الجمعة)
 */

import cron from "node-cron";
import { ContentType } from "@prisma/client";
import { enqueueContentGeneration } from "./queue/queue";
import { shouldGenerateExtraContent } from "./services/decisionAgent";
import { remainingVideoUploadsToday } from "./services/quotaTracker";
import { notifyDailySummary } from "./services/notifier";
import { collectAllStats, analyzeOptimalHours, persistOptimalHours } from "./services/statsCollector";
import { PrismaClient } from "@prisma/client";
import { getNextPublishTime } from "./services/publishingEngine/experimentManager";
import { getTimezoneOffset, targetHourToUtc } from "./services/publishingEngine/types";

const prisma = new PrismaClient();

/**
 * يحسب وقت 11:15 القادم (بتوقيت المنطقة المستهدفة) ويعيده بصيغة ISO (UTC)
 */
function nextLocalTimeAsUtc(targetHour: number, targetMinute: number): string {
  const now = new Date();
  const utcTargetHour = targetHourToUtc(targetHour);
  const d = new Date(now);
  d.setUTCHours(utcTargetHour, targetMinute, 0, 0);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

// --- 1. يوتيوب رئيسي + جميع المنصات (11:15 بتوقيت المنطقة المستهدفة) ---
cron.schedule("15 11 * * *", async () => {
  console.log("⏰ تشغيل: النشر الرئيسي (يوتيوب + جميع المنصات)");
  const publishAt = nextLocalTimeAsUtc(11, 15);
  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    forcePublishAt: publishAt,
  });
});

// --- 2. المنصات فقط (16:00) — يوتيوب يتخطى ---
cron.schedule("0 16 * * *", async () => {
  console.log("⏰ تشغيل: المنصات فقط (يوتيوب يتخطى)");
  await enqueueContentGeneration({ contentType: ContentType.SHORT, skipYouTube: true });
});

// --- 3. فيديو طويل أسبوعي (الجمعة) ---
cron.schedule("0 14 * * 5", async () => {
  console.log("⏰ تشغيل: الفيديو الطويل الأسبوعي");
  await enqueueContentGeneration({ contentType: ContentType.LONG_VIDEO });
});

// --- 4. فحص "الزيادة حسب التفاعل" للمنصات الأخرى ---
cron.schedule("0 20 * * *", async () => {
  console.log("🤖 فحص: واش نزيدو محتوى إضافي للمنصات؟");
  const decision = await shouldGenerateExtraContent();
  console.log(`القرار: ${decision.shouldGenerate} — ${decision.reasoning}`);

  if (decision.shouldGenerate) {
    await enqueueContentGeneration({
      contentType: ContentType.SHORT,
      isExtra: true,
      skipYouTube: true,
    });
  }
});

// --- 5. فحص تفاعل يوتيوب — إذا زاد، نزيد فيديو تجريبي ---
cron.schedule("30 20 * * *", async () => {
  console.log("📈 فحص: واش نزيدو فيديو إضافي على يوتيوب؟");

  const remainingUploads = await remainingVideoUploadsToday();
  if (remainingUploads <= 1) {
    console.log("⏭️ لا توجد رفعات كافية في Quota");
    return;
  }

  // نجيب متوسط engagement لآخر 5 فيديوهات يوتيوب
  const recentYtVideos = await prisma.publishedContent.findMany({
    where: {
      status: "PUBLISHED",
      youtubeVideoId: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { engagementScore: true, views: true, likes: true, comments: true },
  });

  if (recentYtVideos.length < 3) {
    console.log("⏭️ ما كفاش بيانات التفاعل على يوتيوب");
    return;
  }

  const avgEngagement =
    recentYtVideos.reduce((sum, v) => sum + (v.engagementScore ?? 0), 0) /
    recentYtVideos.length;

  // threshold أعلى من العام — خاص التفاعل يكون فعلاً مرتفع
  const YT_ENGAGEMENT_THRESHOLD = 0.08;
  if (avgEngagement < YT_ENGAGEMENT_THRESHOLD) {
    console.log(`⏭️ تفاعل يوتيوب (${(avgEngagement * 100).toFixed(2)}%) تحت العتبة (${(YT_ENGAGEMENT_THRESHOLD * 100).toFixed(0)}%)`);
    return;
  }

  // نحدد وقت تجريبي باستعمال experimentManager
  const decision = await getNextPublishTime(ContentType.SHORT);
  const publishHour = decision.hour;
  const publishMinute = decision.minute;
  const utcHour = targetHourToUtc(publishHour);

  const now = new Date();
  const scheduledAt = new Date(now);
  scheduledAt.setUTCHours(utcHour, publishMinute, 0, 0);
  if (scheduledAt <= now) scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);

  console.log(`📈 تفاعل يوتيوب مرتفع (${(avgEngagement * 100).toFixed(2)}%) — نزيد فيديو تجريبي في ${publishHour}:${String(publishMinute).padStart(2, "0")} (${decision.reasoning})`);

  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    isExtra: true,
    youtubeOnly: true,
    forcePublishAt: scheduledAt.toISOString(),
  });
});

// --- 6. جمع إحصائيات يوتيوب وتحليل أفضل أوقات النشر ---
cron.schedule("30 22 * * *", async () => {
  console.log("📊 تشغيل: جمع إحصائيات الفيديوهات المنشورة...");
  const updated = await collectAllStats();
  console.log(`📊 تم تحديث ${updated} فيديو`);

  console.log("📊 تحليل أفضل أوقات النشر...");
  const optimal = await analyzeOptimalHours();
  await persistOptimalHours(optimal);
  console.log(`📊 أفضل أوقات النشر: SHORT=${optimal.SHORT.join(",")}, LONG_VIDEO=${optimal.LONG_VIDEO.join(",")}`);
});

// --- 7. ملخص يومي عبر Telegram ---
cron.schedule("0 22 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publishedToday = await prisma.publishedContent.count({
    where: { publishedAt: { gte: today }, status: "PUBLISHED" },
  });

  const quotaRemaining = await remainingVideoUploadsToday();

  const recentExtra = await prisma.agentDecisionLog.findFirst({
    where: {
      decisionType: "EXTRA_SHORT_TRIGGERED",
      createdAt: { gte: today },
    },
    orderBy: { createdAt: "desc" },
  });

  await notifyDailySummary({
    publishedToday,
    quotaRemaining,
    extraContentTriggered: Boolean(
      recentExtra && recentExtra.reasoning.includes("تفعيل")
    ),
  });
});

console.log("📅 Quran Scheduler بدأ التشغيل — فالانتظار على الأوقات المحددة...");

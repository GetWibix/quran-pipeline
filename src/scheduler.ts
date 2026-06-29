/**
 * scheduler.ts
 * الـ cron scheduler المركزي — يدير جدولة النشر لجميع المنصات
 * استراتيجية النشر لكل منصة حسب تفاعلها الفعلي
 */

import cron from "node-cron";
import { ContentType } from "@prisma/client";
import { enqueueContentGeneration } from "./queue/queue";
import { shouldGenerateExtraContent } from "./services/decisionAgent";
import { remainingVideoUploadsToday } from "./services/quotaTracker";
import { notifyDailySummary } from "./services/notifier";
import { collectAllStats, analyzeOptimalHours, persistOptimalHours } from "./services/statsCollector";
import { updatePlatformEngagements, decidePlatformIncreases } from "./services/platformAnalytics";
import { PrismaClient } from "@prisma/client";
import { getNextPublishTime } from "./services/publishingEngine/experimentManager";
import { targetHourToUtc } from "./services/publishingEngine/types";

const prisma = new PrismaClient();
const QUOTA_SAFE_MARGIN = 2;

// ─── النشر الرئيسي — جميع المنصات (11:15) ─────────────────────
cron.schedule("15 11 * * *", async () => {
  console.log("⏰ [11:15] النشر الرئيسي — جميع المنصات");
  const now = new Date();
  const utcHour = targetHourToUtc(11);
  const scheduledAt = new Date(now);
  scheduledAt.setUTCHours(utcHour, 15, 0, 0);
  if (scheduledAt <= now) scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);

  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    forcePublishAt: scheduledAt.toISOString(),
    platformRouting: { youtube: true, facebook: true, instagram: true, threads: true },
  });
});

// ─── المنصات فقط — يوتيوب يتخطى (16:00) ──────────────────────
cron.schedule("0 16 * * *", async () => {
  console.log("⏰ [16:00] المنصات فقط (يوتيوب يتخطى)");
  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    platformRouting: { youtube: false, facebook: true, instagram: true, threads: true },
  });
});

// ─── فيديو طويل أسبوعي (الجمعة) ───────────────────────────────
cron.schedule("0 14 * * 5", async () => {
  console.log("⏰ [الجمعة] الفيديو الطويل الأسبوعي");
  await enqueueContentGeneration({
    contentType: ContentType.LONG_VIDEO,
    platformRouting: { youtube: true, facebook: true, instagram: true, threads: true },
  });
});

// ─── فحص زيادة المحتوى لكل منصة (20:00) ──────────────────────
cron.schedule("0 20 * * *", async () => {
  console.log("🤖 [20:00] فحص تفاعل جميع المنصات — هل نزيد النشر؟");

  const remaining = await remainingVideoUploadsToday();
  if (remaining <= QUOTA_SAFE_MARGIN) {
    console.log("⏭️ لا توجد رفعات كافية في Quota");
    return;
  }

  // نجيب متوسط engagement لكل منصة
  const decisions = await decidePlatformIncreases();
  console.log(`   📊 يوتيوب: ${(decisions.youtube.score * 100).toFixed(2)}% ${decisions.youtube.shouldIncrease ? "↑" : "—"}`);
  console.log(`   📊 فيسبوك: ${(decisions.facebook.score * 100).toFixed(2)}% ${decisions.facebook.shouldIncrease ? "↑" : "—"}`);
  console.log(`   📊 انستغرام: ${(decisions.instagram.score * 100).toFixed(2)}% ${decisions.instagram.shouldIncrease ? "↑" : "—"}`);

  // نبني routing حسب المنصات اللي تفاعلها مرتفع
  const routing = {
    youtube: decisions.youtube.shouldIncrease,
    facebook: decisions.facebook.shouldIncrease,
    instagram: decisions.instagram.shouldIncrease,
    threads: decisions.instagram.shouldIncrease, // تريدز تابع لانستغرام
  };

  const anyIncrease = Object.values(routing).some(Boolean);
  if (!anyIncrease) {
    console.log("⏭️ لا توجد منصة تحتاج زيادة");
    return;
  }

  // نحدد وقت تجريبي باستعمال experimentManager
  const experiment = await getNextPublishTime(ContentType.SHORT);
  const utcHour = targetHourToUtc(experiment.hour);
  const now = new Date();
  const scheduledAt = new Date(now);
  scheduledAt.setUTCHours(utcHour, experiment.minute, 0, 0);
  if (scheduledAt <= now) scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);

  console.log(`📈 نزيد فيديو إضافي: يوتيوب=${routing.youtube}, فيسبوك=${routing.facebook}, انستغرام=${routing.instagram}`);
  console.log(`   الوقت التجريبي: ${experiment.hour}:${String(experiment.minute).padStart(2, "0")} (${experiment.reasoning})`);

  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    isExtra: true,
    platformRouting: routing,
    forcePublishAt: scheduledAt.toISOString(),
  });
});

// ─── جمع إحصائيات يوتيوب (22:30) ─────────────────────────────
cron.schedule("30 22 * * *", async () => {
  console.log("📊 [22:30] جمع إحصائيات يوتيوب...");
  const updated = await collectAllStats();
  console.log(`📊 تم تحديث ${updated} فيديو`);

  console.log("📊 تحليل أفضل أوقات النشر...");
  const optimal = await analyzeOptimalHours();
  await persistOptimalHours(optimal);
  console.log(`📊 أفضل الأوقات: SHORT=${optimal.SHORT.join(",")}, LONG=${optimal.LONG_VIDEO.join(",")}`);
});

// ─── جمع إحصائيات فيسبوك وانستغرام (23:00) ────────────────────
cron.schedule("0 23 * * *", async () => {
  console.log("📊 [23:00] جمع إحصائيات فيسبوك وانستغرام...");
  const result = await updatePlatformEngagements();
  console.log(`📊 تم تحديث ${result.updated} فيديو`);
  console.log(`   فيسبوك: ${result.facebook.count} فيديو - متوسط التفاعل ${(result.facebook.avgEngagement * 100).toFixed(2)}%`);
  console.log(`   انستغرام: ${result.instagram.count} فيديو - متوسط التفاعل ${(result.instagram.avgEngagement * 100).toFixed(2)}%`);
});

// ─── ملخص يومي (22:00) ─────────────────────────────────────────
cron.schedule("0 22 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publishedToday = await prisma.publishedContent.count({
    where: { publishedAt: { gte: today }, status: "PUBLISHED" },
  });

  const quotaRemaining = await remainingVideoUploadsToday();

  const lastExtra = await prisma.agentDecisionLog.findFirst({
    where: {
      decisionType: "EXTRA_SHORT_TRIGGERED",
      createdAt: { gte: today },
    },
    orderBy: { createdAt: "desc" },
  });

  await notifyDailySummary({
    publishedToday,
    quotaRemaining,
    extraContentTriggered: Boolean(lastExtra && lastExtra.reasoning.includes("زيادة")),
  });
});

console.log("📅 Quran Scheduler — تشغيل cron jobs...");

/**
 * scheduler.ts
 * نقطة الدخول الرئيسية للـ cron جدولة — هذا الملف خاصو يتشغل كـ process مستقل دائم
 *   pm2 start dist/scheduler.js --name quran-scheduler
 *
 * الوتيرة الافتراضية:
 * - 2 Shorts/اليوم بشكل ثابت (8:00 صباحاً و 16:00 مساءً، بتوقيت السيرفر/UTC)
 * - فيديو طويل واحد/الأسبوع (الجمعة) — حجم أكبر، تكرار أقل منطقي
 * - فحص يومي إذا "الوكيل" يستحق يزيد محتوى إضافي (حسب التفاعل + Quota المتاحة)
 * - تقرير يومي ملخص عبر Telegram فآخر النهار
 */

import cron from "node-cron";
import { ContentType } from "@prisma/client";
import { enqueueContentGeneration } from "./queue/queue";
import { shouldGenerateExtraContent } from "./services/decisionAgent";
import { remainingVideoUploadsToday } from "./services/quotaTracker";
import { notifyDailySummary } from "./services/notifier";
import { collectAllStats, analyzeOptimalHours, persistOptimalHours } from "./services/statsCollector";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- 1. Shorts ثابتة: مرتين فاليوم ---
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ تشغيل: Short الصباح");
  await enqueueContentGeneration({ contentType: ContentType.SHORT });
});

cron.schedule("0 16 * * *", async () => {
  console.log("⏰ تشغيل: Short المساء");
  await enqueueContentGeneration({ contentType: ContentType.SHORT });
});

// --- 2. فيديو طويل أسبوعي (الجمعة، يوم مناسب دينياً لمحتوى أطول) ---
cron.schedule("0 14 * * 5", async () => {
  console.log("⏰ تشغيل: الفيديو الطويل الأسبوعي");
  await enqueueContentGeneration({ contentType: ContentType.LONG_VIDEO });
});

// --- 3. فحص "الزيادة حسب التفاعل" — مرة فاليوم (بعد المساء، وقت تجمّع بيانات كافية) ---
cron.schedule("0 20 * * *", async () => {
  console.log("🤖 فحص: واش نزيدو محتوى إضافي اليوم؟");
  const decision = await shouldGenerateExtraContent();
  console.log(`القرار: ${decision.shouldGenerate} — ${decision.reasoning}`);

  if (decision.shouldGenerate) {
    await enqueueContentGeneration({
      contentType: ContentType.SHORT,
      isExtra: true,
    });
  }
});

// --- 4. جمع إحصائيات يوتيوب وتحليل أفضل أوقات النشر (آخر النهار) ---
cron.schedule("30 22 * * *", async () => {
  console.log("📊 تشغيل: جمع إحصائيات الفيديوهات المنشورة...");
  const updated = await collectAllStats();
  console.log(`📊 تم تحديث ${updated} فيديو`);

  console.log("📊 تحليل أفضل أوقات النشر...");
  const optimal = await analyzeOptimalHours();
  await persistOptimalHours(optimal);
  console.log(`📊 أفضل أوقات النشر: SHORT=${optimal.SHORT.join(",")}, LONG_VIDEO=${optimal.LONG_VIDEO.join(",")}`);
});

// --- 5. ملخص يومي عبر Telegram (آخر النهار) ---
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

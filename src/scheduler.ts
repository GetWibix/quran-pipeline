/**
 * scheduler.ts
 * الـ cron scheduler المركزي — يدير جدولة النشر لجميع المنصات
 * استراتيجية النشر لكل منصة حسب تفاعلها الفعلي
 *
 * استراتيجية فيسبوك الذكية:
 * - أساسي: 3 فيديوهات/يوم (10:00, 11:15, 16:00)
 * - تكيفي: +3 إضافية حسب التفاعل (18:00, 20:00, 22:00)
 * - الحد الأقصى: 6 فيديوهات/يوم
 * - النظام يقلل تلقائياً إذا التفاعل ضعيف
 */

import cron from "node-cron";
import { ContentType } from "@prisma/client";
import { enqueueContentGeneration, contentQueue } from "./queue/queue";
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
const FB_MAX_DAILY = 6;
const FB_BASE_COUNT = 3; // 10:00 + 11:15 + 16:00

async function getTodayFacebookCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.publishedContent.count({
    where: {
      facebookVideoId: { not: null },
      publishedAt: { gte: today },
      status: "PUBLISHED",
    },
  });
}

async function shouldAddFacebookSlot(label: string): Promise<boolean> {
  const count = await getTodayFacebookCount();
  if (count >= FB_MAX_DAILY) {
    console.log(`⏭️ [${label}] وصلنا الحد الأقصى (${FB_MAX_DAILY}) — تخطي`);
    return false;
  }
  const decisions = await decidePlatformIncreases();
  const fbScore = (decisions.facebook.score * 100).toFixed(2);
  if (!decisions.facebook.shouldIncrease) {
    console.log(`⏭️ [${label}] تفاعل فيسبوك (${fbScore}%) أقل من العتبة — تخطي`);
    return false;
  }
  console.log(`✅ [${label}] تفاعل فيسبوك (${fbScore}%) — ننشر (${count + 1}/${FB_MAX_DAILY})`);
  return true;
}

async function enqueueFacebookShort(scheduledHour: number, scheduledMinute: number, forcePublishAt?: string) {
  const now = new Date();
  const utcHour = targetHourToUtc(scheduledHour);
  const scheduledAt = forcePublishAt ? new Date(forcePublishAt) : new Date(now);
  if (!forcePublishAt) {
    scheduledAt.setUTCHours(utcHour, scheduledMinute, 0, 0);
    if (scheduledAt <= now) scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);
  }

  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    platformRouting: { youtube: false, facebook: true, instagram: true, threads: true },
    forcePublishAt: scheduledAt.toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════════
// 🟢 BASE — 3 فيديوهات أساسية فيسبوك (مضمونة يومياً)
// ═══════════════════════════════════════════════════════════════

// ─── 10:00 — فيسبوك + انستغرام + تريدز (YouTube لا) ────────
cron.schedule("0 10 * * *", async () => {
  console.log("⏰ [10:00] فيسبوك + انستغرام + تريدز");
  await enqueueFacebookShort(10, 0);
});

// ─── 11:15 — جميع المنصات ─────────────────────────────────────
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

// ─── 16:00 — المنصات فقط (يوتيوب يتخطى) ──────────────────────
cron.schedule("0 16 * * *", async () => {
  console.log("⏰ [16:00] المنصات فقط (يوتيوب يتخطى)");
  await enqueueContentGeneration({
    contentType: ContentType.SHORT,
    platformRouting: { youtube: false, facebook: true, instagram: true, threads: true },
  });
});

// ═══════════════════════════════════════════════════════════════
// 🟡 ADAPTIVE — فيديوهات إضافية حسب التفاعل (حتى 6)
// ═══════════════════════════════════════════════════════════════

// ─── 18:00 — فيسبوك + انستغرام + تريدز (إذا التفاعل كويس) ──
cron.schedule("0 18 * * *", async () => {
  console.log("⏰ [18:00] فحص — هل نزيد فيسبوك؟");
  if (await shouldAddFacebookSlot("18:00")) {
    await enqueueFacebookShort(18, 0);
  }
});

// ─── 20:00 — فحص زيادة المحتوى لكل المنصات ─────────────────
cron.schedule("0 20 * * *", async () => {
  console.log("🤖 [20:00] فحص تفاعل جميع المنصات — هل نزيد النشر؟");

  const remaining = await remainingVideoUploadsToday();
  if (remaining <= QUOTA_SAFE_MARGIN) {
    console.log("⏭️ لا توجد رفعات كافية في Quota يوتيوب — ننشر فيسبوك فقط");
    // حتى لو Quota يوتيوب خلص، نقدر ننشر فيسبوك
    if (await shouldAddFacebookSlot("20:00")) {
      await enqueueFacebookShort(20, 0);
    }
    return;
  }

  const decisions = await decidePlatformIncreases();
  console.log(`   📊 يوتيوب: ${(decisions.youtube.score * 100).toFixed(2)}% ${decisions.youtube.shouldIncrease ? "↑" : "—"}`);
  console.log(`   📊 فيسبوك: ${(decisions.facebook.score * 100).toFixed(2)}% ${decisions.facebook.shouldIncrease ? "↑" : "—"}`);
  console.log(`   📊 انستغرام: ${(decisions.instagram.score * 100).toFixed(2)}% ${decisions.instagram.shouldIncrease ? "↑" : "—"}`);

  const fbCount = await getTodayFacebookCount();
  const hasRoomForFb = fbCount < FB_MAX_DAILY && decisions.facebook.shouldIncrease;
  const ytWants = decisions.youtube.shouldIncrease;

  if (!hasRoomForFb && !ytWants) {
    console.log("⏭️ لا توجد منصة تحتاج زيادة");
    return;
  }

  if (hasRoomForFb) {
    console.log(`✅ فيسبوك: نزيد (${fbCount + 1}/${FB_MAX_DAILY})`);
    await enqueueFacebookShort(20, 0);
  }

  if (ytWants && remaining > QUOTA_SAFE_MARGIN + 1) {
    const experiment = await getNextPublishTime(ContentType.SHORT);
    const utcHour = targetHourToUtc(experiment.hour);
    const now = new Date();
    const scheduledAt = new Date(now);
    scheduledAt.setUTCHours(utcHour, experiment.minute, 0, 0);
    if (scheduledAt <= now) scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 1);

    console.log(`📈 نزيد فيديو يوتيوب في ${experiment.hour}:${String(experiment.minute).padStart(2, "0")}`);
    await enqueueContentGeneration({
      contentType: ContentType.SHORT,
      isExtra: true,
      platformRouting: {
        youtube: true,
        facebook: false,
        instagram: false,
        threads: false,
      },
      forcePublishAt: scheduledAt.toISOString(),
    });
  }
});

// ─── 22:00 — فرصة أخيرة لفيسبوك إذا لسه ما وصلناش الحد ────
cron.schedule("0 22 * * *", async () => {
  console.log("⏰ [22:00] فرصة أخيرة لفيسبوك");
  const fbCount = await getTodayFacebookCount();
  if (fbCount < FB_BASE_COUNT) {
    // أقل من الأساسي! ننشر فوراً بدون فحص (نعوض الناقص)
    console.log(`⚠️ تم نشر ${fbCount} فيسبوك فقط اليوم — نعوض`);
    await enqueueFacebookShort(22, 0);
  } else if (fbCount < FB_MAX_DAILY && await shouldAddFacebookSlot("22:00")) {
    await enqueueFacebookShort(22, 0);
  } else {
    console.log(`⏭️ [22:00] وصلنا ${fbCount} فيسبوك — مكفي`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 🟠 بوسترات فيسبوك — صور قرآنية
// ═══════════════════════════════════════════════════════════════

// ─── 09:00 — بوستر صباحي (فيسبوك فقط) ─────────────────────────
cron.schedule("0 9 * * *", async () => {
  console.log("🖼️ [09:00] بوستر صباحي");
  await contentQueue.add("generate-and-publish", {
    contentType: "POSTER" as any,
    platformRouting: { youtube: false, facebook: true, instagram: false, threads: false },
  });
});

// ═══════════════════════════════════════════════════════════════
// 🟣 فيديو طويل أسبوعي (الجمعة)
// ═══════════════════════════════════════════════════════════════

cron.schedule("0 14 * * 5", async () => {
  console.log("⏰ [الجمعة] الفيديو الطويل الأسبوعي");
  await enqueueContentGeneration({
    contentType: ContentType.LONG_VIDEO,
    platformRouting: { youtube: true, facebook: true, instagram: true, threads: true },
  });
});

// ═══════════════════════════════════════════════════════════════
// 📊 جمع الإحصائيات
// ═══════════════════════════════════════════════════════════════

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

// ─── تحديث توكن فيسبوك التلقائي ─────────────────────────────
cron.schedule("0 3 * * *", async () => {
  console.log("🔄 [03:00] فحص صلاحية توكن فيسبوك...");

  const { checkTokenHealth, refreshFacebookToken, updateEnvInPlace } =
    await import("./services/tokenRefresher");

  try {
    const health = await checkTokenHealth();
    if (health.shouldRefresh) {
      console.log(`⚠️ التوكن على وشك الانتهاء (باقي ${health.daysRemaining} يوم) — جاري التحديث...`);
      if (!process.env.META_USER_ACCESS_TOKEN) {
        console.warn("⚠️ META_USER_ACCESS_TOKEN غير موجود — لا يمكن التحديث التلقائي");
        return;
      }
      const result = await refreshFacebookToken();
      await updateEnvInPlace({
        META_USER_ACCESS_TOKEN: result.userToken,
        META_PAGE_ACCESS_TOKEN: result.pageToken,
      });
      console.log("✅ تم تحديث توكن فيسبوك تلقائياً");
    } else {
      console.log(`✅ توكن فيسبوك سليم (باقي ${health.daysRemaining} يوم)`);
    }
  } catch (err) {
    console.error(`❌ فشل تحديث توكن فيسبوك: ${err instanceof Error ? err.message : String(err)}`);
  }
});

// ─── ملخص يومي (22:00) ─────────────────────────────────────────
cron.schedule("0 22 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publishedToday = await prisma.publishedContent.count({
    where: { publishedAt: { gte: today }, status: "PUBLISHED" },
  });

  const fbToday = await getTodayFacebookCount();
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

  console.log(`📊 ملخص اليوم: ${publishedToday} فيديو (فيسبوك: ${fbToday})`);
});

console.log("📅 Quran Scheduler — تشغيل cron jobs...");
console.log(`📋 استراتيجية فيسبوك: ${FB_BASE_COUNT} أساسي + تكيفي حتى ${FB_MAX_DAILY}/يوم`);

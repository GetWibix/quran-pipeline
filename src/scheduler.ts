import cron from "node-cron";
import { ContentType } from "@prisma/client";
import { enqueueContentGeneration, contentQueue, connection } from "./queue/queue";
import { remainingVideoUploadsToday } from "./services/quotaTracker";
import { notifyDailySummary } from "./services/notifier";
import { collectAllStats, analyzeOptimalHours, persistOptimalHours } from "./services/statsCollector";
import { updatePlatformEngagements, decidePlatformIncreases } from "./services/platformAnalytics";
import { PrismaClient } from "@prisma/client";
import { targetHourToUtc } from "./services/publishingEngine/types";

const prisma = new PrismaClient();
const QUOTA_SAFE_MARGIN = 2;
const FB_MAX_DAILY = 6;
const FB_BASE_COUNT = 3;

const REDIS_EXTRA_KEY = "tomorrow_extra_count";

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
  console.log(`✅ [${label}] تفاعل فيسبوك (${fbScore}%)`);
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
    platformRouting: { youtube: false, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true },
    forcePublishAt: scheduledAt.toISOString(),
  });
}

/** تحسب وقت النشر لليوم الحالي (مستقبلياً) */
function todaySlot(hour: number, minute: number): Date {
  const utcHour = targetHourToUtc(hour);
  const slot = new Date();
  slot.setUTCHours(utcHour, minute, 0, 0);
  if (slot <= new Date()) slot.setUTCDate(slot.getUTCDate() + 1);
  return slot;
}

// ═══════════════════════════════════════════════════════════════
// 🌙 BATCH — التوليد الليلي (كل الفيديوهات لليوم الحالي)
// ═══════════════════════════════════════════════════════════════

cron.schedule("0 2 * * *", async () => {
  console.log("🌙 [02:00] بدء التوليد الليلي لكل فيديوهات اليوم...");

  const extraCount = Math.min(
    parseInt(await connection.get(REDIS_EXTRA_KEY).catch(() => "0") || "0"),
    3,
  );
  await connection.set(REDIS_EXTRA_KEY, "0");
  if (extraCount > 0) console.log(`📈 تم طلب ${extraCount} فيديو إضافي من التفاعل`);

  const baseJobs = [
    { hour: 10, min: 0, route: { youtube: false, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
    { hour: 11, min: 15, route: { youtube: true, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
    { hour: 16, min: 0, route: { youtube: false, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
  ];

  const extraSlots = [
    { hour: 18, min: 0, route: { youtube: false, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
    { hour: 20, min: 0, route: { youtube: true, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
    { hour: 22, min: 0, route: { youtube: false, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true } },
  ];

  for (const job of baseJobs) {
    const scheduledAt = todaySlot(job.hour, job.min);
    console.log(`   📋 ${job.hour}:${String(job.min).padStart(2, "0")} — إنشاء الفيديو`);
    await enqueueContentGeneration({
      contentType: ContentType.SHORT,
      platformRouting: job.route,
      forcePublishAt: scheduledAt.toISOString(),
    });
  }

  for (let i = 0; i < extraCount; i++) {
    const slot = extraSlots[i];
    const scheduledAt = todaySlot(slot.hour, slot.min);
    console.log(`   📋 ${slot.hour}:${String(slot.min).padStart(2, "0")} — فيديو إضافي (تفاعل)`);
    await enqueueContentGeneration({
      contentType: ContentType.SHORT,
      isExtra: true,
      platformRouting: slot.route,
      forcePublishAt: scheduledAt.toISOString(),
    });
  }

  console.log(`✅ [02:00] تم إنشاء ${baseJobs.length + extraCount} مهمة توليد`);
});

// ═══════════════════════════════════════════════════════════════
// 🎥 فيديو الجمعة الطويل — يُولّد ليلة الخميس لينزل مع الفجر
// ═══════════════════════════════════════════════════════════════

cron.schedule("0 22 * * 4", async () => {
  const longSlot = todaySlot(4, 30);
  console.log(`   📋 الجمعة ${longSlot.toISOString()} — سورة الكهف (فجر الجمعة)`);
  await enqueueContentGeneration({
    contentType: ContentType.LONG_VIDEO,
    platformRouting: { youtube: true, facebook: true, instagram: true, threads: true, facebookStory: true, instagramStory: true },
    forcePublishAt: longSlot.toISOString(),
    forceSurahNumber: 18,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🟠 بوسترات فيسبوك (توليد + نشر فوري — خفيف)
// ═══════════════════════════════════════════════════════════════

cron.schedule("0 9 * * *", async () => {
  console.log("🖼️ [09:00] بوستر صباحي");
  await contentQueue.add("generate-and-publish", {
    contentType: "POSTER" as any,
    platformRouting: { youtube: false, facebook: true, instagram: false, threads: false },
  });
});

cron.schedule("0 13 * * *", async () => {
  console.log("🖼️ [13:00] بوستر ظهيرة");
  await contentQueue.add("generate-and-publish", {
    contentType: "POSTER" as any,
    platformRouting: { youtube: false, facebook: true, instagram: false, threads: false },
  });
});

cron.schedule("0 19 * * *", async () => {
  console.log("🖼️ [19:00] بوستر مسائي");
  await contentQueue.add("generate-and-publish", {
    contentType: "POSTER" as any,
    platformRouting: { youtube: false, facebook: true, instagram: false, threads: false },
  });
});

// ═══════════════════════════════════════════════════════════════
// 🟡 ADAPTIVE — تسجيل قرارات التفاعل لليوم التالي
// ═══════════════════════════════════════════════════════════════

// ─── 20:00 — فحص التفاعل وتخزين القرار لبكرة ────────────────
cron.schedule("0 20 * * *", async () => {
  console.log("🤖 [20:00] فحص تفاعل — هل نزيد فيديوهات بكرة؟");

  const fbDecisions = await decidePlatformIncreases();
  let extraCount = 0;

  if (fbDecisions.facebook.shouldIncrease) {
    extraCount++;
    console.log(`   📈 فيسبوك ${(fbDecisions.facebook.score * 100).toFixed(2)}% — نضيف`);
  } else {
    console.log(`   📊 فيسبوك ${(fbDecisions.facebook.score * 100).toFixed(2)}% — لا زيادة`);
  }

  const remaining = await remainingVideoUploadsToday();
  if (fbDecisions.instagram.shouldIncrease && extraCount < 3) {
    extraCount++;
    console.log(`   📈 انستغرام ${(fbDecisions.instagram.score * 100).toFixed(2)}% — نضيف`);
  }

  if (fbDecisions.youtube.shouldIncrease && remaining > QUOTA_SAFE_MARGIN && extraCount < 3) {
    extraCount++;
    console.log(`   📈 يوتيوب ${(fbDecisions.youtube.score * 100).toFixed(2)}% — نضيف`);
  }

  if (extraCount > 0) {
    await connection.set(REDIS_EXTRA_KEY, String(extraCount));
    console.log(`✅ [20:00] تم تخزين ${extraCount} فيديو إضافي للتوليد الليلي`);
  } else {
    console.log(`⏭️ [20:00] لا توجد منصة تحتاج زيادة — بكرة التوليد الأساسي فقط`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 جمع الإحصائيات
// ═══════════════════════════════════════════════════════════════

cron.schedule("30 22 * * *", async () => {
  console.log("📊 [22:30] جمع إحصائيات يوتيوب...");
  const updated = await collectAllStats();
  console.log(`📊 تم تحديث ${updated} فيديو`);

  console.log("📊 تحليل أفضل أوقات النشر...");
  const optimal = await analyzeOptimalHours();
  await persistOptimalHours(optimal);
  console.log(`📊 أفضل الأوقات: SHORT=${optimal.SHORT.join(",")}, LONG=${optimal.LONG_VIDEO.join(",")}`);
});

cron.schedule("0 23 * * *", async () => {
  console.log("📊 [23:00] جمع إحصائيات فيسبوك وانستغرام...");
  const result = await updatePlatformEngagements();
  console.log(`📊 تم تحديث ${result.updated} فيديو`);
  console.log(`   فيسبوك: ${result.facebook.count} فيديو - متوسط التفاعل ${(result.facebook.avgEngagement * 100).toFixed(2)}%`);
  console.log(`   انستغرام: ${result.instagram.count} فيديو - متوسط التفاعل ${(result.instagram.avgEngagement * 100).toFixed(2)}%`);
});

// ═══════════════════════════════════════════════════════════════
// 🔄 تحديث توكن فيسبوك التلقائي
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// 📋 ملخص يومي
// ═══════════════════════════════════════════════════════════════

cron.schedule("0 22 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const publishedToday = await prisma.publishedContent.count({
    where: { publishedAt: { gte: today }, status: "PUBLISHED" },
  });

  const fbToday = await getTodayFacebookCount();
  const quotaRemaining = await remainingVideoUploadsToday();

  await notifyDailySummary({
    publishedToday,
    quotaRemaining,
    extraContentTriggered: false,
  });

  console.log(`📊 ملخص اليوم: ${publishedToday} فيديو (فيسبوك: ${fbToday})`);
});

console.log("📅 Quran Scheduler — تشغيل cron jobs...");
console.log(`🌙 التوليد الليلي 02:00 | 📊 إحصائيات 22:30, 23:00 | 🔄 توكن 03:00`);

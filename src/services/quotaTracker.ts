/**
 * quotaTracker.ts
 * كيتتبع استهلاك YouTube Data API v3 quota اليومي (سقف افتراضي = 10,000 units/يوم)
 * وكيمنع أي عملية رفع إذا الموارد المتبقية غير كافية
 *
 * تكلفة العمليات الرئيسية (ثابتة من توثيق Google):
 * - videos.insert (رفع فيديو)        => 1600 units
 * - videos.update (تعديل metadata)   => 50 units
 * - thumbnails.set (تعيين صورة مصغرة) => 50 units
 * - videos.list / search (قراءة)     => 1-5 units (نستخدمها لسحب الـ analytics)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const QUOTA_COSTS = {
  VIDEO_INSERT: 1600,
  VIDEO_UPDATE: 50,
  THUMBNAIL_SET: 50,
  ANALYTICS_READ: 5,
} as const;

// السقف اليومي الرسمي = 10,000، لكن كنخليو مجال أمان (نتوقفو عند 8,500)
// لتفادي ما يصرا تجاوز بسبب عمليات قراءة/تحديث إضافية بعد الرفع
const DAILY_SAFETY_LIMIT = 8500;

function todayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * كيرجع الاستهلاك الحالي لليوم (UTC، نفس توقيت إعادة تصفير Google quota)
 */
export async function getTodayUsage(): Promise<number> {
  const record = await prisma.quotaUsage.findUnique({
    where: { date: todayUTC() },
  });
  return record?.unitsUsed ?? 0;
}

/**
 * كيتأكد واش العملية المطلوبة ممكنة بدون تجاوز السقف الآمن
 * خاص يُستدعى قبل أي عملية API فعلية
 */
export async function canAfford(unitsNeeded: number): Promise<boolean> {
  const used = await getTodayUsage();
  return used + unitsNeeded <= DAILY_SAFETY_LIMIT;
}

/**
 * كيسجل استهلاك units بعد نجاح عملية API فعلية
 */
export async function recordUsage(units: number): Promise<void> {
  const date = todayUTC();
  await prisma.quotaUsage.upsert({
    where: { date },
    create: { date, unitsUsed: units },
    update: { unitsUsed: { increment: units } },
  });
}

/**
 * كيرجع عدد الفيديوهات المتبقية اللي يمكن رفعها اليوم (تقدير تقريبي)
 * مفيد للـ Decision Agent باش يعرف واش يقدر "يزيد" فيديو إضافي أو لا
 */
export async function remainingVideoUploadsToday(): Promise<number> {
  const used = await getTodayUsage();
  const remaining = DAILY_SAFETY_LIMIT - used;
  if (remaining <= 0) return 0;
  return Math.floor(remaining / QUOTA_COSTS.VIDEO_INSERT);
}

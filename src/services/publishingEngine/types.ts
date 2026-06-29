import { ContentType } from "@prisma/client";

export interface PublishDecision {
  hour: number;      // بتوقيت المنطقة المستهدفة
  minute: number;
  isExperimental: boolean;
  reasoning: string;
}

export interface PerformanceMetrics {
  views: number;
  likes: number;
  comments: number;
  watchTimeMinutes: number;
  ctr: number | null;
  subscribersGained: number;
}

export interface TimeSlotEvaluation {
  contentType: string;
  hour: number;    // بتوقيت المنطقة المستهدفة
  minute: number;
  performanceScore: number;
  confidence: number;
  sampleCount: number;
}

export interface AdaptiveCandidate {
  baseHour: number; // بتوقيت المنطقة المستهدفة
  offsets: number[];
}

export interface ReportData {
  periodStart: Date;
  periodEnd: Date;
  totalVideos: number;
  experimentsCount: number;
  bestSlot: { hour: number; minute: number; score: number } | null;
  worstSlot: { hour: number; minute: number; score: number } | null;
  avgPerformanceScore: number;
  improvementRate: number;
  recommendations: string[];
}

export const PERFORMANCE_WEIGHTS = {
  views: 0.25,
  watchTimeMinutes: 0.25,
  likes: 0.20,
  comments: 0.20,
  ctr: 0.10,
} as const;

export const MAX_EXPECTED = {
  views: 10000,
  likes: 500,
  comments: 50,
  watchTimeMinutes: 1000,
  ctr: 0.2,
} as const;

export const MIN_SAMPLES_FOR_CONFIDENCE = 10;
export const ANALYSIS_DELAY_HOURS = 48;
export const EXPLORATION_RATE = 0.30;
export const EXPLOITATION_RATE = 0.70;

/** ساعات التجربة بتوقيت المنطقة المستهدفة (6:00 صباحاً - 11:00 مساءً) */
export const EXPERIMENTAL_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

export const CONFIDENCE_THRESHOLD = 0.8;
export const MIN_SAMPLES_FOR_ADAPTIVE = 20;

/**
 * وقت النشر الافتراضي (الاحتياطي) — يتم استعماله قبل ما يجمع المحرك بيانات كافية.
 * يقرأ من متغيرات البيئة:
 *   DEFAULT_PUBLISH_HOUR   (0-23, افتراضي 8 صباحاً)
 *   DEFAULT_PUBLISH_MINUTE (0-59, افتراضي 0)
 */
function getDefaultPublishHour(): number {
  const val = process.env.DEFAULT_PUBLISH_HOUR;
  if (val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 23) return n;
  }
  return 8; // 8 صباحاً بتوقيت المنطقة المستهدفة
}

function getDefaultPublishMinute(): number {
  const val = process.env.DEFAULT_PUBLISH_MINUTE;
  if (val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 59) return n;
  }
  return 0;
}

/**
 * فرق التوقيت عن UTC للمنطقة المستهدفة.
 * يقرأ من متغير البيئة PUBLISH_TIMEZONE_OFFSET، افتراضي 3 (السعودية).
 */
function getTimezoneOffset(): number {
  const val = process.env.PUBLISH_TIMEZONE_OFFSET;
  if (val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= -12 && n <= 14) return n;
  }
  return 3;
}

/**
 * يحول ساعة من توقيت المنطقة المستهدفة إلى UTC
 */
export function targetHourToUtc(targetHour: number): number {
  const offset = getTimezoneOffset();
  let utc = targetHour - offset;
  if (utc < 0) utc += 24;
  if (utc >= 24) utc -= 24;
  return utc;
}

/**
 * يحول ساعة من UTC إلى توقيت المنطقة المستهدفة
 */
export function utcHourToTarget(utcHour: number): number {
  const offset = getTimezoneOffset();
  let target = utcHour + offset;
  if (target < 0) target += 24;
  if (target >= 24) target -= 24;
  return target;
}

export { getTimezoneOffset, getDefaultPublishHour, getDefaultPublishMinute };

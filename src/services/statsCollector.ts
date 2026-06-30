/**
 * statsCollector.ts
 * يجيب إحصائيات الفيديوهات المنشورة من يوتيوب، ويحلل أفضل أوقات النشر
 * بناءً على المشاهدات الفعلية.
 */

import { PrismaClient, ContentType } from "@prisma/client";
import { fetchVideoStats } from "./youtubePublisher";

const prisma = new PrismaClient();

export interface OptimalHours {
  SHORT: number[];
  LONG_VIDEO: number[];
  POSTER: number[];
}

const DEFAULT_OPTIMAL_HOURS: OptimalHours = {
  SHORT: [12, 17, 20, 4],
  LONG_VIDEO: [17],
  POSTER: [9],
};

/**
 * يسحب إحصائيات كل الفيديوهات المنشورة اللي عندها youtubeVideoId
 * وما زالت ما تحدثتش إحصائياتها اليوم.
 * كيستهلك ~5 units لكل فيديو (YouTube API quota).
 */
export async function collectAllStats(): Promise<number> {
  const videos = await prisma.publishedContent.findMany({
    where: {
      status: "PUBLISHED",
      youtubeVideoId: { not: null },
    },
    select: { id: true, youtubeVideoId: true, publishedAt: true, views: true },
  });

  if (videos.length === 0) {
    console.log("📊 ما كاينش فيديوهات منشورة باش نجيب إحصائياتهم");
    return 0;
  }

  let updated = 0;
  for (const video of videos) {
    try {
      const stats = await fetchVideoStats(video.youtubeVideoId!);
      const engagementScore = calculateEngagementScore(stats.views, stats.likes, stats.comments);

      await prisma.publishedContent.update({
        where: { id: video.id },
        data: {
          views: stats.views,
          likes: stats.likes,
          comments: stats.comments,
          engagementScore,
        },
      });
      updated++;
    } catch (err) {
      console.warn(`⚠️ فشل جلب إحصائيات ${video.id}:`, err instanceof Error ? err.message : err);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`📊 تم تحديث ${updated}/${videos.length} فيديو`);
  return updated;
}

function calculateEngagementScore(views: number, likes: number, comments: number): number {
  if (views === 0) return 0;
  return (likes + comments) / views;
}

/**
 * يحلل أفضل أوقات النشر حسب المشاهدات الفعلية.
 * كيرجع ترتيب الساعات (0-23 UTC) من الأعلى مشاهدات للأقل.
 */
export async function analyzeOptimalHours(): Promise<OptimalHours> {
  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result: OptimalHours = {
    SHORT: [...DEFAULT_OPTIMAL_HOURS.SHORT],
    LONG_VIDEO: [...DEFAULT_OPTIMAL_HOURS.LONG_VIDEO],
    POSTER: [...DEFAULT_OPTIMAL_HOURS.POSTER],
  };

  for (const ct of ["SHORT", "LONG_VIDEO", "POSTER"] as ContentType[]) {
    const videos = await prisma.publishedContent.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ct,
        publishedAt: { gte: THIRTY_DAYS_AGO },
        views: { gt: 0 },
      },
      select: { publishedAt: true, views: true, likes: true, comments: true },
    });

    if (videos.length < 3) {
      console.log(`📊 ${ct}: ما كفاش البيانات (${videos.length}) → نخليو القيم الافتراضية`);
      continue;
    }

    const hourBuckets: Map<number, { views: number[]; count: number }> = new Map();
    for (let h = 0; h < 24; h++) hourBuckets.set(h, { views: [], count: 0 });

    for (const v of videos) {
      if (!v.publishedAt) continue;
      const hour = v.publishedAt.getUTCHours();
      const bucket = hourBuckets.get(hour)!;
      bucket.views.push(v.views);
      bucket.count++;
    }

    const hourAvg: { hour: number; avgViews: number }[] = [];
    for (const [hour, data] of hourBuckets) {
      if (data.count === 0) continue;
      const avgViews = data.views.reduce((a, b) => a + b, 0) / data.count;
      hourAvg.push({ hour, avgViews });
    }

    hourAvg.sort((a, b) => b.avgViews - a.avgViews);

    if (hourAvg.length > 0) {
      result[ct] = hourAvg.slice(0, 4).map((h) => h.hour);
      console.log(`📊 ${ct}: أحسن أوقات النشر: ${result[ct].map((h) => `${h}:00`).join(", ")}`);
    }
  }

  return result;
}

/**
 * يسجل أحسن أوقات النشر في AgentDecisionLog للشفافية والتدقيق
 */
export async function persistOptimalHours(hours: OptimalHours): Promise<void> {
  const { PrismaClient: PC } = await import("@prisma/client");
  const p = new PC();
  await p.agentDecisionLog.create({
    data: {
      decisionType: "OPTIMAL_HOURS_UPDATE",
      reasoning: `تم تحليل بيانات 30 يوم وتحديث أوقات النشر.`,
      contextData: hours as any,
    },
  });
  await p.$disconnect();
}

/**
 * يجيب آخر أوقات نشر محفوظة من التحليل، أو يرجع الافتراضية
 */
export async function getOptimalHours(): Promise<OptimalHours> {
  const lastLog = await prisma.agentDecisionLog.findFirst({
    where: { decisionType: "OPTIMAL_HOURS_UPDATE" },
    orderBy: { createdAt: "desc" },
  });

  if (lastLog?.contextData) {
    const data = lastLog.contextData as Record<string, unknown>;
    return {
      SHORT: Array.isArray(data.SHORT) ? (data.SHORT as number[]) : DEFAULT_OPTIMAL_HOURS.SHORT,
      LONG_VIDEO: Array.isArray(data.LONG_VIDEO) ? (data.LONG_VIDEO as number[]) : DEFAULT_OPTIMAL_HOURS.LONG_VIDEO,
      POSTER: Array.isArray(data.POSTER) ? (data.POSTER as number[]) : DEFAULT_OPTIMAL_HOURS.POSTER,
    };
  }

  return DEFAULT_OPTIMAL_HOURS;
}

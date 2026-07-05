import { ContentType } from "@prisma/client";
import { fetchVideoStats } from "../youtubePublisher";
import { canAfford, QUOTA_COSTS } from "../quotaTracker";
import prisma from "../../lib/prisma";
import {
  PerformanceMetrics,
  TimeSlotEvaluation,
  PERFORMANCE_WEIGHTS,
  MAX_EXPECTED,
  MIN_SAMPLES_FOR_CONFIDENCE,
  ANALYSIS_DELAY_HOURS,
} from "./types";
import { recordPatternPerformance } from "../seoEngine";

function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  const normalizedViews = Math.min(metrics.views / MAX_EXPECTED.views, 1);
  const normalizedLikes = Math.min(metrics.likes / MAX_EXPECTED.likes, 1);
  const normalizedComments = Math.min(metrics.comments / MAX_EXPECTED.comments, 1);
  const normalizedWatchTime = Math.min(metrics.watchTimeMinutes / MAX_EXPECTED.watchTimeMinutes, 1);
  const normalizedCtr = metrics.ctr !== null ? Math.min(metrics.ctr / MAX_EXPECTED.ctr, 1) : 0;

  return (
    normalizedViews * PERFORMANCE_WEIGHTS.views +
    normalizedLikes * PERFORMANCE_WEIGHTS.likes +
    normalizedComments * PERFORMANCE_WEIGHTS.comments +
    normalizedWatchTime * PERFORMANCE_WEIGHTS.watchTimeMinutes +
    normalizedCtr * PERFORMANCE_WEIGHTS.ctr
  );
}

function calculateConfidence(sampleCount: number): number {
  return Math.min(1.0, sampleCount / MIN_SAMPLES_FOR_CONFIDENCE);
}

async function updateTimeSlotScore(
  contentType: ContentType,
  hour: number,
  minute: number,
  score: number
): Promise<void> {
  const existing = await prisma.timeSlotScore.findUnique({
    where: { contentType_hour_minute: { contentType, hour, minute } },
  });

  if (existing) {
    const newCount = existing.sampleCount + 1;
    const newAvg = (existing.performanceScore * existing.sampleCount + score) / newCount;

    await prisma.timeSlotScore.update({
      where: { id: existing.id },
      data: {
        performanceScore: newAvg,
        sampleCount: newCount,
        confidence: calculateConfidence(newCount),
        lastAnalyzedAt: new Date(),
      },
    });
  } else {
    await prisma.timeSlotScore.create({
      data: {
        contentType,
        hour,
        minute,
        performanceScore: score,
        sampleCount: 1,
        confidence: calculateConfidence(1),
      },
    });
  }
}

export async function collectAndAnalyzeExperiments(): Promise<number> {
  const cutoffDate = new Date(Date.now() - ANALYSIS_DELAY_HOURS * 60 * 60 * 1000);

  const pendingExperiments = await prisma.publishExperiment.findMany({
    where: {
      publishedContent: {
        publishedAt: { lte: cutoffDate },
        status: "PUBLISHED",
        youtubeVideoId: { not: null },
      },
      experimentResult: null,
    },
    include: {
      publishedContent: {
        select: {
          id: true,
          youtubeVideoId: true,
          publishedAt: true,
          views: true,
          likes: true,
          comments: true,
          watchTimeMinutes: true,
          titlePatternId: true,
        },
      },
    },
  });

  if (pendingExperiments.length === 0) {
    console.log("📊 لا توجد تجارب جديدة للتحليل");
    return 0;
  }

  let analyzed = 0;
  const results: {
    experimentId: string;
    stats: { views: number; likes: number; comments: number };
    contentType: ContentType;
    scheduledHour: number;
    scheduledMinute: number;
    score: number;
    titlePatternId: number | null;
  }[] = [];

  for (const experiment of pendingExperiments) {
    const content = experiment.publishedContent;
    if (!content?.youtubeVideoId) continue;

    try {
      const affordable = await canAfford(QUOTA_COSTS.ANALYTICS_READ);
      if (!affordable) {
        console.warn("⚠️ Quota غير كافٍ لتحليل التجارب — سنحاول لاحقاً");
        break;
      }

      const stats = await fetchVideoStats(content.youtubeVideoId);

      const metrics: PerformanceMetrics = {
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        watchTimeMinutes: content.watchTimeMinutes,
        ctr: null,
        subscribersGained: 0,
      };

      const score = calculatePerformanceScore(metrics);

      results.push({
        experimentId: experiment.id,
        stats: { views: stats.views, likes: stats.likes, comments: stats.comments },
        contentType: experiment.contentType,
        scheduledHour: experiment.scheduledHour,
        scheduledMinute: experiment.scheduledMinute,
        score,
        titlePatternId: content.titlePatternId,
      });

      analyzed++;
    } catch (err) {
      console.warn(`⚠️ فشل تحليل تجربة ${experiment.id}:`, err instanceof Error ? err.message : err);
    }
  }

  if (results.length > 0) {
    const operations: any[] = [];

    for (const r of results) {
      operations.push(
        prisma.experimentResult.create({
          data: {
            experimentId: r.experimentId,
            views: r.stats.views,
            likes: r.stats.likes,
            comments: r.stats.comments,
            watchTimeMinutes: 0,
            subscribersGained: 0,
            performanceScore: r.score,
          },
        })
      );

      if (r.titlePatternId) {
        operations.push(
          recordPatternPerformance(r.titlePatternId, r.contentType, r.stats.views)
        );
      }
    }

    for (const r of results) {
      operations.push(
        updateTimeSlotScore(r.contentType, r.scheduledHour, r.scheduledMinute, r.score)
      );
    }

    await Promise.all(operations);
  }

  console.log(`📊 تم تحليل ${analyzed}/${pendingExperiments.length} تجربة`);
  return analyzed;
}

export async function getTopTimeSlots(
  contentType: ContentType,
  limit: number = 5
): Promise<TimeSlotEvaluation[]> {
  const slots = await prisma.timeSlotScore.findMany({
    where: { contentType, minute: 0 },
    orderBy: { performanceScore: "desc" },
    take: limit,
  });

  return slots.map((s) => ({
    contentType: s.contentType,
    hour: s.hour,
    minute: s.minute,
    performanceScore: s.performanceScore,
    confidence: s.confidence,
    sampleCount: s.sampleCount,
  }));
}

export async function getAllTimeSlots(contentType: ContentType): Promise<TimeSlotEvaluation[]> {
  const slots = await prisma.timeSlotScore.findMany({
    where: { contentType },
    orderBy: { performanceScore: "desc" },
  });

  return slots.map((s) => ({
    contentType: s.contentType,
    hour: s.hour,
    minute: s.minute,
    performanceScore: s.performanceScore,
    confidence: s.confidence,
    sampleCount: s.sampleCount,
  }));
}

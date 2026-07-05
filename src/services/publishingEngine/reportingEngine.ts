import { notifyReport } from "../notifier";
import prisma from "../../lib/prisma";

function getPeriodDates(type: "DAILY" | "WEEKLY" | "MONTHLY"): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  let periodStart: Date;

  switch (type) {
    case "DAILY":
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 1);
      break;
    case "WEEKLY":
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);
      break;
    case "MONTHLY":
      periodStart = new Date(now);
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
  }

  return { periodStart, periodEnd: now };
}

function getPreviousPeriod(
  type: "DAILY" | "WEEKLY" | "MONTHLY",
  periodStart: Date,
  periodEnd: Date
): { prevStart: Date; prevEnd: Date } {
  const duration = periodEnd.getTime() - periodStart.getTime();
  const prevEnd = new Date(periodStart);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { prevStart, prevEnd };
}

export async function generateReport(type: "DAILY" | "WEEKLY" | "MONTHLY"): Promise<void> {
  const { periodStart, periodEnd } = getPeriodDates(type);

  const experiments = await prisma.publishExperiment.findMany({
    where: { createdAt: { gte: periodStart } },
    include: { experimentResult: true },
  });

  const totalVideos = experiments.length;
  const experimentsCount = experiments.filter((e) => e.isExperimental).length;
  const results = experiments.filter((e) => e.experimentResult);
  const avgScore =
    results.length > 0
      ? results.reduce((sum, e) => sum + e.experimentResult!.performanceScore, 0) / results.length
      : 0;

  const timeSlotScores = await prisma.timeSlotScore.findMany({
    where: { minute: 0 },
    orderBy: { performanceScore: "desc" },
  });

  const bestSlot = timeSlotScores[0] || null;
  const worstSlot = timeSlotScores[timeSlotScores.length - 1] || null;

  const { prevStart, prevEnd } = getPreviousPeriod(type, periodStart, periodEnd);
  const prevExperiments = await prisma.publishExperiment.findMany({
    where: { createdAt: { gte: prevStart, lt: prevEnd } },
    include: { experimentResult: true },
  });

  const prevResults = prevExperiments.filter((e) => e.experimentResult);
  const prevAvgScore =
    prevResults.length > 0
      ? prevResults.reduce((sum, e) => sum + e.experimentResult!.performanceScore, 0) / prevResults.length
      : 0;
  const improvementRate = prevAvgScore > 0 ? ((avgScore - prevAvgScore) / prevAvgScore) * 100 : 0;

  const recommendations: string[] = [];
  if (bestSlot) {
    recommendations.push(
      `الاستمرار في النشر في التوقيت ${bestSlot.hour}:00 (score: ${bestSlot.performanceScore.toFixed(3)})`
    );
  }
  if (totalVideos > 0 && experimentsCount < totalVideos * 0.2) {
    recommendations.push(
      `زيادة نسبة التجارب: حالياً ${((experimentsCount / totalVideos) * 100).toFixed(0)}% من الفيديوهات تجريبية`
    );
  }
  if (timeSlotScores.length < 10) {
    recommendations.push("لا تزال البيانات غير كافية. استمر في جمع العينات.");
  }

  await prisma.publishReport.create({
    data: {
      reportType: type,
      periodStart,
      periodEnd,
      totalVideos,
      experimentsCount,
      bestHour: bestSlot?.hour || null,
      worstHour: worstSlot?.hour || null,
      avgPerformanceScore: avgScore,
      improvementRate,
      recommendations: recommendations as any,
      detailedData: {
        timeSlots: timeSlotScores.map((s) => ({
          hour: s.hour,
          score: s.performanceScore,
          confidence: s.confidence,
          samples: s.sampleCount,
        })),
      } as any,
    },
  });

  console.log(`📊 تقرير ${type} تم إنشاؤه:
  📤 الفيديوهات: ${totalVideos}
  🧪 التجارب: ${experimentsCount}
  ${bestSlot ? `🏆 أفضل وقت: ${bestSlot.hour}:00` : ""}
  ${worstSlot ? `📉 أسوأ وقت: ${worstSlot.hour}:00` : ""}
  📈 متوسط الأداء: ${(avgScore * 100).toFixed(1)}%
  ${improvementRate !== 0 ? `📊 التحسن: ${improvementRate > 0 ? "+" : ""}${improvementRate.toFixed(1)}%` : ""}
  ${recommendations.length > 0 ? `💡 التوصيات:\n${recommendations.map((r) => `  - ${r}`).join("\n")}` : ""}`);

  await notifyReport({
    type,
    totalVideos,
    experimentsCount,
    bestHour: bestSlot?.hour ?? null,
    worstHour: worstSlot?.hour ?? null,
    avgScore,
    improvementRate,
    recommendations,
  });
}

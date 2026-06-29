import { PrismaClient, ContentType } from "@prisma/client";
import { AdaptiveCandidate, CONFIDENCE_THRESHOLD, MIN_SAMPLES_FOR_ADAPTIVE } from "./types";

const prisma = new PrismaClient();

export async function getAdaptiveExperiments(contentType: ContentType): Promise<AdaptiveCandidate | null> {
  const bestSlot = await prisma.timeSlotScore.findFirst({
    where: { contentType, minute: 0, sampleCount: { gte: MIN_SAMPLES_FOR_ADAPTIVE } },
    orderBy: { performanceScore: "desc" },
  });

  if (!bestSlot || bestSlot.confidence < CONFIDENCE_THRESHOLD) return null;

  const offsets = [-15, -10, -5, 5, 10, 15, 20, 25, 30].filter((offset) => {
    const newTotalMinutes = bestSlot.hour * 60 + offset;
    return newTotalMinutes >= 8 * 60 && newTotalMinutes <= 22 * 60;
  });

  if (offsets.length === 0) return null;

  return {
    baseHour: bestSlot.hour,
    offsets,
  };
}

export async function shouldRunAdaptiveOptimization(contentType: ContentType): Promise<boolean> {
  const candidate = await getAdaptiveExperiments(contentType);
  if (!candidate) return false;

  const existingFineGrained = await prisma.timeSlotScore.count({
    where: {
      contentType,
      hour: candidate.baseHour,
      minute: { not: 0 },
    },
  });

  return existingFineGrained < candidate.offsets.length;
}

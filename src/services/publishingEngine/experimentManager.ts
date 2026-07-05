import { ContentType } from "@prisma/client";
import { getTopTimeSlots } from "./analyticsEngine";
import { getAdaptiveExperiments } from "./adaptiveOptimizer";
import {
  PublishDecision,
  MIN_SAMPLES_FOR_CONFIDENCE,
  EXPLOITATION_RATE,
  EXPERIMENTAL_HOURS,
  getDefaultPublishHour,
  getDefaultPublishMinute,
} from "./types";

import prisma from "../../lib/prisma";

async function getExperimentalTime(contentType: ContentType): Promise<{ hour: number; minute: number }> {
  const existingExperiments = await prisma.timeSlotScore.findMany({
    where: { contentType },
    select: { hour: true, minute: true, sampleCount: true },
  });

  const testedSlots = new Set(existingExperiments.map((e) => `${e.hour}:${e.minute}`));
  const lowConfidenceSlots = existingExperiments.filter(
    (e) => e.sampleCount < MIN_SAMPLES_FOR_CONFIDENCE
  );

  if (lowConfidenceSlots.length > 0) {
    const chosen = lowConfidenceSlots[Math.floor(Math.random() * lowConfidenceSlots.length)];
    return { hour: chosen.hour, minute: chosen.minute };
  }

  const untestedHours = EXPERIMENTAL_HOURS.filter((h) => !testedSlots.has(`${h}:0`));
  if (untestedHours.length > 0) {
    const hour = untestedHours[Math.floor(Math.random() * untestedHours.length)];
    return { hour, minute: 0 };
  }

  const hour = EXPERIMENTAL_HOURS[Math.floor(Math.random() * EXPERIMENTAL_HOURS.length)];
  return { hour, minute: 0 };
}

export async function getNextPublishTime(contentType: ContentType): Promise<PublishDecision> {
  const topSlots = await getTopTimeSlots(contentType);

  let isExperimental = false;
  let hour: number;
  let minute: number;
  let reasoning: string;

  if (topSlots.length === 0 || topSlots[0].sampleCount < 3) {
    isExperimental = false;
    hour = getDefaultPublishHour();
    minute = getDefaultPublishMinute();
    reasoning = `لا توجد بيانات كافية بعد (${topSlots.length} slots). وقت احتياطي: ${hour}:${String(minute).padStart(2, "0")}`;
  } else {
    isExperimental = Math.random() > EXPLOITATION_RATE;

    if (!isExperimental) {
      const adaptiveCandidate = await getAdaptiveExperiments(contentType);
      if (adaptiveCandidate && Math.random() > 0.5) {
        const chosenOffset = adaptiveCandidate.offsets[Math.floor(Math.random() * adaptiveCandidate.offsets.length)];
        const totalMinutes = adaptiveCandidate.baseHour * 60 + chosenOffset;
        hour = Math.floor(totalMinutes / 60);
        minute = totalMinutes % 60;
        isExperimental = true;
        reasoning = `Adaptive: اختبار تعديل دقيق حول ${adaptiveCandidate.baseHour}:00 (+${chosenOffset}د)`;
      } else {
        hour = topSlots[0].hour;
        minute = topSlots[0].minute;
        reasoning = `Exploitation: أفضل وقت معروف ${hour}:${String(minute).padStart(2, "0")} (score: ${topSlots[0].performanceScore.toFixed(3)}, confidence: ${(topSlots[0].confidence * 100).toFixed(0)}%)`;
      }
    } else {
      const expTime = await getExperimentalTime(contentType);
      hour = expTime.hour;
      minute = expTime.minute;
      reasoning = `Exploration: تجربة وقت جديد ${hour}:${String(minute).padStart(2, "0")}`;
    }
  }

  return { hour, minute, isExperimental, reasoning };
}

export async function recordExperiment(
  contentType: ContentType,
  decision: PublishDecision,
  publishedContentId: string
): Promise<void> {
  await prisma.publishExperiment.create({
    data: {
      contentType,
      scheduledHour: decision.hour,
      scheduledMinute: decision.minute,
      isExperimental: decision.isExperimental,
      publishedContentId,
    },
  });
}

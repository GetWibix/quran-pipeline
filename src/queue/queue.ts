/**
 * queue.ts
 * تعريف الـ Queue المركزي (BullMQ + Redis) للمشروع كامل
 *
 * concurrency: 1 إلزامية (ماشي اختيارية) — VPS صغير 1-2GB RAM ماقادرش يدير
 * توليد فيديوهين (FFmpeg encoding) فنفس الوقت بدون خطر OOM
 */

import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { ContentType } from "@prisma/client";

export const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  { maxRetriesPerRequest: null }
);

export interface ContentGenerationJobData {
  contentType: ContentType;
  isExtra?: boolean; // واش هاد الفيديو نتيجة قرار "زيادة بسبب التفاعل"
}

export const contentQueue = new Queue<ContentGenerationJobData>(
  "content-generation",
  { connection: connection as any }
);

export const defaultJobOptions: JobsOptions = {
  attempts: 2, // محاولة إعادة واحدة إذا فشل (مثلاً timeout شبكة وقت تحميل صوت)
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { age: 86400 * 7 }, // نخليو سجل الجوبات الناجحة لمدة أسبوع للتدقيق
  removeOnFail: false, // نخليو الفاشلة دائماً للمراجعة اليدوية
};

/**
 * كيضيف job جديد للـ queue. الـ Worker (فملف worker.ts) هو اللي كيعالجه فعلياً
 */
export async function enqueueContentGeneration(
  data: ContentGenerationJobData
) {
  return contentQueue.add("generate-and-publish" as any, data, defaultJobOptions);
}

export const WORKER_CONCURRENCY = 1; // ⚠️ لا تزيدها بدون ترقية موارد VPS أولاً

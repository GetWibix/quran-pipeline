/**
 * r2Uploader.ts
 * كيرفع الفيديو إلى Cloudflare R2 ويجيب رابط عام لـ Instagram + Threads
 *
 * متطلبات (env vars):
 *   R2_ACCOUNT_ID    — من Cloudflare Dashboard → R2 → Account ID
 *   R2_ACCESS_KEY    — من R2 → Manage R2 API Tokens
 *   R2_SECRET_KEY    — 👆
 *   R2_BUCKET        — اسم الـ bucket
 *   R2_PUBLIC_URL    — رابط عام للـ bucket (مثال: https://pub-xxxxx.r2.dev)
 *                      شغّل Public Access في R2 Settings → Public Access
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent as HttpsAgent } from "https";
import { createReadStream } from "fs";
import { setTimeout as sleep } from "timers/promises";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY = process.env.R2_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.R2_SECRET_KEY ?? "";
const BUCKET = process.env.R2_BUCKET ?? "";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
    return null;
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
      requestHandler: new NodeHttpHandler({
        httpsAgent: new HttpsAgent({
          keepAlive: true,
          rejectUnauthorized: true,
        }),
      }),
      maxAttempts: 3,
    });
  }
  return client;
}

function isConfigured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY && BUCKET);
}

/**
 * كيرفع الفيديو إلى R2 ويرجع الرابط العام
 * إذا ما كان R2 مهيأ، يرجع undefined (Instagram + Threads يتخطوا)
 */
export async function uploadToR2(localPath: string): Promise<string | undefined> {
  if (!isConfigured()) {
    console.warn("⚠️ R2: إعدادات R2 ناقصة — تخطي الرفع السحابي");
    return undefined;
  }

  const s3 = getClient();
  if (!s3) return undefined;

  const filename = localPath.split("/").pop() || `video-${Date.now()}.mp4`;
  const key = `videos/${filename}`;

  console.log(`☁️  رفع الفيديو إلى R2: ${key}`);

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: createReadStream(localPath),
        ContentType: "video/mp4",
      }));
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("EPROTO") || msg.includes("SSL") || msg.includes("handshake")) {
        console.warn(`⚠️ R2: محاولة ${attempt}/3 فشلت (SSL) — ${msg}`);
        if (attempt < 3) await sleep(2000 * attempt);
      } else {
        console.warn(`⚠️ R2: فشل الرفع — ${msg}`);
        return undefined;
      }
    }
  }
  if (lastError) {
    console.warn(`⚠️ R2: فشل الرفع بعد 3 محاولات — ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    return undefined;
  }

  // نرجع الرابط العام
  if (PUBLIC_URL) {
    return `${PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
  }

  console.warn("⚠️ R2: R2_PUBLIC_URL غير محدد — الرابط ما راح يشتغل من برا");
  return `https://${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

/**
 * كيمسح الفيديو من R2 بعد ما تخلص جميع المنصات
 */
export async function deleteFromR2(localPath: string): Promise<void> {
  if (!isConfigured()) return;

  const s3 = getClient();
  if (!s3) return;

  const filename = localPath.split("/").pop();
  if (!filename) return;

  const key = `videos/${filename}`;

  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    console.log(`🗑️  تم مسح الفيديو من R2: ${key}`);
  } catch (err) {
    // فشل المسح مشكلة بسيطة
    console.warn(`⚠️ فشل مسح الفيديو من R2: ${key}`);
  }
}

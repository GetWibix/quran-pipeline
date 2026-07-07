import { createHash } from "crypto";
import { createReadStream } from "fs";
import { stat, open } from "fs/promises";
import { request as httpsRequest, RequestOptions } from "https";
import { generateComment } from "./commentGenerator";
import { SITE_LINK_SHORT } from "../site";
import FormData from "form-data";

export interface FacebookPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  scheduledPublishTime?: string;
}

export interface FacebookPublishResult {
  facebookVideoId: string;
  postUrl: string;
}

export class FacebookRateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`Facebook rate limited. Retry after ${retryAfter}s`);
    this.retryAfter = retryAfter;
    this.name = "FacebookRateLimitError";
  }
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";
const RESUMABLE_THRESHOLD = 500 * 1024 * 1024; // 500MB — smaller files use simple upload
const CHUNK_SIZE = 10 * 1024 * 1024;
const READ_TIMEOUT = 60000;
const UPLOAD_TIMEOUT = 600000;

interface UploadSession {
  uploadSessionId: string;
  videoId: string;
  startOffset: number;
  endOffset: number;
}

function endpointFor(_isReel: boolean): string {
    return "videos";
}

function isConfigured(): boolean {
  return Boolean(PAGE_ID && ACCESS_TOKEN);
}

function buildDescription(description: string, tags: string[]): string {
  const hashtags = [...new Set(tags)]
    .filter(t => /^[\u0600-\u06FFa-zA-Z]+$/.test(t.replace(/_/g, "")))
    .slice(0, 5)
    .map(t => `#${t.startsWith("#") ? t.slice(1) : t}`)
    .join(" ");
  return `${description}\n\n${hashtags}`;
}

function parseResponse(res: import("http").IncomingMessage, body: string): any {
  const parsed = JSON.parse(body);
  if (res.statusCode === 429) {
    const retryAfter = parseInt(res.headers["retry-after"] as string ?? "60", 10);
    throw new FacebookRateLimitError(retryAfter);
  }
  if (parsed.error) {
    if (parsed.error.code === 4 || parsed.error.code === 17) {
      throw new FacebookRateLimitError(60);
    }
    const errCode = parsed.error.code ?? "?";
    const errType = parsed.error.type ?? "?";
    const errSubcode = parsed.error.error_subcode ?? "?";
    const errTrace = parsed.error.fbtrace_id ?? "?";
    console.error(`🔍 Facebook error detail — code: ${errCode}, type: ${errType}, subcode: ${errSubcode}, trace: ${errTrace}`);
    throw new Error(`Facebook API: ${parsed.error.message}`);
  }
  return parsed;
}

const FB_MAX_RETRIES = 5;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FB_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof FacebookRateLimitError) {
        const wait = err.retryAfter * (attempt * 0.5);
        console.log(`⏳ فيسبوك: Rate limit — انتظار ${Math.round(wait)}ث (محاولة ${attempt}/${FB_MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, wait * 1000));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

function httpsPost(url: string, timeoutMs = READ_TIMEOUT): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Length": "0" },
      timeout: timeoutMs,
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(parseResponse(res, data)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Facebook: request timeout")); });
    req.end();
  });
}

function httpsPostBinary(url: string, buffer: Buffer, timeoutMs = UPLOAD_TIMEOUT): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": buffer.length.toString(),
      },
      timeout: timeoutMs,
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(parseResponse(res, data)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Facebook: upload chunk timeout")); });
    req.write(buffer);
    req.end();
  });
}

function httpsPostForm(url: string, form: FormData): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("Facebook: form upload timeout"));
    }, UPLOAD_TIMEOUT);
    form.submit({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      protocol: parsed.protocol as "https:" | "http:",
      method: "POST",
    }, (err, res) => {
      if (timedOut) return;
      clearTimeout(timer);
      if (err) { reject(err); return; }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(parseResponse(res, data)); }
        catch (e) { reject(e); }
      });
    });
  });
}

function httpsPostUrlEncoded(url: string, body: string, timeoutMs = READ_TIMEOUT): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body).toString(),
      },
      timeout: timeoutMs,
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(parseResponse(res, data)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Facebook: request timeout")); });
    req.write(body);
    req.end();
  });
}

async function readFileChunk(filePath: string, offset: number, size: number): Promise<Buffer> {
  const fd = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(size);
    const { bytesRead } = await fd.read(buffer, 0, size, offset);
    return buffer.subarray(0, bytesRead);
  } finally {
    await fd.close();
  }
}

async function startUpload(fileSize: number, isReel: boolean): Promise<UploadSession> {
  const endpoint = endpointFor(isReel);
  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/${endpoint}?upload_phase=start&file_size=${fileSize}&access_token=${ACCESS_TOKEN}`;
  const data = await httpsPost(url, READ_TIMEOUT);
  return {
    uploadSessionId: data.upload_session_id,
    videoId: data.video_id,
    startOffset: parseInt(data.start_offset, 10),
    endOffset: parseInt(data.end_offset, 10),
  };
}

async function transferChunk(
  sessionId: string,
  filePath: string,
  offset: number,
  fileSize: number,
  isReel: boolean
): Promise<number> {
  const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
  const buffer = await readFileChunk(filePath, offset, chunkSize);
  const endpoint = endpointFor(isReel);
  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/${endpoint}?upload_phase=transfer&upload_session_id=${sessionId}&start_offset=${offset}&access_token=${ACCESS_TOKEN}`;
  const data = await httpsPostBinary(url, buffer, UPLOAD_TIMEOUT);
  return parseInt(data.start_offset, 10);
}

async function resumeUploadOffset(sessionId: string): Promise<number> {
  const url = `https://graph.facebook.com/${API_VERSION}/upload:${sessionId}?access_token=${ACCESS_TOKEN}`;
  try {
    const data = await httpsPost(url, READ_TIMEOUT);
    return parseInt(data.start_offset, 10);
  } catch {
    return 0;
  }
}

async function finishUpload(
  sessionId: string,
  videoId: string,
  fields: Record<string, string>,
  isReel: boolean
): Promise<string> {
  const endpoint = endpointFor(isReel);
  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/${endpoint}?access_token=${ACCESS_TOKEN}`;
  const body = new URLSearchParams({
    upload_phase: "finish",
    upload_session_id: sessionId,
    ...fields,
  }).toString();
  const data = await httpsPostUrlEncoded(url, body, READ_TIMEOUT);
  return String(data.id ?? videoId);
}

async function uploadVideo(filePath: string, fields: Record<string, string>, isReel: boolean): Promise<string> {
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) throw new Error(`الملف غير موجود: ${filePath}`);
  if (fileStat.size === 0) throw new Error("الملف فارغ");
  if (fileStat.size > 5 * 1024 * 1024 * 1024) throw new Error("الملف أكبر من 5GB — فيسبوك لا يدعم هذا الحجم");
  if (fileStat.size < RESUMABLE_THRESHOLD) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    form.append("source", createReadStream(filePath), {
      filename: "video.mp4",
      contentType: "video/mp4",
    });
    const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/${endpointFor(isReel)}?access_token=${ACCESS_TOKEN}`;
    const data = await httpsPostForm(url, form);
    return String(data.id ?? "");
  }
  let session = await startUpload(fileStat.size, isReel);
  let offset = session.startOffset;
  while (offset < fileStat.size) {
    try {
      offset = await transferChunk(session.uploadSessionId, filePath, offset, fileStat.size, isReel);
    } catch (err) {
      const recoveredOffset = await resumeUploadOffset(session.uploadSessionId);
      if (recoveredOffset > offset) {
        offset = recoveredOffset;
      } else {
        session = await startUpload(fileStat.size, isReel);
        offset = session.startOffset;
      }
    }
  }
  return finishUpload(session.uploadSessionId, session.videoId, fields, isReel);
}

async function addEngagementComment(videoId: string, opts?: FacebookPublishOptions): Promise<void> {
  try {
    let comment: string;
    if (opts?.surahName && opts?.fromAyah) {
      comment = await generateComment(opts.title, opts.surahName, opts.fromAyah, opts.toAyah ?? opts.fromAyah) + SITE_LINK_SHORT;
    } else {
      const fallback = [
        "اللهم اجعل هذه التلاوة نوراً في قلوبنا 🤲 شارك الأجر مع غيرك 💚",
        "سبحان الله.. آية تتلى وقلب يخشع. ادعو لنا 🕊️",
        "ذكر الله يطمئن القلوب 💚 شارك مع من تحب",
        "اللهم اجعل القرآن ربيع قلوبنا 🌙 انشر تؤجر 🤲",
        "لا تنسوا مشاركة الفيديو مع أحبابكم 🤲 جعلها الله في ميزان حسناتكم",
      ];
      comment = fallback[Math.floor(Math.random() * fallback.length)] + SITE_LINK_SHORT;
    }
    const url = `https://graph.facebook.com/${API_VERSION}/${videoId}/comments?message=${encodeURIComponent(comment)}&access_token=${ACCESS_TOKEN}`;
    const data = await httpsPost(url);
    if (data.error) console.warn(`⚠️ فشل تعليق فيسبوك التلقائي: ${data.error.message}`);
    else console.log(`💬 تعليق AI على فيسبوك ${videoId}: ${comment.slice(0, 60)}...`);
  } catch (err) {
    console.warn(`⚠️ تعذر إضافة التعليق التلقائي على فيسبوك:`, err instanceof Error ? err.message : String(err));
  }
}

export async function verifyFacebookPost(facebookVideoId: string): Promise<{
  isPublished: boolean;
  isHidden: boolean;
}> {
  const url = `https://graph.facebook.com/${API_VERSION}/${facebookVideoId}?fields=is_published,is_hidden&access_token=${ACCESS_TOKEN}`;
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      timeout: READ_TIMEOUT,
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(`Facebook Verify: ${parsed.error.message}`);
          resolve({
            isPublished: parsed.is_published === true,
            isHidden: parsed.is_hidden === true,
          });
        } catch (e) { reject(e); }
      });
    }).on("error", reject).end();
  });
}

export async function publishToFacebook(opts: FacebookPublishOptions): Promise<FacebookPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook: META_PAGE_ID أو META_PAGE_ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookVideoId: "", postUrl: "" };
  }

  const fields: Record<string, string> = {
    description: buildDescription(opts.description, opts.tags),
  };

  if (opts.scheduledPublishTime) {
    const publishTime = new Date(opts.scheduledPublishTime).getTime();
    const minTime = Date.now() + 15 * 60 * 1000;
    if (publishTime > minTime) {
      fields.scheduled_publish_time = String(Math.floor(publishTime / 1000));
      fields.unpublished_content_type = "SCHEDULED";
      fields.published = "false";
    } else {
      console.log("⏰ Facebook: وقت الجدولة قريب جداً أو مضى — نشر فوري");
    }
  }

  const videoId = await withRetry(() => uploadVideo(opts.videoFilePath, fields, opts.isShort));

  if (videoId) {
    withRetry(() => addEngagementComment(videoId, opts)).catch(() => {});
  }

  return {
    facebookVideoId: videoId,
    postUrl: videoId ? `https://www.facebook.com/watch/?v=${videoId}` : "",
  };
}

export function generateContentHash(surahNumber: number, fromAyah: number, toAyah: number, reciter: string, contentType: string): string {
  return createHash("sha256")
    .update(`${surahNumber}-${fromAyah}-${toAyah}-${reciter}-${contentType}`)
    .digest("hex");
}

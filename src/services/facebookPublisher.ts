import { readFile } from "fs/promises";
import { request as httpsRequest } from "https";
import { generateComment } from "./commentGenerator";
import { SITE_LINK_SHORT } from "../site";

export interface FacebookPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  /** وقت النشر المجدول (ISO 8601). إذا محدد، كينشر مجدول بدل النشر الفوري */
  scheduledPublishTime?: string;
}

export interface FacebookPublishResult {
  facebookVideoId: string;
  postUrl: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";

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

function httpsPost(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Length": "0" },
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error(data)); } });
    });
    req.on("error", reject);
    req.end();
  });
}

async function addEngagementComment(videoId: string, opts?: FacebookPublishOptions): Promise<void> {
  try {
    let comment: string;
    if (opts?.surahName && opts?.fromAyah) {
      comment = await generateComment(opts.title, opts.surahName, opts.fromAyah, opts.toAyah ?? opts.fromAyah);
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

function buildMultipartBody(
  videoBuffer: Buffer,
  fields: Record<string, string>,
  boundary: string
): Buffer {
  const parts: Buffer[] = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      "utf-8"
    ));
  }

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="video.mp4"\r\nContent-Type: video/mp4\r\n\r\n`,
    "utf-8"
  ));
  parts.push(videoBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8"));

  return Buffer.concat(parts);
}

function httpsPostMultipart(url: string, body: Buffer, boundary: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length.toString(),
      },
    };

    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Facebook: استجابة غير متوقعة — ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function publishToFacebook(opts: FacebookPublishOptions): Promise<FacebookPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook: META_PAGE_ID أو META_PAGE_ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookVideoId: "", postUrl: "" };
  }

  const videoBuffer = await readFile(opts.videoFilePath);
  const boundary = `----FB${Date.now()}${Math.random().toString(36).slice(2)}`;

  const fields: Record<string, string> = {
    description: buildDescription(opts.description, opts.tags),
    published: opts.scheduledPublishTime ? "false" : "true",
  };

  if (opts.scheduledPublishTime) {
    let publishTime = new Date(opts.scheduledPublishTime).getTime();
    const minTime = Date.now() + 15 * 60 * 1000;
    if (publishTime < minTime) {
      publishTime = minTime;
      console.log("⏰ Facebook: وقت الجدولة قريب جداً — تم التمديد لـ +15 دقيقة");
    }
    fields.scheduled_publish_time = String(Math.floor(publishTime / 1000));
    fields.unpublished_content_type = "SCHEDULED";
  }

  const body = buildMultipartBody(videoBuffer, fields, boundary);

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/videos?access_token=${ACCESS_TOKEN}`;

  const data = await httpsPostMultipart(url, body, boundary);

  if (data.error) throw new Error(`Facebook API: ${data.error.message}`);

  const videoId = String(data.id ?? "");

  if (videoId) {
    addEngagementComment(videoId, opts);
  }

  return {
    facebookVideoId: videoId,
    postUrl: videoId ? `https://www.facebook.com/watch/?v=${videoId}` : "",
  };
}

import { readFile } from "fs/promises";
import { request as httpsRequest } from "https";

export interface FacebookPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
}

export interface FacebookPublishResult {
  facebookVideoId: string;
  postUrl: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";

const ENGAGEMENT_COMMENTS = [
  "اللهم اجعل هذه التلاوة نوراً في قلوبنا وشفاءً لصدورنا 🤲 شاركنا الأجر مع غيرك 💚",
  "سبحان الله.. آية تتلى وقلب يخشع. ادعو لنا وشارك الفيديو لتعم الفائدة 🕊️",
  "لا تنسوا مشاركة هذا الفيديو مع أحبابكم لتعم البركة 🤲 جعلها الله في ميزان حسناتكم",
  "اللهم اجعل القرآن ربيع قلوبنا ونور صدورنا 🌙 انشر تؤجر 🤲",
  "ذكر الله يطمئن القلوب 💚 شارك مع من تحب لتعم الطمأنينة",
];

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

async function addEngagementComment(videoId: string): Promise<void> {
  try {
    const comment = ENGAGEMENT_COMMENTS[Math.floor(Math.random() * ENGAGEMENT_COMMENTS.length)];
    const url = `https://graph.facebook.com/${API_VERSION}/${videoId}/comments?message=${encodeURIComponent(comment)}&access_token=${ACCESS_TOKEN}`;
    const data = await httpsPost(url);
    if (data.error) console.warn(`⚠️ فشل تعليق فيسبوك التلقائي: ${data.error.message}`);
    else console.log(`💬 تم إضافة تعليق تلقائي على فيسبوك ${videoId}`);
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

  const body = buildMultipartBody(videoBuffer, {
    description: buildDescription(opts.description, opts.tags),
    published: "true",
  }, boundary);

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/videos?access_token=${ACCESS_TOKEN}`;

  const data = await httpsPostMultipart(url, body, boundary);

  if (data.error) throw new Error(`Facebook API: ${data.error.message}`);

  const videoId = String(data.id ?? "");

  if (videoId) {
    addEngagementComment(videoId);
  }

  return {
    facebookVideoId: videoId,
    postUrl: videoId ? `https://facebook.com/${PAGE_ID}/videos/${videoId}` : "",
  };
}

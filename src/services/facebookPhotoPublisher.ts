import { request as httpsRequest } from "https";

export interface FacebookPhotoResult {
  facebookPhotoId: string;
  postUrl: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";

const ENGAGEMENT_COMMENTS = [
  "اللهم اجعل هذه التلاوة نوراً في قلوبنا 🤲 شارك الأجر مع غيرك 💚",
  "سبحان الله.. آية تتلى وقلب يخشع. ادعو لنا 🕊️",
  "لا تنسوا مشاركة هذه الآيات مع أحبابكم لتعم البركة 🤲",
  "اللهم اجعل القرآن ربيع قلوبنا 🌙 انشر تؤجر 🤲",
  "ذكر الله يطمئن القلوب 💚 شارك مع من تحب",
];

function isConfigured(): boolean {
  return Boolean(PAGE_ID && ACCESS_TOKEN);
}

function buildMultipartBody(
  imageBuffer: Buffer,
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
    `--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="poster.png"\r\nContent-Type: image/png\r\n\r\n`,
    "utf-8"
  ));
  parts.push(imageBuffer);
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
          reject(new Error(`Facebook Photo: استجابة غير متوقعة — ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
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

async function addEngagementComment(photoId: string): Promise<void> {
  try {
    const comment = ENGAGEMENT_COMMENTS[Math.floor(Math.random() * ENGAGEMENT_COMMENTS.length)];
    const url = `https://graph.facebook.com/${API_VERSION}/${photoId}/comments?message=${encodeURIComponent(comment)}&access_token=${ACCESS_TOKEN}`;
    const data = await httpsPost(url);
    if (data.error) console.warn(`⚠️ فشل تعليق بوستر فيسبوك التلقائي: ${data.error.message}`);
    else console.log(`💬 تم إضافة تعليق تلقائي على بوستر فيسبوك ${photoId}`);
  } catch (err) {
    console.warn(`⚠️ تعذر إضافة التعليق التلقائي على بوستر فيسبوك:`, err instanceof Error ? err.message : String(err));
  }
}

export async function publishPhotoToFacebook(
  imageBuffer: Buffer,
  caption: string
): Promise<FacebookPhotoResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook Photo: META_PAGE_ID أو ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookPhotoId: "", postUrl: "" };
  }

  const boundary = `----FB${Date.now()}${Math.random().toString(36).slice(2)}`;
  const body = buildMultipartBody(imageBuffer, {
    message: caption,
    published: "true",
  }, boundary);

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/photos?access_token=${ACCESS_TOKEN}`;
  const data = await httpsPostMultipart(url, body, boundary);

  if (data.error) throw new Error(`Facebook Photo API: ${data.error.message}`);

  const photoId = String(data.id ?? "");

  if (photoId) {
    addEngagementComment(photoId);
  }

  return {
    facebookPhotoId: photoId,
    postUrl: photoId ? `https://facebook.com/photo.php?fbid=${photoId}` : "",
  };
}

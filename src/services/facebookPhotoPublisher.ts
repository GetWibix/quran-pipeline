import { request as httpsRequest, RequestOptions } from "https";
import { SITE_LINK_SHORT } from "../site";

export interface FacebookPhotoResult {
  facebookPhotoId: string;
  postUrl: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";
const REQUEST_TIMEOUT = 60000;

const ENGAGEMENT_COMMENTS = [
  "اللهم اجعل هذه التلاوة نوراً في قلوبنا 🤲 شارك الأجر مع غيرك 💚",
  "سبحان الله.. آية تتلى وقلب يخشع. ادعو لنا 🕊️",
  "لا تنسوا مشاركة هذه الآيات مع أحبابكم لتعم البركة 🤲",
  "اللهم اجعل القرآن ربيع قلوبنا 🌙 انشر تؤجر 🤲",
  "ذكر الله يطمئن القلوب 💚 شارك مع من تحب",
].map(c => c + SITE_LINK_SHORT);

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
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("Facebook Photo: request timeout"));
    }, REQUEST_TIMEOUT);
    const options: RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length.toString(),
      },
    };
    const req = httpsRequest(options, (res) => {
      if (timedOut) return;
      clearTimeout(timer);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(`Facebook Photo API: ${parsed.error.message}`);
          resolve(parsed);
        } catch {
          reject(new Error(`Facebook Photo: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); if (!timedOut) { clearTimeout(timer); reject(new Error("Facebook Photo: request timeout")); } });
    req.write(body);
    req.end();
  });
}

function httpsPost(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Length": "0" },
    };
    const req = httpsRequest(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(`Facebook Photo API: ${parsed.error.message}`);
          resolve(parsed);
        } catch { reject(new Error(data)); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function deletePhoto(photoId: string): Promise<void> {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${photoId}?access_token=${ACCESS_TOKEN}`;
    const parsed = new URL(url);
    await new Promise<void>((resolve, reject) => {
      const req = httpsRequest({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "DELETE",
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve());
      });
      req.on("error", reject);
      req.end();
    });
  } catch {
    // تجاهل فشل الحذف — الصورة ستبقى orphan ولكن النظام استمر
  }
}

async function addEngagementComment(postId: string): Promise<void> {
  try {
    const comment = ENGAGEMENT_COMMENTS[Math.floor(Math.random() * ENGAGEMENT_COMMENTS.length)];
    const url = `https://graph.facebook.com/${API_VERSION}/${postId}/comments?message=${encodeURIComponent(comment)}&access_token=${ACCESS_TOKEN}`;
    const data = await httpsPost(url);
    if (data.error) console.warn(`⚠️ فشل تعليق بوستر فيسبوك التلقائي: ${data.error.message}`);
    else console.log(`💬 تم إضافة تعليق تلقائي على بوستر فيسبوك ${postId}`);
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

  const uploadBody = buildMultipartBody(imageBuffer, {
    published: "false",
  }, boundary);

  const uploadUrl = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/photos?access_token=${ACCESS_TOKEN}`;
  let uploadData: any;
  try {
    uploadData = await httpsPostMultipart(uploadUrl, uploadBody, boundary);
  } catch (err) {
    throw new Error(`فشل رفع الصورة: ${err instanceof Error ? err.message : String(err)}`);
  }

  const photoId = String(uploadData.id ?? "");
  if (!photoId) throw new Error("لم يتم الحصول على photo_id من Facebook");

  const feedUrl = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/feed?message=${encodeURIComponent(caption)}&attached_media=${encodeURIComponent(JSON.stringify([{ media_fbid: photoId }]))}&access_token=${ACCESS_TOKEN}`;
  let feedData: any;
  try {
    feedData = await httpsPost(feedUrl);
  } catch (err) {
    await deletePhoto(photoId);
    throw new Error(`فشل إنشاء المنشور (تم حذف الصورة المعزولة): ${err instanceof Error ? err.message : String(err)}`);
  }

  const postId = String(feedData.id ?? "");

  if (postId) {
    addEngagementComment(postId);
  }

  return {
    facebookPhotoId: postId,
    postUrl: postId ? `https://www.facebook.com/${PAGE_ID}/posts/${postId}` : "",
  };
}

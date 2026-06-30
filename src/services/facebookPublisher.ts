import { readFile } from "fs/promises";

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

async function addEngagementComment(videoId: string): Promise<void> {
  try {
    const comment = ENGAGEMENT_COMMENTS[Math.floor(Math.random() * ENGAGEMENT_COMMENTS.length)];
    const url = `https://graph.facebook.com/${API_VERSION}/${videoId}/comments?message=${encodeURIComponent(comment)}&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json() as any;
    if (data.error) console.warn(`⚠️ فشل تعليق فيسبوك التلقائي: ${data.error.message}`);
    else console.log(`💬 تم إضافة تعليق تلقائي على فيسبوك ${videoId}`);
  } catch (err) {
    console.warn(`⚠️ تعذر إضافة التعليق التلقائي على فيسبوك:`, err instanceof Error ? err.message : String(err));
  }
}

export async function publishToFacebook(opts: FacebookPublishOptions): Promise<FacebookPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook: META_PAGE_ID أو META_PAGE_ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookVideoId: "", postUrl: "" };
  }

  const videoBuffer = await readFile(opts.videoFilePath);
  const form = new FormData();
  form.append("source", new Blob([videoBuffer]), "video.mp4");
  form.append("description", buildDescription(opts.description, opts.tags));
  form.append("title", opts.title);
  form.append("published", "true");

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/videos?access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json() as any;

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

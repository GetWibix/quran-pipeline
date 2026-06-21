export interface InstagramPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  /** رابط عام للفيديو — مطلوب لأن Instagram API ما كيشن ملف محلي */
  videoUrl?: string;
  /** رابط عام للصورة المصغرة (اختياري) */
  thumbnailUrl?: string;
}

export interface InstagramPublishResult {
  instagramMediaId: string;
  postUrl: string;
}

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

function isConfigured(): boolean {
  return Boolean(IG_USER_ID && ACCESS_TOKEN);
}

async function apiPost(path: string, body: Record<string, string>) {
  body.access_token = ACCESS_TOKEN;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Instagram API: ${data.error.message}`);
  return data;
}

async function waitForContainer(containerId: string, timeoutMs = 300_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${BASE}/${containerId}?fields=status_code&access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json() as any;
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") throw new Error(`Instagram: فشل معالجة الحاوية`);
    await new Promise(r => setTimeout(r, 5_000));
  }
  throw new Error("Instagram: انتهت مهلة انتظار معالجة الفيديو");
}

export async function publishToInstagram(opts: InstagramPublishOptions): Promise<InstagramPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Instagram: INSTAGRAM_BUSINESS_ID أو META_PAGE_ACCESS_TOKEN غير موجودين — تخطي");
    return { instagramMediaId: "", postUrl: "" };
  }

  if (!opts.videoUrl) {
    console.warn("⚠️ Instagram: videoUrl مطلوب للنشر — تخطي (حدد PUBLIC_VIDEO_URL_BASE في .env)");
    return { instagramMediaId: "", postUrl: "" };
  }

  const caption = [opts.title, opts.description, opts.tags.map(t => `#${t.replace(/^#/, "")}`).join(" ")]
    .filter(Boolean).join("\n\n").slice(0, 2200);

  const container = await apiPost(`/${IG_USER_ID}/media`, {
    media_type: "REELS",
    video_url: opts.videoUrl,
    caption,
    share_to_feed: "true",
  });

  const containerId = String(container.id);
  await waitForContainer(containerId);

  const publish = await apiPost(`/${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });

  const mediaId = String(publish.id);
  return {
    instagramMediaId: mediaId,
    postUrl: mediaId ? `https://instagram.com/p/${mediaId}` : "",
  };
}

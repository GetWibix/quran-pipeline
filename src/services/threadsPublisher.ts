export interface ThreadsPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  /** رابط عام للفيديو — مطلوب لأن Threads API ما كيشن ملف محلي */
  videoUrl?: string;
}

export interface ThreadsPublishResult {
  threadsPostId: string;
  postUrl: string;
}

const THREADS_USER_ID = process.env.THREADS_USER_ID ?? "";
const ACCESS_TOKEN = process.env.THREADS_ACCESS_TOKEN ?? "";
const BASE = "https://graph.threads.net/v1.0";

function isConfigured(): boolean {
  return Boolean(THREADS_USER_ID && ACCESS_TOKEN);
}

async function threadsPost(path: string, body: Record<string, string>) {
  body.access_token = ACCESS_TOKEN;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(`Threads API: ${data.error.message}`);
  return data;
}

export async function publishToThreads(opts: ThreadsPublishOptions): Promise<ThreadsPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Threads: THREADS_USER_ID أو THREADS_ACCESS_TOKEN غير موجودين — تخطي");
    return { threadsPostId: "", postUrl: "" };
  }

  if (!opts.videoUrl) {
    console.warn("⚠️ Threads: videoUrl مطلوب للنشر — تخطي (حدد PUBLIC_VIDEO_URL_BASE في .env)");
    return { threadsPostId: "", postUrl: "" };
  }

  const text = [opts.title, opts.description, opts.tags.map(t => `#${t.replace(/^#/, "")}`).join(" ")]
    .filter(Boolean).join("\n\n").slice(0, 500);

  const container = await threadsPost(`/${THREADS_USER_ID}/threads`, {
    media_type: "VIDEO",
    video_url: opts.videoUrl,
    text,
  });

  const containerId = String(container.id);

  // Threads ينصح بالانتظار 30 ثانية قبل النشر
  await new Promise(r => setTimeout(r, 30_000));

  const publish = await threadsPost(`/${THREADS_USER_ID}/threads_publish`, {
    creation_id: containerId,
  });

  const postId = String(publish.id);
  return {
    threadsPostId: postId,
    postUrl: postId ? `https://threads.net/t/${postId}` : "",
  };
}

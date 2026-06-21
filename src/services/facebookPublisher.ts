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

function isConfigured(): boolean {
  return Boolean(PAGE_ID && ACCESS_TOKEN);
}

export async function publishToFacebook(opts: FacebookPublishOptions): Promise<FacebookPublishResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook: META_PAGE_ID أو META_PAGE_ACCESS_TOKEN غير موجودين — تخطي");
    return { facebookVideoId: "", postUrl: "" };
  }

  const videoBuffer = await readFile(opts.videoFilePath);
  const form = new FormData();
  form.append("source", new Blob([videoBuffer]), "video.mp4");
  form.append("description", opts.description);
  form.append("title", opts.title);
  if (opts.tags.length) form.append("tags", opts.tags.slice(0, 30).join(","));
  form.append("published", "true");

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/videos?access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json() as any;

  if (data.error) throw new Error(`Facebook API: ${data.error.message}`);

  const videoId = String(data.id ?? "");
  return {
    facebookVideoId: videoId,
    postUrl: videoId ? `https://facebook.com/${PAGE_ID}/videos/${videoId}` : "",
  };
}

import { SITE_URL } from "../site";

export interface FacebookStoryOptions {
  videoUrl: string;
  title: string;
}

export interface FacebookStoryResult {
  storyId: string;
}

const PAGE_ID = process.env.META_PAGE_ID ?? "";
const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const API_VERSION = "v22.0";

function isConfigured(): boolean {
  return Boolean(PAGE_ID && ACCESS_TOKEN);
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
    const req = (require("https") as typeof import("https")).request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error(data)); } });
    });
    req.on("error", reject);
    req.end();
  });
}

export async function publishToFacebookStory(opts: FacebookStoryOptions): Promise<FacebookStoryResult> {
  if (!isConfigured()) {
    console.warn("⚠️ Facebook Story: META_PAGE_ID أو ACCESS_TOKEN غير موجودين — تخطي");
    return { storyId: "" };
  }

  const params = new URLSearchParams({
    video_url: opts.videoUrl,
    title: opts.title.slice(0, 100),
    access_token: ACCESS_TOKEN,
  });

  const url = `https://graph.facebook.com/${API_VERSION}/${PAGE_ID}/video_stories?${params}`;
  const data = await httpsPost(url);

  if (data.error) throw new Error(`Facebook Story API: ${data.error.message}`);

  console.log(`📱 قصة فيسبوك منشورة: ${data.id}`);
  return { storyId: String(data.id ?? "") };
}

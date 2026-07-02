import { publishToFacebook, FacebookPublishOptions, FacebookPublishResult } from "./facebookPublisher";
import { publishToInstagram, InstagramPublishOptions, InstagramPublishResult } from "./instagramPublisher";
import { publishToThreads, ThreadsPublishOptions, ThreadsPublishResult } from "./threadsPublisher";

export interface MultiPlatformPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  videoUrl?: string;
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  /** وقت النشر المجدول (ISO 8601) — كيبعت لـ Facebook باش ينشر مجدول */
  scheduledPublishTime?: string;
}

export interface PlatformRouting {
  youtube?: boolean;
  facebook?: boolean;
  instagram?: boolean;
  threads?: boolean;
}

export interface MultiPlatformResult {
  youtube: { videoId: string; url: string } | null;
  facebook: FacebookPublishResult | null;
  instagram: InstagramPublishResult | null;
  threads: ThreadsPublishResult | null;
  errors: { platform: string; error: string }[];
}

export async function publishToAllPlatforms(
  opts: MultiPlatformPublishOptions,
  routing: PlatformRouting,
  youtubeVideoId?: string,
  youtubeVideoUrl?: string,
): Promise<MultiPlatformResult> {
  const errors: { platform: string; error: string }[] = [];
  const result: MultiPlatformResult = {
    youtube: youtubeVideoId ? { videoId: youtubeVideoId, url: youtubeVideoUrl ?? "" } : null,
    facebook: null,
    instagram: null,
    threads: null,
    errors: [],
  };

  const promises: Promise<void>[] = [];

  if (routing.facebook !== false) {
    promises.push(
      publishToFacebook({
        videoFilePath: opts.videoFilePath,
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
        isShort: opts.isShort,
        surahName: opts.surahName,
        fromAyah: opts.fromAyah,
        toAyah: opts.toAyah,
        scheduledPublishTime: opts.scheduledPublishTime,
      })
        .then((r) => { result.facebook = r; })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ platform: "facebook", error: msg });
          console.error(`❌ Facebook فشل: ${msg}`);
        }),
    );
  }

  if (routing.instagram !== false && opts.videoUrl) {
    promises.push(
      publishToInstagram({
        videoFilePath: opts.videoFilePath,
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
        isShort: opts.isShort,
        videoUrl: opts.videoUrl,
      })
        .then((r) => { result.instagram = r; })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ platform: "instagram", error: msg });
          console.error(`❌ Instagram فشل: ${msg}`);
        }),
    );
  }

  if (routing.threads !== false && opts.videoUrl) {
    promises.push(
      publishToThreads({
        videoFilePath: opts.videoFilePath,
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
        isShort: opts.isShort,
        videoUrl: opts.videoUrl,
      })
        .then((r) => { result.threads = r; })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ platform: "threads", error: msg });
          console.error(`❌ Threads فشل: ${msg}`);
        }),
    );
  }

  await Promise.all(promises);
  result.errors = errors;

  const published = [
    result.youtube && "YouTube",
    result.facebook?.facebookVideoId && "Facebook",
    result.instagram?.instagramMediaId && "Instagram",
    result.threads?.threadsPostId && "Threads",
  ].filter(Boolean);

  console.log(`📢 تم النشر على: ${published.join(", ") || "لا شيء"}`);
  if (errors.length) {
    console.warn(`⚠️ فشل في ${errors.length} منصة:`);
    errors.forEach((e) => console.warn(`   - ${e.platform}: ${e.error}`));
  }

  return result;
}

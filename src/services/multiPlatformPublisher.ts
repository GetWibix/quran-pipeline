import { publishToFacebook, FacebookPublishOptions, FacebookPublishResult } from "./facebookPublisher";
import { publishToInstagram, InstagramPublishOptions, InstagramPublishResult } from "./instagramPublisher";
import { publishToThreads, ThreadsPublishOptions, ThreadsPublishResult } from "./threadsPublisher";

export interface MultiPlatformPublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean;
  /** رابط عام للفيديو — ضروري لـ Instagram + Threads (YouTube وFacebook كيشتغلو بلاو) */
  videoUrl?: string;
}

export interface MultiPlatformResult {
  youtube: { videoId: string; url: string } | null;
  facebook: FacebookPublishResult | null;
  instagram: InstagramPublishResult | null;
  threads: ThreadsPublishResult | null;
  errors: { platform: string; error: string }[];
}

/**
 * كينشر الفيديو على جميع المنصات المتاحة بشكل متوازي
 * كل منصة كتتخطى بهدوء إذا كانت إعداداتها ناقصة
 * الفيديو ما كيتحذف إلا بعد ما تخلص جميع المنصات
 */
export async function publishToAllPlatforms(
  opts: MultiPlatformPublishOptions,
  youtubeVideoId: string,
  youtubeVideoUrl: string
): Promise<MultiPlatformResult> {
  const errors: { platform: string; error: string }[] = [];
  const result: MultiPlatformResult = {
    youtube: youtubeVideoId ? { videoId: youtubeVideoId, url: youtubeVideoUrl } : null,
    facebook: null,
    instagram: null,
    threads: null,
    errors: [],
  };

  const commonOptions = {
    videoFilePath: opts.videoFilePath,
    title: opts.title,
    description: opts.description,
    tags: opts.tags,
    isShort: opts.isShort,
  };

  const promises: Promise<void>[] = [];

  // Facebook — نشر مباشر (يدعم رفع الملفات المحلية)
  promises.push(
    publishToFacebook(commonOptions)
      .then(r => { result.facebook = r; })
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ platform: "facebook", error: msg });
        console.error(`❌ Facebook فشل: ${msg}`);
      })
  );

  // Instagram — يحتاج رابط عام
  if (opts.videoUrl) {
    promises.push(
      publishToInstagram({ ...commonOptions, videoUrl: opts.videoUrl })
        .then(r => { result.instagram = r; })
        .catch(e => {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ platform: "instagram", error: msg });
          console.error(`❌ Instagram فشل: ${msg}`);
        })
    );
  }

  // Threads — يحتاج رابط عام
  if (opts.videoUrl) {
    promises.push(
      publishToThreads({ ...commonOptions, videoUrl: opts.videoUrl })
        .then(r => { result.threads = r; })
        .catch(e => {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ platform: "threads", error: msg });
          console.error(`❌ Threads فشل: ${msg}`);
        })
    );
  }

  await Promise.all(promises);
  result.errors = errors;

  // طباعة ملخص النشر
  const published = [
    result.youtube && "YouTube",
    result.facebook?.facebookVideoId && "Facebook",
    result.instagram?.instagramMediaId && "Instagram",
    result.threads?.threadsPostId && "Threads",
  ].filter(Boolean);

  console.log(`📢 تم النشر على: ${published.join(", ") || "لا شيء"}`);
  if (errors.length) {
    console.warn(`⚠️ فشل في ${errors.length} منصة:`);
    errors.forEach(e => console.warn(`   - ${e.platform}: ${e.error}`));
  }

  return result;
}

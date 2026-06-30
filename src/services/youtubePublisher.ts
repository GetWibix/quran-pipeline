/**
 * youtubePublisher.ts
 * كيرفع الفيديو النهائي إلى YouTube عبر Data API v3 (OAuth2)
 * كل عملية كتعدي أولاً عبر quotaTracker.canAfford() قبل التنفيذ
 *
 * متطلبات (env vars):
 * - YT_CLIENT_ID, YT_CLIENT_SECRET: من Google Cloud Console
 * - YT_REFRESH_TOKEN: تم الحصول عليه مرة واحدة عبر OAuth consent flow (راجع getRefreshToken.ts)
 */

import { google } from "googleapis";
import { createReadStream } from "fs";
import { canAfford, recordUsage, QUOTA_COSTS } from "./quotaTracker";

export interface PublishOptions {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  isShort: boolean; // كيتحدد عبر الـ aspect ratio (9:16) ومدة ≤ 60s
  thumbnailPath?: string;
  /** وقت النشر المجدول (ISO 8601). إذا undefined، كينشر فوراً (public) */
  scheduledPublishTime?: string;
  privacyStatus?: "private" | "public" | "unlisted";
}

export interface PublishResult {
  youtubeVideoId: string;
  videoUrl: string;
}

const ENGAGEMENT_COMMENTS = [
  "أي آية لمست قلبك اليوم؟ شاركنا برأيك في التعليقات 🕊️",
  "ما هو الدرس الذي أخذته من هذه الآيات؟ اكتبه في تعليق 🖋️",
  "سبحان الله.. تأمل في معاني هذه الآيات ودعنا نعرف أيها أثّر فيك 🌙",
  "آية تتلى.. وقلب يخشع. شاركنا مشاعرك مع هذه التلاوة 🤲",
  "هل شعرت بالراحة عند سماع هذه الآيات؟ اكتب نعم في تعليق 💚",
];

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });
  return oauth2Client;
}

/**
 * كيرفع فيديو واحد لـ YouTube مع جدولة النشر (إذا تم تحديد scheduledPublishTime)
 *
 * ملاحظة مهمة: للنشر المجدول، privacyStatus خاص يكون "private" مع تحديد
 * publishAt — يوتيوب كيغيّر الحالة تلقائياً لـ "public" فالوقت المحدد
 */
export async function publishVideo(
  opts: PublishOptions
): Promise<PublishResult> {
  // 1. فحص الـ Quota قبل أي شيء — احتياط أمان أساسي
  const totalCost =
    QUOTA_COSTS.VIDEO_INSERT +
    (opts.thumbnailPath ? QUOTA_COSTS.THUMBNAIL_SET : 0);

  const affordable = await canAfford(totalCost);
  if (!affordable) {
    throw new Error(
      `تجاوز السقف الآمن للـ YouTube API quota اليوم. الرفع مؤجل لليوم الجاي.`
    );
  }

  const auth = getOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  const isScheduled = Boolean(opts.scheduledPublishTime);

  // 2. رفع الفيديو الفعلي
  const insertResponse = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
        categoryId: "27", // "Education" - فئة تعليمية مناسبة لمحتوى قرآني
      },
      status: {
        privacyStatus: isScheduled
          ? "private"
          : opts.privacyStatus ?? "public",
        publishAt: opts.scheduledPublishTime,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(opts.videoFilePath),
    },
  });

  await recordUsage(QUOTA_COSTS.VIDEO_INSERT);

  const videoId = insertResponse.data.id;
  if (!videoId) {
    throw new Error("YouTube API رجع رد بدون videoId — راجع الاستجابة الكاملة");
  }

  // 3. تعيين الصورة المصغرة (إن وجدت) — اختياري لكن مفيد بزاف للـ CTR
  if (opts.thumbnailPath) {
    try {
      await youtube.thumbnails.set({
        videoId,
        media: { body: createReadStream(opts.thumbnailPath) },
      });
      await recordUsage(QUOTA_COSTS.THUMBNAIL_SET);
    } catch (err) {
      // فشل الـ thumbnail ماشي خطأ قاتل — الفيديو نُشر بنجاح، فقط بصورة مصغرة افتراضية
      console.error("فشل تعيين الصورة المصغرة (الفيديو نُشر بنجاح):", err);
    }
  }

  // 4. إضافة تعليق تلقائي لزيادة التفاعل
  await addEngagementComment(videoId, opts.title);

  return {
    youtubeVideoId: videoId,
    videoUrl: `https://youtube.com/watch?v=${videoId}`,
  };
}

/**
 * كيضيف تعليق تفاعلي على الفيديو بعد النشر (لزيادة التفاعل في المعلقادات)
 * الفكرة: التعليقات ترفع الفيديو في الاقتراحات حسب خوارزمية يوتيوب
 * هذا يتطلب صلاحية youtube.force-ssl في OAuth
 */
async function addEngagementComment(videoId: string, title: string): Promise<void> {
  try {
    const auth = getOAuthClient();
    const youtube = google.youtube({ version: "v3", auth });
    const comment = ENGAGEMENT_COMMENTS[Math.floor(Math.random() * ENGAGEMENT_COMMENTS.length)];

    await youtube.commentThreads.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: comment,
            },
          },
        },
      },
    });

    console.log(`💬 تم إضافة تعليق تلقائي على الفيديو ${videoId}`);
  } catch (err) {
    console.warn(`⚠️ تعذر إضافة التعليق التلقائي (قد تحتاج صلاحية youtube.force-ssl):`, err instanceof Error ? err.message : String(err));
  }
}

/**
 * كيسحب بيانات التفاعل (views, likes, comments) لفيديو معين
 * مستعملة من طرف الـ Decision Agent لقرارات "الزيادة حسب التفاعل"
 */
export async function fetchVideoStats(youtubeVideoId: string) {
  const affordable = await canAfford(QUOTA_COSTS.ANALYTICS_READ);
  if (!affordable) {
    throw new Error("تجاوز سقف الـ quota — لا يمكن سحب الإحصائيات الآن");
  }

  const auth = getOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  const res = await youtube.videos.list({
    part: ["statistics"],
    id: [youtubeVideoId],
  });

  await recordUsage(QUOTA_COSTS.ANALYTICS_READ);

  const stats = res.data.items?.[0]?.statistics;
  return {
    views: Number(stats?.viewCount ?? 0),
    likes: Number(stats?.likeCount ?? 0),
    comments: Number(stats?.commentCount ?? 0),
  };
}

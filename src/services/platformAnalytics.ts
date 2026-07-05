import { ContentType } from "@prisma/client";
import prisma from "../lib/prisma";

const API_VERSION = "v22.0";
const META_TOKEN = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ID ?? "";

interface FacebookPostInsights {
  reactions: number;
  comments: number;
  shares: number;
  videoViews: number;
}

async function fetchFacebookPostInsights(
  postId: string
): Promise<FacebookPostInsights | null> {
  if (!META_TOKEN) return null;

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${postId}/insights?metric=post_reactions_by_type_total,post_comments,post_shares,post_video_views&access_token=${META_TOKEN}`;
    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (data.error) {
      console.warn(`⚠️ Facebook Insights فشل للمنشور ${postId}: ${data.error.message}`);
      return null;
    }

    const extractValue = (metricName: string): number => {
      const metric = data.data?.find((m: any) => m.name === metricName);
      return metric?.values?.[0]?.value ?? 0;
    };

    const reactions = extractValue("post_reactions_by_type_total");
    const comments = extractValue("post_comments");
    const shares = extractValue("post_shares");
    const videoViews = extractValue("post_video_views");

    return { reactions, comments, shares, videoViews };
  } catch (err) {
    console.warn(`⚠️ Facebook Insights تعذر الاتصال:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function fetchInstagramMediaInsights(
  mediaId: string
): Promise<number | null> {
  if (!IG_USER_ID || !META_TOKEN) return null;

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${mediaId}/insights?metric=engagement,impressions,reach,video_views&access_token=${META_TOKEN}`;
    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (data.error) {
      console.warn(`⚠️ Instagram Insights فشل للمنشور ${mediaId}: ${data.error.message}`);
      return null;
    }

    const extractValue = (metricName: string): number => {
      const metric = data.data?.find((m: any) => m.name === metricName);
      return metric?.values?.[0]?.value ?? 0;
    };

    const engagement = extractValue("engagement");
    const impressions = extractValue("impressions");

    if (impressions === 0) return 0;
    return engagement / impressions;
  } catch (err) {
    console.warn(`⚠️ Instagram Insights تعذر الاتصال:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

export interface PlatformEngagement {
  facebook: { score: number; details: FacebookPostInsights } | null;
  instagram: { score: number } | null;
}

export async function fetchAllPlatformEngagement(
  facebookPostId: string | null,
  instagramMediaId: string | null
): Promise<PlatformEngagement> {
  const [fb, ig] = await Promise.all([
    facebookPostId ? fetchFacebookPostInsights(facebookPostId) : null,
    instagramMediaId ? fetchInstagramMediaInsights(instagramMediaId) : null,
  ]);

  return {
    facebook: fb
      ? {
          score: fb.videoViews > 0 ? (fb.reactions + fb.comments + fb.shares) / fb.videoViews : 0,
          details: fb,
        }
      : null,
    instagram: ig !== null ? { score: ig } : null,
  };
}

export async function updatePlatformEngagements(): Promise<{
  updated: number;
  facebook: { count: number; avgEngagement: number };
  instagram: { count: number; avgEngagement: number };
}> {
  const videos = await prisma.publishedContent.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { facebookVideoId: { not: null } },
        { instagramMediaId: { not: null } },
      ],
    },
    select: {
      id: true,
      facebookVideoId: true,
      instagramMediaId: true,
    },
  });

  let fbCount = 0;
  let fbTotalEngagement = 0;
  let igCount = 0;
  let igTotalEngagement = 0;
  const fbUpdates: { id: string; score: number }[] = [];
  const igUpdates: { id: string; score: number }[] = [];

  for (const video of videos) {
    try {
      const engagement = await fetchAllPlatformEngagement(
        video.facebookVideoId,
        video.instagramMediaId
      );

      if (engagement.facebook) {
        fbUpdates.push({ id: video.id, score: engagement.facebook.score });
        fbCount++;
        fbTotalEngagement += engagement.facebook.score;
      }

      if (engagement.instagram) {
        igUpdates.push({ id: video.id, score: engagement.instagram.score });
        igCount++;
        igTotalEngagement += engagement.instagram.score;
      }
    } catch (err) {
      console.warn(`⚠️ فشل تحديث ${video.id}:`, err instanceof Error ? err.message : String(err));
    }
  }

  if (fbUpdates.length > 0 || igUpdates.length > 0) {
    await prisma.$transaction([
      ...fbUpdates.map((u) =>
        prisma.publishedContent.update({
          where: { id: u.id },
          data: { facebookEngagement: u.score },
        })
      ),
      ...igUpdates.map((u) =>
        prisma.publishedContent.update({
          where: { id: u.id },
          data: { instagramEngagement: u.score },
        })
      ),
    ]);
  }

  return {
    updated: fbUpdates.length + igUpdates.length,
    facebook: {
      count: fbCount,
      avgEngagement: fbCount > 0 ? fbTotalEngagement / fbCount : 0,
    },
    instagram: {
      count: igCount,
      avgEngagement: igCount > 0 ? igTotalEngagement / igCount : 0,
    },
  };
}

export async function getPlatformAvgEngagement(
  platform: "youtube" | "facebook" | "instagram",
  count: number = 5
): Promise<number> {
  const field =
    platform === "youtube"
      ? "engagementScore"
      : platform === "facebook"
        ? "facebookEngagement"
        : "instagramEngagement";

  const recent = await prisma.publishedContent.findMany({
    where: {
      status: "PUBLISHED",
      [platform === "youtube"
        ? "youtubeVideoId"
        : platform === "facebook"
          ? "facebookVideoId"
          : "instagramMediaId"]: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: count,
    select: { [field]: true },
  });

  if (recent.length === 0) return 0;

  const sum = recent.reduce(
    (acc, v) => acc + ((v as any)[field] ?? 0),
    0
  );
  return sum / recent.length;
}

export interface PlatformPublishDecision {
  youtube: { shouldIncrease: boolean; score: number };
  facebook: { shouldIncrease: boolean; score: number };
  instagram: { shouldIncrease: boolean; score: number };
}

const THRESHOLDS = {
  youtube: 0.08,
  facebook: 0.05,
  instagram: 0.03,
};

export async function decidePlatformIncreases(): Promise<PlatformPublishDecision> {
  const [ytScore, fbScore, igScore] = await Promise.all([
    getPlatformAvgEngagement("youtube", 5),
    getPlatformAvgEngagement("facebook", 5),
    getPlatformAvgEngagement("instagram", 5),
  ]);

  return {
    youtube: {
      shouldIncrease: ytScore >= THRESHOLDS.youtube,
      score: ytScore,
    },
    facebook: {
      shouldIncrease: fbScore >= THRESHOLDS.facebook,
      score: fbScore,
    },
    instagram: {
      shouldIncrease: igScore >= THRESHOLDS.instagram,
      score: igScore,
    },
  };
}

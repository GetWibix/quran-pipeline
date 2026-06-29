/**
 * analyzeChannelTimes.ts
 * يحلل كل الفيديوهات المنشورة على القناة ويحدد أفضل أوقات النشر
 * بناءً على بيانات حقيقية (views, likes, comments) من YouTube API
 * مع إحصاءات دقيقة: إزالة القيم الشاذة، حساب التفاعل النسبي، الثقة الإحصائية.
 *
 * الاستخدام:
 *   npx ts-node src/scripts/analyzeChannelTimes.ts
 *   npx ts-node src/scripts/analyzeChannelTimes.ts --days 30
 *   npx ts-node src/scripts/analyzeChannelTimes.ts --min-views 100
 *   npx ts-node src/scripts/analyzeChannelTimes.ts --seed  ← تسجل في DB
 *
 * متطلبات .env:
 *   YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
 *   YT_CHANNEL_ID (اختياري)
 *   PUBLISH_TIMEZONE_OFFSET (افتراضي 3)
 */

import { google, youtube_v3 } from "googleapis";
import { PrismaClient, ContentType } from "@prisma/client";
import { getTimezoneOffset, utcHourToTarget } from "../services/publishingEngine/types";

const prisma = new PrismaClient();

interface VideoStats {
  videoId: string;
  title: string;
  publishedAt: Date;
  daysSincePublished: number;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;  // (likes + comments) / views
}

interface HourPerformance {
  hour: number;
  count: number;
  medianViews: number;
  avgViews: number;
  avgViews70: number;       // متوسط بعد إزالة أعلى/أدنى 30%
  medianLikes: number;
  avgLikes: number;
  medianComments: number;
  avgComments: number;
  avgEngagementRate: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  rawScore: number;         // score خام
  confidence: number;       // 0-1
  finalScore: number;       // rawScore * confidence
}

interface DayPerformance {
  day: number;       // 0=Sunday
  dayName: string;
  count: number;
  avgViews: number;
  medianViews: number;
  avgEngagementRate: number;
  score: number;
}

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

async function getChannelId(youtube: youtube_v3.Youtube): Promise<string> {
  const channelEnv = process.env.YT_CHANNEL_ID;
  if (channelEnv) return channelEnv;

  const res = await youtube.channels.list({
    part: ["id"],
    mine: true,
  });
  const id = res.data.items?.[0]?.id;
  if (!id) throw new Error("ما لقيتش channel ID. حدد YT_CHANNEL_ID في .env");
  return id;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function removeOutliers(arr: number[], percentile: number = 0.15): number[] {
  if (arr.length < 5) return arr;
  const sorted = [...arr].sort((a, b) => a - b);
  const trimStart = Math.floor(arr.length * percentile);
  const trimEnd = Math.ceil(arr.length * (1 - percentile));
  return sorted.slice(trimStart, trimEnd);
}

async function fetchAllVideos(
  youtube: youtube_v3.Youtube,
  channelId: string,
  maxDays?: number,
  minViews?: number
): Promise<VideoStats[]> {
  const channelRes = await youtube.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });
  const uploadsPlaylistId =
    channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("ما لقيتش uploads playlist");

  const videoIds: string[] = [];
  let pageToken: string | undefined;
  const cutoffDate = maxDays
    ? new Date(Date.now() - maxDays * 86400000)
    : undefined;

  do {
    const playlistRes = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of playlistRes.data.items ?? []) {
      const publishedAt = new Date(
        item.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt ?? ""
      );
      if (cutoffDate && publishedAt < cutoffDate) continue;
      if (item.contentDetails?.videoId) {
        videoIds.push(item.contentDetails.videoId);
      }
    }
    pageToken = playlistRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  if (videoIds.length === 0) {
    console.log("⚠️ ما لقيتش فيديوهات في القناة");
    return [];
  }

  console.log(`📥 جلب إحصائيات ${videoIds.length} فيديو...`);

  const now = Date.now();
  const stats: VideoStats[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const statsRes = await youtube.videos.list({
      part: ["snippet", "statistics"],
      id: batch,
    });

    for (const item of statsRes.data.items ?? []) {
      const views = Number(item.statistics?.viewCount ?? 0);
      const likes = Number(item.statistics?.likeCount ?? 0);
      const comments = Number(item.statistics?.commentCount ?? 0);
      const publishedAt = new Date(item.snippet?.publishedAt ?? "");
      const daysSincePublished = (now - publishedAt.getTime()) / 86400000;

      if (minViews && views < minViews) continue;

      stats.push({
        videoId: item.id!,
        title: item.snippet?.title ?? "",
        publishedAt,
        daysSincePublished: Math.max(daysSincePublished, 1),
        views,
        likes,
        comments,
        engagementRate: views > 0 ? (likes + comments) / views : 0,
      });
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return stats;
}

function analyzeByHour(
  videos: VideoStats[],
  timezoneOffset: number
): HourPerformance[] {
  const byHour = new Map<number, VideoStats[]>();

  for (const v of videos) {
    const utcHour = v.publishedAt.getUTCHours();
    const localHour = utcHourToTarget(utcHour);
    const arr = byHour.get(localHour) ?? [];
    arr.push(v);
    byHour.set(localHour, arr);
  }

  const totalVideos = videos.length;
  const medianViewsAll = median(videos.map((v) => v.views));

  const results: HourPerformance[] = [];
  for (let h = 0; h < 24; h++) {
    const group = byHour.get(h) ?? [];
    if (group.length === 0) continue;

    const viewsArr = group.map((v) => v.views);
    const likesArr = group.map((v) => v.likes);
    const commentsArr = group.map((v) => v.comments);
    const totalViews = viewsArr.reduce((s, v) => s + v, 0);
    const totalLikes = likesArr.reduce((s, v) => s + v, 0);
    const totalComments = commentsArr.reduce((s, v) => s + v, 0);
    const avgEngRate = group.reduce((s, v) => s + v.engagementRate, 0) / group.length;

    // إزالة القيم الشاذة (أعلى/أدنى 15%)
    const cleanedViews = removeOutliers(viewsArr, 0.15);
    const avgViews70 = cleanedViews.length > 0
      ? cleanedViews.reduce((s, v) => s + v, 0) / cleanedViews.length
      : 0;

    // Normalized score: أداء الساعة مقارنة بمتوسط القناة
    const viewsRatio = medianViewsAll > 0 ? median(viewsArr) / medianViewsAll : 1;

    // Engagement score: تفاعل نسبي
    const engagementScore = Math.min(avgEngRate / 0.05, 2); // 5% معيار

    // Sample confidence: كلما زادت العينة، زادت الثقة
    const confidence = Math.min(group.length / 8, 1); // 8 فيديوهات = ثقة كاملة

    // الوزن النهائي: views (50%) + engagement (30%) + حجم العينة (20%)
    const rawScore =
      viewsRatio * 0.50 +
      engagementScore * 0.30 +
      confidence * 0.20;

    results.push({
      hour: h,
      count: group.length,
      medianViews: median(viewsArr),
      avgViews: Math.round(totalViews / group.length),
      avgViews70: Math.round(avgViews70),
      medianLikes: median(likesArr),
      avgLikes: Math.round(totalLikes / group.length),
      medianComments: median(commentsArr),
      avgComments: Math.round(totalComments / group.length),
      avgEngagementRate: avgEngRate,
      totalViews,
      totalLikes,
      totalComments,
      rawScore: +rawScore.toFixed(4),
      confidence: +confidence.toFixed(2),
      finalScore: +(rawScore * confidence * (1 + confidence * 0.3)).toFixed(4),
    });
  }

  results.sort((a, b) => b.finalScore - a.finalScore);
  return results;
}

function analyzeByDay(videos: VideoStats[], timezoneOffset: number): DayPerformance[] {
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const byDay = new Map<number, VideoStats[]>();

  for (const v of videos) {
    const utcDay = v.publishedAt.getUTCDay();
    // Adjust for timezone
    const localHour = v.publishedAt.getUTCHours() + timezoneOffset;
    let day = utcDay;
    if (localHour >= 24) day = (day + 1) % 7;
    else if (localHour < 0) day = (day + 6) % 7;

    const arr = byDay.get(day) ?? [];
    arr.push(v);
    byDay.set(day, arr);
  }

  const results: DayPerformance[] = [];
  for (let d = 0; d < 7; d++) {
    const group = byDay.get(d) ?? [];
    if (group.length === 0) continue;

    const viewsArr = group.map((v) => v.views);
    const avgViews = Math.round(viewsArr.reduce((s, v) => s + v, 0) / group.length);
    const medianViews = median(viewsArr);
    const avgEngRate = group.reduce((s, v) => s + v.engagementRate, 0) / group.length;
    const cleanedViews = removeOutliers(viewsArr, 0.15);
    const robustAvg = cleanedViews.length > 0
      ? cleanedViews.reduce((s, v) => s + v, 0) / cleanedViews.length
      : avgViews;

    results.push({
      day: d,
      dayName: dayNames[d],
      count: group.length,
      avgViews,
      medianViews: Math.round(medianViews),
      avgEngagementRate: avgEngRate,
      score: +(robustAvg / 1000 * 0.6 + avgEngRate * 200 * 0.4).toFixed(2),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

function printResults(
  hourResults: HourPerformance[],
  dayResults: DayPerformance[],
  totalVideos: number,
  totalFiltered: number,
  contentType: string
) {
  console.log(`\n${"═".repeat(75)}`);
  console.log(`  📊 تقرير تحليل ${totalFiltered} فيديو (من أصل ${totalVideos} — ${contentType})`);
  if (totalVideos !== totalFiltered) {
    console.log(`  🗑️ تم استبعاد ${totalVideos - totalFiltered} فيديو (لا تستوفي الحد الأدنى)`);
  }
  console.log(`${"═".repeat(75)}`);

  if (hourResults.length === 0) {
    console.log("  ⚠️ لا توجد بيانات كافية");
    return;
  }

  // ─── أفضل وقت ──────────────────────────────────
  const best = hourResults[0];
  const bestDay = dayResults[0];
  console.log(`\n  🏆 التوصية النهائية:`);
  console.log(`     ⏰ الوقت: ${String(best.hour).padStart(2, "0")}:00`);
  console.log(`     📅 اليوم: ${bestDay?.dayName ?? "—"}`);
  console.log(`     📈 الثقة: ${best.confidence >= 0.7 ? "عالية" : best.confidence >= 0.4 ? "متوسطة" : "ضعيفة"}`);
  console.log(`     📊 يعتمد على ${best.count} فيديو`);

  // ─── جدول الساعات ──────────────────────────────
  console.log(`\n  ┌─────┬────────┬──────┬────────────┬────────────┬──────────┬──────────┐`);
  console.log(`  │  #  │ الوقت  │ عدد  │ متوسط 🎬  │ متوسط 70% │ تفاعل 💚 │ ثقة 📊   │`);
  console.log(`  ├─────┼────────┼──────┼────────────┼────────────┼──────────┼──────────┤`);

  const topCount = Math.min(hourResults.length, 24);
  for (let i = 0; i < topCount; i++) {
    const r = hourResults[i];
    const time = `${String(r.hour).padStart(2, "0")}:00`;
    const engagementPct = (r.avgEngagementRate * 100).toFixed(1);
    const confidenceLabel =
      r.confidence >= 0.7 ? "🟢" : r.confidence >= 0.4 ? "🟡" : "🔴";

    // شريط بصري
    const barLen = Math.max(1, Math.round((r.finalScore / hourResults[0].finalScore) * 10));
    const bar = "▓".repeat(barLen) + "░".repeat(10 - barLen);

    console.log(
      `  │ ${String(i + 1).padStart(2)} │ ${time}    │ ${String(r.count).padStart(3)}  │ ${String(r.avgViews70).padStart(10)}  │ ${String(r.avgViews).padStart(10)}  │ ${engagementPct.padStart(4)}%   │ ${confidenceLabel} ${bar} │`
    );
  }
  console.log(`  └─────┴────────┴──────┴────────────┴────────────┴──────────┴──────────┘`);
  console.log(`  * متوسط 70% = بدون أعلى/أدنى 15% (لإزالة القيم الشاذة)`);

  // ─── تفاصيل الوقت الأفضل ───────────────────────
  console.log(`\n  📋 تفاصيل أفضل وقت (${String(best.hour).padStart(2, "0")}:00):`);
  console.log(`     📹 عدد الفيديوهات: ${best.count}`);
  console.log(`     📊 متوسط المشاهدات: ${best.avgViews.toLocaleString("ar-SA")}`);
  console.log(`     📊 متوسط المشاهدات (بدون شواذ): ${best.avgViews70.toLocaleString("ar-SA")}`);
  console.log(`     💚 متوسط التفاعل: ${(best.avgEngagementRate * 100).toFixed(2)}%`);
  console.log(`     👍 متوسط الإعجابات: ${best.avgLikes}`);
  console.log(`     💬 متوسط التعليقات: ${best.avgComments}`);

  // ─── جدول الأيام ───────────────────────────────
  if (dayResults.length > 0) {
    console.log(`\n  📅 تحليل حسب اليوم:`);
    console.log(`  ┌──────┬──────────┬──────┬────────────┬────────────┐`);
    console.log(`  │  #   │ اليوم    │ عدد  │ متوسط 🎬  │ تفاعل 💚   │`);
    console.log(`  ├──────┼──────────┼──────┼────────────┼────────────┤`);

    for (let i = 0; i < Math.min(dayResults.length, 7); i++) {
      const d = dayResults[i];
      console.log(
        `  │ ${String(i + 1).padStart(2)}   │ ${d.dayName.padStart(6)}  │ ${String(d.count).padStart(3)}  │ ${String(d.medianViews).padStart(10)}  │ ${(d.avgEngagementRate * 100).toFixed(1).padStart(6)}%   │`
      );
    }
    console.log(`  └──────┴──────────┴──────┴────────────┴────────────┘`);
  }

  // ─── جميع الأوقات مرتبة ────────────────────────
  console.log(`\n  📋 جميع الأوقات مرتبة حسب الأداء:`);
  for (let i = 0; i < topCount; i++) {
    const r = hourResults[i];
    const star = i === 0 ? "🏆" : i < 3 ? "⭐" : "  ";
    const conf = r.confidence >= 0.7 ? "✓" : r.confidence >= 0.4 ? "~" : "!";
    console.log(
      `     ${star} ${String(r.hour).padStart(2, "0")}:00  │ ${String(r.count).padStart(2)} فيديو │ متوسط ${String(r.avgViews70).padStart(6)} 🎬 │ تفاعل ${(r.avgEngagementRate * 100).toFixed(1)}% │ ثقة ${conf}`
    );
  }

  // ─── توصيات ────────────────────────────────────
  const top3 = hourResults.slice(0, 3).filter((r) => r.confidence >= 0.3);
  if (top3.length > 0) {
    console.log(`\n${"─".repeat(75)}`);
    console.log("  💡 التوصيات:");
    const bestTime = top3[0];
    console.log(`     • أنسب وقت: ${String(bestTime.hour).padStart(2, "0")}:00`);
    console.log(`       → ضع DEFAULT_PUBLISH_HOUR=${bestTime.hour} في .env`);

    if (bestDay) {
      console.log(`     • أفضل يوم: ${bestDay.dayName}`);
    }

    if (top3.length > 1) {
      const alternatives = top3.slice(1).map((r) => `${String(r.hour).padStart(2, "0")}:00`).join(", ");
      console.log(`     • بدائل جيدة: ${alternatives}`);
    }

    if (best.confidence < 0.5) {
      console.log(`     ⚠️ الثقة منخفضة — يفضل جمع المزيد من العينات`);
    }
    console.log(`${"─".repeat(75)}`);
  }
}

async function seedTimeSlots(
  hourResults: HourPerformance[],
  dayResults: DayPerformance[],
  contentType: ContentType
) {
  console.log("\n💾 تسجيل النتائج في قاعدة البيانات...");
  let count = 0;

  // تسجيل الأوقات (ساعات)
  for (const r of hourResults) {
    const existing = await prisma.timeSlotScore.findUnique({
      where: {
        contentType_hour_minute: { contentType, hour: r.hour, minute: 0 },
      },
    });

    if (existing) {
      await prisma.timeSlotScore.update({
        where: { id: existing.id },
        data: {
          performanceScore: r.finalScore,
          sampleCount: r.count,
          confidence: r.confidence,
          lastAnalyzedAt: new Date(),
        },
      });
    } else {
      await prisma.timeSlotScore.create({
        data: {
          contentType,
          hour: r.hour,
          minute: 0,
          performanceScore: r.finalScore,
          sampleCount: r.count,
          confidence: r.confidence,
        },
      });
    }
    count++;
  }

  // تسجيل الأيام — نخزنهم بنفس الطريقة (minute = 1)
  for (const d of dayResults) {
    const existing = await prisma.timeSlotScore.findUnique({
      where: {
        contentType_hour_minute: { contentType, hour: d.day, minute: 1 },
      },
    });

    if (existing) {
      await prisma.timeSlotScore.update({
        where: { id: existing.id },
        data: {
          performanceScore: d.score,
          sampleCount: d.count,
          confidence: Math.min(1, d.count / 8),
          lastAnalyzedAt: new Date(),
        },
      });
    } else {
      await prisma.timeSlotScore.create({
        data: {
          contentType,
          hour: d.day,
          minute: 1,
          performanceScore: d.score,
          sampleCount: d.count,
          confidence: Math.min(1, d.count / 8),
        },
      });
    }
  }

  // تسجيل توصية في AgentDecisionLog
  const bestHour = hourResults[0];
  const bestDay = dayResults[0];
  await prisma.agentDecisionLog.create({
    data: {
      decisionType: "CHANNEL_ANALYSIS_SEED",
      reasoning: `تحليل ${hourResults.reduce((s, r) => s + r.count, 0)} فيديو: أفضل وقت ${bestHour.hour}:00 (score: ${bestHour.finalScore}, ثقة: ${bestHour.confidence})${bestDay ? `، أفضل يوم ${bestDay.dayName}` : ""}`,
      contextData: {
        totalVideos: hourResults.reduce((s, r) => s + r.count, 0),
        bestHour: bestHour.hour,
        bestHourScore: bestHour.finalScore,
        bestHourConfidence: bestHour.confidence,
        bestDay: bestDay?.day,
        topHours: hourResults.slice(0, 5).map((r) => ({ hour: r.hour, score: r.finalScore, count: r.count })),
      },
    },
  });

  console.log(`✅ تم تسجيل ${count} توقيت + توصية في قاعدة البيانات`);
  console.log(`   🔄 محرك النشر الذكي سيستعمل هاد البيانات فوراً`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback?: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
  };

  return {
    maxDays: get("--days") ? parseInt(get("--days")!, 10) : undefined,
    minViews: get("--min-views") ? parseInt(get("--min-views")!, 10) : undefined,
    doSeed: args.includes("--seed"),
    contentType: (args.includes("--long") ? "LONG_VIDEO" : "SHORT") as ContentType,
  };
}

async function main() {
  const opts = parseArgs();
  const timezoneOffset = getTimezoneOffset();

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   📊  Quran Pipeline — محلل أوقات النشر المتقدم    ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`🌍 التوقيت: UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneOffset}`);
  if (opts.maxDays) console.log(`📅 المدى: آخر ${opts.maxDays} يوم`);
  if (opts.minViews) console.log(`📊 حد أدنى: ${opts.minViews} مشاهدة`);
  console.log(`🎬 النوع: ${opts.contentType}`);

  const auth = getOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  console.log("\n🔍 جلب بيانات القناة...");
  const channelId = await getChannelId(youtube);
  console.log(`   ✅ Channel ID: ${channelId}`);

  const allVideos = await fetchAllVideos(youtube, channelId, opts.maxDays, opts.minViews);
  const totalFetched = allVideos.length;

  if (totalFetched === 0) {
    console.log("⚠️ ما لقيتش فيديوهات");
    await prisma.$disconnect();
    return;
  }

  // إحصائيات عامة
  const totalViewsAll = allVideos.reduce((s, v) => s + v.views, 0);
  const avgViewsAll = Math.round(totalViewsAll / totalFetched);
  const medianViewsAll = Math.round(median(allVideos.map((v) => v.views)));
  const avgEngAll = allVideos.reduce((s, v) => s + v.engagementRate, 0) / totalFetched;

  console.log(`\n  📈 إحصائيات عامة للقناة:`);
  console.log(`     📹 إجمالي الفيديوهات: ${totalFetched}`);
  console.log(`     👁️ إجمالي المشاهدات: ${totalViewsAll.toLocaleString("ar-SA")}`);
  console.log(`     📊 متوسط المشاهدات: ${avgViewsAll.toLocaleString("ar-SA")}`);
  console.log(`     📊 متوسط (median):  ${medianViewsAll.toLocaleString("ar-SA")}`);
  console.log(`     💚 متوسط التفاعل:   ${(avgEngAll * 100).toFixed(2)}%`);

  const hourResults = analyzeByHour(allVideos, timezoneOffset);
  const dayResults = analyzeByDay(allVideos, timezoneOffset);
  printResults(hourResults, dayResults, totalFetched, totalFetched, opts.contentType);

  if (opts.doSeed) {
    await seedTimeSlots(hourResults, dayResults, opts.contentType);
  }

  await prisma.$disconnect();
  console.log("\n✅ تم التحليل بنجاح");
}

main().catch(async (err) => {
  console.error("❌ فشل:", err instanceof Error ? err.message : String(err));
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

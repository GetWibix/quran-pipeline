import { google } from "googleapis";

const CACHE: Map<string, string> = new Map();

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

function sanitizePlaylistName(surahName: string): string {
  return `سورة ${surahName} | تلاوات قرآنية`;
}

export async function addVideoToSurahPlaylist(
  youtubeVideoId: string,
  surahNumber: number,
  surahName: string
): Promise<void> {
  const playlistTitle = sanitizePlaylistName(surahName);
  let playlistId: string | undefined;

  // 1. جلب من الكاش أولاً
  const cacheKey = `${surahNumber}-${playlistTitle}`;
  playlistId = CACHE.get(cacheKey);

  if (!playlistId) {
    // 2. البحث عن بلاي ليست موجودة
    const auth = getOAuthClient();
    const youtube = google.youtube({ version: "v3", auth });

    const listResponse = await youtube.playlists.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
    });

    const existing = listResponse.data.items?.find((p) =>
      p.snippet?.title?.includes(`سورة ${surahName}`)
    );
    playlistId = existing?.id ?? undefined;

    // 3. إنشاء بلاي ليست جديدة إذا ما لقيناها
    if (!playlistId) {
      const createResponse = await youtube.playlists.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: playlistTitle,
            description: `مجموعة تلاوات لسورة ${surahName} - يتم تحديثها تلقائياً`,
            defaultLanguage: "ar",
          },
          status: {
            privacyStatus: "public",
          },
        },
      });
      playlistId = createResponse.data.id ?? undefined;
      if (!playlistId) return;
    }

    CACHE.set(cacheKey, playlistId);
  }

  // 4. إضافة الفيديو للبلاي ليست
  const auth = getOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  await youtube.playlistItems.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: youtubeVideoId,
        },
      },
    },
  });
}

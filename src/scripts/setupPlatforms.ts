/**
 * setupPlatforms.ts
 * سكربت مساعد لفحص والتحقق من توكنز منصات التواصل الاجتماعي
 *
 * Usage:
 *   npx ts-node src/scripts/setupPlatforms.ts
 *   npx ts-node src/scripts/setupPlatforms.ts --verify   ← يختبر التوكنز
 *   npx ts-node src/scripts/setupPlatforms.ts --guide    ← يطبع التعليمات فقط
 */

import "dotenv/config";

// ─── الفحص الحالي ─────────────────────────────────────────────

function checkEnv(): Record<string, { value: string; ok: boolean }> {
  const checks: Record<string, string> = {
    // YouTube
    YT_CLIENT_ID: process.env.YT_CLIENT_ID ?? "",
    YT_CLIENT_SECRET: process.env.YT_CLIENT_SECRET ?? "",
    YT_REFRESH_TOKEN: process.env.YT_REFRESH_TOKEN ?? "",
    // Facebook
    META_APP_ID: process.env.META_APP_ID ?? "",
    META_APP_SECRET: process.env.META_APP_SECRET ?? "",
    META_PAGE_ID: process.env.META_PAGE_ID ?? "",
    META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN ?? "",
    // Instagram
    INSTAGRAM_BUSINESS_ID: process.env.INSTAGRAM_BUSINESS_ID ?? "",
    // Threads
    THREADS_USER_ID: process.env.THREADS_USER_ID ?? "",
    THREADS_ACCESS_TOKEN: process.env.THREADS_ACCESS_TOKEN ?? "",
  };

  const result: Record<string, { value: string; ok: boolean }> = {};
  for (const [key, val] of Object.entries(checks)) {
    result[key] = { value: val ? val.substring(0, 20) + "..." : "(فارغ)", ok: Boolean(val) };
  }
  return result;
}

const PLATFORM_GUIDE: Record<string, { name: string; steps: string[]; env: string[] }> = {
  youtube: {
    name: "YouTube",
    steps: [
      "1. افتح https://console.cloud.google.com",
      "2. اختر مشروعك ← APIs & Services ← Credentials",
      "3. Create Credentials ← OAuth Client ID ← Desktop Application",
      "4. انسخ Client ID و Client Secret في .env",
      "5. شغّل: npm run get-refresh-token",
    ],
    env: ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"],
  },
  facebook: {
    name: "Facebook/Instagram",
    steps: [
      "1. افتح https://developers.facebook.com/apps",
      "2. أنشئ تطبيق (أو استخدم الموجود) ← Add Product ← Facebook Login for Business",
      "3. Settings ← Basic ← انسخ App ID و App Secret في .env",
      "4. Products ← Facebook Login ← Settings ← OAuth redirect URIs: http://localhost",
      "5. Products ← Facebook Login ← Permissions: أضف: pages_manage_posts, pages_read_engagement",
      "6. Products ← Instagram Graph API ← تفعيل",
      "7. Tools ← Graph API Explorer:",
      "   - Application: اختر تطبيقك",
      "   - Permissions: pages_manage_posts, pages_read_engagement, instagram_basic",
      "   - Generate Token ← اختر صفحتك",
      "   - انسخ Page Access Token في .env كـ META_PAGE_ACCESS_TOKEN",
      "8. نفس الصفحة، ارسل GET /me/accounts ← خذ page_id ← حطه في META_PAGE_ID",
      "9. ارسل GET /{page-id}?fields=instagram_business_account",
      "   ← خذ instagram_business_account.id ← حطه في INSTAGRAM_BUSINESS_ID",
    ],
    env: ["META_APP_ID", "META_APP_SECRET", "META_PAGE_ID", "META_PAGE_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ID"],
  },
  threads: {
    name: "Threads",
    steps: [
      "1. تأكد من أن تطبيقك في Meta Developers مسجل فيه Threads API",
      "2. افتح Graph API Explorer ← اختر تطبيقك",
      "3. Permissions: threads_basic, threads_content_publish, threads_read_replies",
      "4. Generate Token ← اختر حساب Threads",
      "5. انسخ User ID في THREADS_USER_ID",
      "6. انسخ Access Token في THREADS_ACCESS_TOKEN",
    ],
    env: ["THREADS_USER_ID", "THREADS_ACCESS_TOKEN"],
  },
};

// ─── التحقق من صحة التوكن عبر API ────────────────────────────

async function verifyYouTube(): Promise<boolean> {
  if (!process.env.YT_REFRESH_TOKEN) return false;
  try {
    const { google } = await import("googleapis");
    const oauth2 = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
    );
    oauth2.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN });
    const youtube = google.youtube({ version: "v3", auth: oauth2 });
    await youtube.channels.list({ part: ["id"], mine: true });
    return true;
  } catch {
    return false;
  }
}

async function verifyFacebook(): Promise<boolean> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${pageId}?fields=id,name&access_token=${token}`,
    );
    const data = (await res.json()) as any;
    return !data.error;
  } catch {
    return false;
  }
}

async function verifyInstagram(): Promise<boolean> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const igId = process.env.INSTAGRAM_BUSINESS_ID;
  if (!token || !igId) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${igId}?fields=id,username&access_token=${token}`,
    );
    const data = (await res.json()) as any;
    return !data.error;
  } catch {
    return false;
  }
}

async function verifyThreads(): Promise<boolean> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return false;
  try {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${userId}?fields=id,username&access_token=${token}`,
    );
    const data = (await res.json()) as any;
    return !data.error;
  } catch {
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isGuide = args.includes("--guide");
  const isVerify = args.includes("--verify");

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║    🛠️  إعداد منصات التواصل الاجتماعي           ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (isGuide) {
    for (const [, platform] of Object.entries(PLATFORM_GUIDE)) {
      console.log(`\n${"━".repeat(50)}`);
      console.log(`📱 ${platform.name}`);
      console.log(`${"━".repeat(50)}`);
      platform.steps.forEach((s) => console.log(s));
      console.log(`\n   المتغيرات: ${platform.env.join(", ")}\n`);
    }
    return;
  }

  // فحص env
  console.log("📋 فحص المتغيرات في .env:\n");
  const env = checkEnv();
  const allOk = Object.values(env).every((e) => e.ok);
  for (const [key, val] of Object.entries(env)) {
    console.log(`   ${val.ok ? "✅" : "❌"} ${key}: ${val.value}`);
  }
  console.log(`\n   ${allOk ? "✅ كل المتغيرات موجودة" : "⚠️ بعض المتغيرات ناقصة — راجع --guide"}\n`);

  if (isVerify) {
    console.log(`${"━".repeat(50)}`);
    console.log("🔍 التحقق من صحة التوكنز عبر API:\n");

    const yt = await verifyYouTube();
    console.log(`   ${yt ? "✅" : "❌"} يوتيوب: ${yt ? "التوكن صالح" : "فشل — قد تحتاج refresh token جديد"}`);

    const fb = await verifyFacebook();
    console.log(`   ${fb ? "✅" : "❌"} فيسبوك: ${fb ? "التوكن صالح" : "فشل — راجع الصلاحيات"}`);

    const ig = await verifyInstagram();
    console.log(`   ${ig ? "✅" : "❌"} انستغرام: ${ig ? "التوكن صالح" : "فشل — تأكد من connect الحساب"}`);

    const th = await verifyThreads();
    console.log(`   ${th ? "✅" : "❌"} تريدز: ${th ? "التوكن صالح" : "فشل — راجع الصلاحيات"}\n`);
  }

  if (!allOk || isVerify) {
    console.log(`${"━".repeat(50)}`);
    console.log("💡 نصيحة: شغّل التعليمات:");
    console.log("   npx ts-node src/scripts/setupPlatforms.ts --guide\n");
  }
}

main().catch((err) => {
  console.error("❌ فشل:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

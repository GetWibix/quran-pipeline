/**
 * getRefreshToken.ts
 * سكريبت يُشغّل مرة واحدة فقط (يدوياً) للحصول على YT_REFRESH_TOKEN
 * يستخدم تدفق OAuth 2.0 الحديث (loopback IP redirect) بدلاً من OOB الملغى
 *
 * المتطلبات:
 *   - Google Cloud Console → OAuth Client من نوع "Desktop Application"
 *   - Client ID + Client Secret في .env
 *
 * طريقة الاستخدام:
 *   1. npx ts-node src/scripts/getRefreshToken.ts
 *   2. السكريبت غادي يفتح المتصفح ع鹄ي تلقائياً
 *   3. سجل دخول بالحساب اللي فيه قناة اليوتيوب، وافق على الصلاحيات
 *   4. السكريبت غادي يستقبل الـ code تلقائياً ويطبع الـ refresh_token
 *   5. حط الـ refresh_token فملف .env كـ YT_REFRESH_TOKEN
 */

import "dotenv/config";
import { google } from "googleapis";
import http from "http";
import url from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as import("net").AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      await execAsync(`open "${url}"`);
    } else if (platform === "win32") {
      await execAsync(`start "" "${url}"`);
    } else {
      await execAsync(`xdg-open "${url}"`);
    }
  } catch {
    console.log("\n⚠️  تعذر فتح المتصفح تلقائياً. افتح الرابط أعلاه يدوياً.");
  }
}

async function main(): Promise<void> {
  const clientId = process.env.YT_CLIENT_ID;
  const clientSecret = process.env.YT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ تأكد من وجود YT_CLIENT_ID و YT_CLIENT_SECRET في ملف .env");
    process.exit(1);
  }

  const port = await findFreePort();
  const redirectUri = `http://127.0.0.1:${port}`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n🔑 افتح الرابط التالي في المتصفح:\n");
  console.log(authUrl);
  console.log("\n⚠️  إذا لم يفتح المتصفح تلقائياً، انسخ الرابط أعلاه والصقه في المتصفح.");
  console.log("   بعد الموافقة، السكريبت سيكمل تلقائياً دون الحاجة للصق أي كود.\n");
  await openBrowser(authUrl);

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url) return;

      const parsed = url.parse(req.url, true);
      const authCode = parsed.query.code as string | undefined;
      const error = parsed.query.error as string | undefined;

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>❌ تم رفض التفويض</h1><p>أغلق هاد الصفحة وراجع السكريبت في الطرفية.</p>",
        );
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>✅ تم استقبال رمز التفويض!</h1><p>أغلق هاد الصفحة وراجع السكريبت في الطرفية للحصول على التوكن.</p>",
        );
        server.close();
        resolve(authCode);
      }
    });

    server.listen(port, "127.0.0.1");
    server.on("error", reject);
  });

  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\n✅ نجح!\n");
    console.log("انسخ هاد السطر وحطه في ملف .env:\n");
    console.log(`YT_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(
      "\n⚠️  خزن هاد التوكن بشكل آمن — هو يعطي صلاحية كاملة لرفع فيديوهات على القناة\n",
    );
  } catch (err) {
    console.error("فشل الحصول على التوكن:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ فشل:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

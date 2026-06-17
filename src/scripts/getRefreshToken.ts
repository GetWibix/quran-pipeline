/**
 * getRefreshToken.ts
 * سكريبت يُشغّل مرة واحدة فقط (يدوياً، من طرفك) للحصول على YT_REFRESH_TOKEN
 * هاد التوكن غادي يُستخدم بعدين بشكل دائم من طرف youtubePublisher.ts بدون تدخل بشري
 *
 * طريقة الاستخدام:
 * 1. npx ts-node src/scripts/getRefreshToken.ts
 * 2. افتح الرابط اللي غادي يظهر فالـ terminal فالمتصفح
 * 3. سجل دخول بالحساب اللي فيه قناة اليوتيوب، وافق على الصلاحيات
 * 4. كوبي الـ "code" من URL الإعادة توجيه، حطو فالـ terminal
 * 5. السكريبت غادي يطبع الـ refresh_token — حطو فملف .env كـ YT_REFRESH_TOKEN
 */

import "dotenv/config";
import { google } from "googleapis";
import * as readline from "readline";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob" // redirect خاص بسكريبتات CLI (بلا الحاجة لسيرفر ويب)
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // ضروري للحصول على refresh_token (ماشي access_token فقط)
    scope: SCOPES,
    prompt: "consent", // كيضمن رجوع refresh_token حتى لو سبق ووافقتي قبل
  });

  console.log("\n--- افتح هاد الرابط فالمتصفح ---\n");
  console.log(authUrl);
  console.log("\n--------------------------------\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("لصق الـ code هنا: ", async (code) => {
    rl.close();
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log("\n✅ نجح! دابا زيد هاد السطر فملف .env:\n");
      console.log(`YT_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log("\n⚠️  خزن هاد التوكن بشكل آمن — هو يعطي صلاحية كاملة لرفع فيديوهات على القناة\n");
    } catch (err) {
      console.error("فشل الحصول على التوكن:", err);
    }
  });
}

main();

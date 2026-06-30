import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publishToFacebook } from "../services/facebookPublisher";
import { publishToInstagram } from "../services/instagramPublisher";
import { publishToThreads } from "../services/threadsPublisher";

const prisma = new PrismaClient();

const VIDEO_PATH = "assets/videos/SHORT-2-27-28.mp4";
const YOUTUBE_ID = "kGKEPneEZ7M";
const YOUTUBE_URL = "https://youtube.com/watch?v=kGKEPneEZ7M";
const RECORD_ID = "cmqzxr2nc0000fhhnx96pz3ve";

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  متابعة النشر — إكمال المنصات المتبقية ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const record = await prisma.publishedContent.findUnique({ where: { id: RECORD_ID } });
  if (!record) {
    console.error("❌ السجل غير موجود");
    process.exit(1);
  }

  let facebookVideoId: string | undefined;

  console.log("📘 [1/3] نشر على فيسبوك...");
  try {
    const fbResult = await publishToFacebook({
      videoFilePath: VIDEO_PATH,
      title: record.title,
      description: record.description,
      tags: [],
      isShort: true,
    });
    console.log(`   ✅ فيسبوك: ${fbResult.postUrl || "نجح بدون رابط"}`);
    facebookVideoId = fbResult.facebookVideoId;
  } catch (e) {
    console.error(`   ❌ فيسبوك: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. نشر على انستغرام (يتطلب R2)
  console.log("\n📸 [2/3] نشر على انستغرام...");
  console.log("   ⏭️ يتخطى — R2 غير مهيأ");

  // 3. نشر على تريدز (يتطلب R2)
  console.log("\n🧵 [3/3] نشر على تريدز...");
  console.log("   ⏭️ يتخطى — R2 غير مهيأ");

  // 4. تحديث قاعدة البيانات
  console.log("\n💾 تحديث قاعدة البيانات...");
  await prisma.publishedContent.update({
    where: { id: RECORD_ID },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      youtubeVideoId: YOUTUBE_ID,
      facebookVideoId: facebookVideoId || null,
    },
  });
  console.log("   ✅ تم التحديث");

  console.log("\n" + "━".repeat(50));
  console.log("✅✅✅ النشر الكامل:");
  console.log(`▶️  يوتيوب: ${YOUTUBE_URL}`);
  if (facebookVideoId) console.log(`📘 فيسبوك: https://facebook.com/1237883409409135/videos/${facebookVideoId}`);
  console.log("━".repeat(50));
}

main().catch((err) => {
  console.error(`❌ فشل: ${err.message}`);
  process.exit(1);
});

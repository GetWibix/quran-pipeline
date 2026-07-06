import { ContentType } from "@prisma/client";
import { generateContent } from "../services/contentPipeline";
import { generateSeoMetadata, SeoInput } from "../services/seoEngine";
import { publishToFacebook } from "../services/facebookPublisher";
import { RECITER_ARABIC_NAMES, RECITERS, RECITER_WEIGHTS } from "../services/audioFetcher";
import { rename } from "fs/promises";

const contentType = (process.argv[2]?.toUpperCase() === "LONG_VIDEO" ? "LONG_VIDEO" : "SHORT") as ContentType;

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  نشر على فيسبوك فقط                 ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`📐 النوع: ${contentType}`);
  console.log("");

  console.log("━".repeat(40));
  console.log("📦 [1/3] توليد الفيديو...");
  const reciterKeys = Object.keys(RECITERS) as (keyof typeof RECITERS)[];
  const weights = reciterKeys.map((k) => RECITER_WEIGHTS[k] ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let chosenReciter = reciterKeys[0];
  for (let i = 0; i < reciterKeys.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { chosenReciter = reciterKeys[i]; break; }
  }

  const generated = await generateContent(contentType, chosenReciter);
  const reciterArabic = RECITER_ARABIC_NAMES[generated.reciter] ?? generated.reciter;
  const surahName = generated.verses[0]?.surahNameArabic ?? "";
  console.log(`   ✅ الفيديو: ${generated.videoPath}`);
  console.log(`   ✅ المدة: ${generated.totalDurationSeconds.toFixed(1)}ث`);
  console.log(`   ✅ ${surahName} | آية ${generated.fromAyah}-${generated.toAyah}`);

  console.log("━".repeat(40));
  console.log("🎯 [2/3] تحضير البيانات...");
  const verseText = generated.verses.map((v) => v.textArabic).join(" ");
  const seoInput: SeoInput = {
    surahName,
    surahNumber: generated.surahNumber,
    fromAyah: generated.fromAyah,
    toAyah: generated.toAyah,
    reciter: generated.reciter,
    reciterArabic,
    contentType,
    verseText,
    aiHook: "",
    aiDescription: "",
    aiTags: [],
  };
  const seoOutput = await generateSeoMetadata(seoInput);
  console.log(`   ✅ العنوان: ${seoOutput.title}`);

  const safeName = seoOutput.title.replace(/[<>:"/\\|?*\s]/g, "_").replace(/_+/g, "_").slice(0, 80);
  const ext = generated.videoPath.split(".").pop() || "mp4";
  const newPath = generated.videoPath.replace(/[^/\\]+\.\w+$/, `${safeName}.${ext}`);
  if (newPath !== generated.videoPath) {
    await rename(generated.videoPath, newPath);
    generated.videoPath = newPath;
  }

  const ayahRange = generated.fromAyah === generated.toAyah
    ? `الآية ${generated.fromAyah}`
    : `الآيات ${generated.fromAyah}-${generated.toAyah}`;
  const description = `﴿${generated.verses.map(v => v.textArabic).join(" ") || ""}﴾\n\nسورة ${surahName} | ${ayahRange}\n${reciterArabic}\n\nتابعونا للمزيد من التلاوات القرآنية 🕊️`;

  console.log("━".repeat(40));
  console.log("🌐 [3/3] رفع على فيسبوك...");
  const result = await publishToFacebook({
    videoFilePath: generated.videoPath,
    title: seoOutput.title,
    description,
    tags: seoOutput.tags,
    isShort: contentType === ContentType.SHORT,
    surahName,
    fromAyah: generated.fromAyah,
    toAyah: generated.toAyah,
  });

  if (result.facebookVideoId) {
    console.log(`   ✅ فيسبوك: ${result.postUrl}`);
    console.log("");
    console.log("╔══════════════════════════════════════╗");
    console.log("║     ✅ تم النشر على فيسبوك          ║");
    console.log("╚══════════════════════════════════════╝");
    console.log(`🔗 ${result.postUrl}`);
  } else {
    console.log(`   ❌ فشل النشر على فيسبوك`);
  }
}

main().catch((err) => {
  console.error("❌ خطأ:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

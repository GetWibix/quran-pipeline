/**
 * previewVideo.ts
 * سكربت معاينة الفيديو قبل النشر الحقيقي.
 * يولّد فيديو لآيات محدّدة بدون ما يمس قاعدة البيانات أو يرفع ليوتيوب.
 *
 * Usage:
 *   npx ts-node src/scripts/previewVideo.ts --surah 1 --from 1 --to 3
 *   npx ts-node src/scripts/previewVideo.ts --surah 36 --from 1 --to 5 --reciter abdulbasit --type SHORT
 *   npx ts-node src/scripts/previewVideo.ts --surah 2 --from 255 --to 255 --output ~/Desktop/ayat.mp4
 */

import { getVerse } from "../services/verseFetcher";
import {
  downloadAyahAudio, buildSurahAudio, extractAyahAudio,
  RECITERS, Reciter, SurahAudioIndex,
} from "../services/audioFetcher";
import { composeScene } from "../services/visualComposer";
import { renderVideo, cleanupWorkDir } from "../services/videoRenderer";
import { ContentType } from "@prisma/client";

import { mkdtemp, mkdir } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { existsSync } from "fs";

// ─── Argument parser ───────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
  };

  const surah = parseInt(get("--surah", "1"), 10);
  const fromAyah = parseInt(get("--from", "1"), 10);
  const toAyah = parseInt(get("--to", "3"), 10);
  const reciterKey = get("--reciter", "alafasy") as keyof typeof RECITERS;
  const contentType = get("--type", "SHORT").toUpperCase();
  let outputPath = get("--output", "");

  if (surah < 1 || surah > 114) throw new Error("رقم السورة خارج النطاق (1-114)");
  if (fromAyah < 1) throw new Error("رقم الآية البداية غير صالح");
  if (toAyah < fromAyah) throw new Error("آية النهاية أصغر من آية البداية");
  if (!RECITERS[reciterKey]) throw new Error(`القارئ "${reciterKey}" غير موجود. الخيارات: ${Object.keys(RECITERS).join(", ")}`);
  if (!["SHORT", "LONG_VIDEO"].includes(contentType)) throw new Error("نوع المحتوى: SHORT أو LONG_VIDEO");

  return { surah, fromAyah, toAyah, reciterKey, contentType: contentType as ContentType, outputPath };
}

// ─── Background picker (same logic as contentPipeline) ─────────
const BACKGROUNDS_DIR = path.join(__dirname, "../../assets/backgrounds");
const STATIC_BACKGROUNDS = [
  "mosque-sunset.jpg",
  "geometric-pattern-blue.jpg",
  "clouds-soft.jpg",
  "desert-night.jpg",
];

function pickBackground(): string {
  const chosen = STATIC_BACKGROUNDS[Math.floor(Math.random() * STATIC_BACKGROUNDS.length)];
  return path.join(BACKGROUNDS_DIR, chosen);
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  const reciter: Reciter = RECITERS[opts.reciterKey];
  const isShort = opts.contentType === ContentType.SHORT;
  const aspectRatio = isShort ? "9:16" : "16:9";
  const backgroundsAvailable = STATIC_BACKGROUNDS.filter((f) => existsSync(path.join(BACKGROUNDS_DIR, f)));

  if (backgroundsAvailable.length === 0) {
    throw new Error(`لا توجد صور خلفية في ${BACKGROUNDS_DIR}`);
  }

  console.log("━".repeat(50));
  console.log("🎬 معاينة فيديو قبل النشر");
  console.log("━".repeat(50));
  console.log(`📖 سورة ${opts.surah} | الآيات ${opts.fromAyah}-${opts.toAyah}`);
  console.log(`🎙️ القارئ: ${opts.reciterKey}`);
  console.log(`📐 النوع: ${opts.contentType} (${aspectRatio})`);
  console.log("");

  const workDir = await mkdtemp(path.join(tmpdir(), "quran-preview-"));
  const scenesDir = path.join(workDir, "scenes");
  const audioDir = path.join(workDir, "audio");
  await mkdir(scenesDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });

  const MAX_SHORT_SEC = 59;
  let totalDuration = 0;
  const sceneInputs: { imagePath: string; audioPath: string; durationSeconds: number }[] = [];
  let versesFetched = 0;

  let fullSurahAudio: { filePath: string; index: SurahAudioIndex } | null = null;
  if (!isShort && opts.toAyah - opts.fromAyah >= 5) {
    const first = await getVerse(opts.surah, 1);
    fullSurahAudio = await buildSurahAudio(reciter, opts.surah, first.numberOfAyahsInSurah);
  }

  for (let ayah = opts.fromAyah; ayah <= opts.toAyah; ayah++) {
    if (isShort && totalDuration >= MAX_SHORT_SEC) {
      console.log(`⏱️ بلغت المدة القصوى للـ Short (${MAX_SHORT_SEC}ث) — توقفنا عند الآية ${ayah - 1}`);
      break;
    }

    console.log(`⏳ جلب الآية ${opts.surah}:${ayah}...`);
    const verse = await getVerse(opts.surah, ayah);
    versesFetched++;

    const audioOutPath = path.join(audioDir, `${opts.surah}-${ayah}.mp3`);
    console.log(`   ⏳ تحميل الصوت...`);
    const { filePath: audioPath, durationSeconds } = fullSurahAudio
      ? await extractAyahAudio(fullSurahAudio.filePath, fullSurahAudio.index, ayah, audioOutPath)
      : await downloadAyahAudio(reciter, opts.surah, ayah, audioOutPath);

    const bgPath = pickBackground();
    const imageOutPath = path.join(scenesDir, `${opts.surah}-${ayah}.png`);
    console.log(`   ⏳ رسم المشهد...`);
    await composeScene({
      textArabic: verse.textArabic,
      translation: verse.translationFr,
      surahLabel: `سورة ${verse.surahNameArabic} - الآية ${verse.ayahNumber}`,
      aspectRatio,
      backgroundImagePath: bgPath,
      outputPath: imageOutPath,
    });

    sceneInputs.push({ imagePath: imageOutPath, audioPath, durationSeconds });
    totalDuration += durationSeconds;

    console.log(`   ✅ المدة: ${durationSeconds.toFixed(1)}ث`);
    await new Promise((r) => setTimeout(r, 200));
  }

  if (sceneInputs.length === 0) {
    throw new Error("ما عندناش أي مشاهد لتوليد الفيديو");
  }

  const outputPath = opts.outputPath || path.join(
    __dirname,
    `../../assets/videos/PREVIEW-${opts.surah}-${opts.fromAyah}-${opts.toAyah}.mp4`
  );
  await mkdir(path.dirname(outputPath), { recursive: true });

  console.log("");
  console.log(`🎥 توليد الفيديو النهائي (${sceneInputs.length} مشهد، ${totalDuration.toFixed(1)}ث)...`);
  await renderVideo({
    scenes: sceneInputs,
    aspectRatio,
    outputPath,
    maxThreads: 2,
  });

  const videoSizeMB = (await import("fs/promises")).stat(outputPath).then((s) => (s.size / 1024 / 1024).toFixed(1));

  console.log("");
  console.log("━".repeat(50));
  console.log("✅ ✅ ✅ تم بنجاح! ✅ ✅ ✅");
  console.log("━".repeat(50));
  console.log(`📁 المسار: ${outputPath}`);
  console.log(`📏 الحجم: ${await videoSizeMB} MB`);
  console.log(`⏱️ المدة: ${totalDuration.toFixed(1)} ثانية`);
  console.log(`📐 الدقة: ${aspectRatio === "9:16" ? "1080×1920 (Shorts)" : "1920×1080 (فيديو طويل)"}`);
  console.log(`🔢 عدد الآيات: ${versesFetched}`);
  console.log("");
  console.log("▶️  شغل الفيديو محلياً وشوف الشكل قبل النشر.");
  console.log("💡 نصائح:");
  console.log("   - جرب قرّاء مختلفين: --reciter abdulbasit");
  console.log("   - جرب نوع طويل: --type LONG_VIDEO");
  console.log("   - حدّد مسار مخصص: --output ~/Desktop/test.mp4");
  console.log("");

  // تنظيف الملفات المؤقتة (الصور والصوت — الفيديو النهائي يبقى)
  await cleanupWorkDir(workDir);
}

main().catch((err) => {
  console.error("❌ فشل:", err.message);
  process.exit(1);
});

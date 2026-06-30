/**
 * contentPipeline.ts
 * نقطة الدخول الرئيسية: كيربط verseFetcher + audioFetcher + visualComposer + videoRenderer
 * فعملية واحدة متكاملة => فيديو MP4 جاهز للنشر
 */

import { mkdir, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { ContentType } from "@prisma/client";

import { selectNextRange } from "./verseSelector";
import { getVerse, getSurahMeta, VerseData } from "./verseFetcher";
import { downloadAyahAudio, Reciter, RECITERS } from "./audioFetcher";
import { composeScene } from "./visualComposer";
import { renderVideo, cleanupWorkDir, SceneInput } from "./videoRenderer";

export interface GeneratedContent {
  videoPath: string;
  workDir: string;
  contentType: ContentType;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciter: Reciter;
  verses: VerseData[];
  totalDurationSeconds: number;
  sceneDurations: number[]; // مدة كل مشهد/آية بالثواني — للـ Chapters
}

const BACKGROUNDS_DIR = path.join(__dirname, "../../assets/backgrounds");
const VIDEOS_DIR = path.join(__dirname, "../../assets/videos");

const STATIC_BACKGROUNDS = [
  "mosque-sunset.jpg",
  "geometric-pattern-blue.jpg",
  "clouds-soft.jpg",
  "desert-night.jpg",
];

const VIDEO_BACKGROUNDS = [
  "background-loop-1.mp4",
  "background-loop-2.mp4",
  "background-loop-3.mp4",
  "background-loop-4.mp4",
];

function pickBackground(): string {
  const chosen = STATIC_BACKGROUNDS[Math.floor(Math.random() * STATIC_BACKGROUNDS.length)];
  return path.join(BACKGROUNDS_DIR, chosen);
}

function getAvailableVideoBackgrounds(): string[] {
  return VIDEO_BACKGROUNDS.filter((f) => {
    try { require("fs").statSync(path.join(BACKGROUNDS_DIR, f)); return true; }
    catch { return false; }
  }).map((f) => path.join(BACKGROUNDS_DIR, f));
}

/**
 * الدالة الرئيسية: كتولّد فيديو كامل (Short أو طويل) بدءاً من "الآية التالية"
 * حسب التقدم المخزن فقاعدة البيانات
 */
export async function generateContent(
  contentType: ContentType,
  reciterKey: keyof typeof RECITERS = "alafasy"
): Promise<GeneratedContent> {
  const reciter = RECITERS[reciterKey];

  // 1. تحديد المقطع التالي (verseSelector كيحدّث قاعدة البيانات تلقائياً)
  const range = await selectNextRange(contentType);

  // 2. مجلد عمل مؤقت لهاد التوليد
  const workDir = await mkdtemp(path.join(tmpdir(), "quran-gen-"));
  const scenesDir = path.join(workDir, "scenes");
  const audioDir = path.join(workDir, "audio");
  await mkdir(scenesDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });

  const verses: VerseData[] = [];
  const sceneInputs: SceneInput[] = [];
  const aspectRatio = contentType === ContentType.SHORT ? "9:16" : "16:9";
  const backgroundPath = pickBackground();
  const availableVideoBackgrounds = getAvailableVideoBackgrounds();
  const sceneBackgrounds: string[] = []; // خلفية فيديو مختلفة لكل مشهد

  let totalDuration = 0;
  const MAX_SHORT_SEC = 60;

  // 3. لكل آية: جلب + صوت + رسم — الآيات تضاف كاملة، لا نقطعها
  // أول آية تضاف دائماً كاملة (حتى لو طالت عن 60 ثانية)
  // الآيات التالية تضاف فقط إذا كانت المجموع لا يتجاوز 60 ثانية
  for (let ayah = range.fromAyah; ayah <= range.toAyah; ayah++) {
    if (totalDuration >= MAX_SHORT_SEC) break;

    const verse = await getVerse(range.surahNumber, ayah);
    const audioOutPath = path.join(audioDir, `${range.surahNumber}-${ayah}.mp3`);
    const { filePath: audioPath, durationSeconds } = await downloadAyahAudio(
      reciter, range.surahNumber, ayah, audioOutPath
    );

    // أول آية: نضيفها كاملة دائماً
    // ما عدا الأولى: نضيف فقط إذا ما كانتش هتتجاوز الحد
    if (verses.length > 0 && totalDuration + durationSeconds > MAX_SHORT_SEC) break;

    verses.push(verse);
    const imageOutPath = path.join(scenesDir, `${range.surahNumber}-${ayah}.png`);

    // نختار خلفية فيديو عشوائية لهاذ المشهد
    const useTransparent = availableVideoBackgrounds.length > 0;
    if (useTransparent) {
      const chosen = availableVideoBackgrounds[Math.floor(Math.random() * availableVideoBackgrounds.length)];
      sceneBackgrounds.push(chosen);
    }

    await composeScene({
      textArabic: verse.textArabic, translation: verse.translationFr,
      surahLabel: `سورة ${verse.surahNameArabic} - الآية ${verse.ayahNumber}`,
      aspectRatio, backgroundImagePath: backgroundPath, outputPath: imageOutPath,
      transparent: useTransparent,
    });

    sceneInputs.push({ imagePath: imageOutPath, audioPath, durationSeconds });
    totalDuration += durationSeconds;

    if (totalDuration >= MAX_SHORT_SEC) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  // نعدل التقدم في قاعدة البيانات ليعكس العدد الفعلي للآيات المستخدمة
  const actualLastAyah = range.fromAyah + verses.length - 1;
  if (actualLastAyah !== range.toAyah) {
    const { PrismaClient } = await import("@prisma/client");
    const p = new PrismaClient();
    const meta = await getSurahMeta(range.surahNumber);
    let ns = range.surahNumber, na = actualLastAyah + 1;
    if (na > meta.numberOfAyahs) { ns = range.surahNumber >= 114 ? 1 : range.surahNumber + 1; na = 1; }
    await p.readingProgress.update({ where: { contentType }, data: { currentSurah: ns, currentAyah: na } });
    await p.$disconnect();
  }

  // 4. الرندر النهائي
  await mkdir(VIDEOS_DIR, { recursive: true });
  const finalVideoPath = path.join(
    VIDEOS_DIR,
    `${contentType}-${range.surahNumber}-${range.fromAyah}-${actualLastAyah}.mp4`
  );
  await renderVideo({
    scenes: sceneInputs,
    aspectRatio,
    outputPath: finalVideoPath,
    maxThreads: 2,
    videoBackgroundPaths: sceneBackgrounds.length > 0 ? sceneBackgrounds : undefined,
  });

  return {
    videoPath: finalVideoPath,
    workDir,
    contentType,
    surahNumber: range.surahNumber,
    fromAyah: range.fromAyah,
    toAyah: actualLastAyah,
    reciter,
    verses,
    totalDurationSeconds: totalDuration,
    sceneDurations: sceneInputs.map((s) => s.durationSeconds),
  };
}

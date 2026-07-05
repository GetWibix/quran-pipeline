import { mkdir, mkdtemp } from "fs/promises";
import { statSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { ContentType } from "@prisma/client";

import { selectNextRange } from "./verseSelector";
import { getVerse, getSurahMeta, VerseData } from "./verseFetcher";
import { downloadAyahAudio, Reciter, RECITERS } from "./audioFetcher";
import { composeScene } from "./visualComposer";
import { renderVideo, cleanupWorkDir, SceneInput } from "./videoRenderer";
import prisma from "../lib/prisma";

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
    try { statSync(path.join(BACKGROUNDS_DIR, f)); return true; }
    catch { return false; }
  }).map((f) => path.join(BACKGROUNDS_DIR, f));
}

export async function generateContent(
  contentType: ContentType,
  reciterKey: keyof typeof RECITERS = "alafasy",
  forceSurahNumber?: number
): Promise<GeneratedContent> {
  const reciter = RECITERS[reciterKey];

  const range = await selectNextRange(contentType, forceSurahNumber);

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
  const sceneBackgrounds: string[] = [];

  let totalDuration = 0;
  const MAX_DURATION_SEC = contentType === ContentType.LONG_VIDEO ? 600 : 60;

  const ayahNumbers: number[] = [];
  for (let ayah = range.fromAyah; ayah <= range.toAyah; ayah++) {
    ayahNumbers.push(ayah);
  }

  const verseResults = await Promise.all(
    ayahNumbers.map((ayah) => getVerse(range.surahNumber, ayah))
  );

  const audioResults = await Promise.all(
    ayahNumbers.map(async (ayah) => {
      const audioOutPath = path.join(audioDir, `${range.surahNumber}-${ayah}.mp3`);
      const result = await downloadAyahAudio(reciter, range.surahNumber, ayah, audioOutPath);
      return { ayah, ...result };
    })
  );

  const ayahAudioMap = new Map(audioResults.map((r) => [r.ayah, r]));

  for (let i = 0; i < ayahNumbers.length; i++) {
    const ayah = ayahNumbers[i];
    const verse = verseResults[i];
    const audioResult = ayahAudioMap.get(ayah)!;
    const { filePath: audioPath, durationSeconds } = audioResult;

    if (verses.length > 0 && totalDuration + durationSeconds > MAX_DURATION_SEC) break;

    verses.push(verse);
    const imageOutPath = path.join(scenesDir, `${range.surahNumber}-${ayah}.png`);

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

    if (totalDuration >= MAX_DURATION_SEC) break;
  }

  const actualLastAyah = range.fromAyah + verses.length - 1;
  if (actualLastAyah !== range.toAyah) {
    const meta = await getSurahMeta(range.surahNumber);
    let ns = range.surahNumber, na = actualLastAyah + 1;
    if (na > meta.numberOfAyahs) { ns = range.surahNumber >= 114 ? 1 : range.surahNumber + 1; na = 1; }
    await prisma.readingProgress.update({ where: { contentType }, data: { currentSurah: ns, currentAyah: na } });
  }

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
  sceneDurations: number[];
}

import { mkdir, mkdtemp, readdir } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { ContentType } from "@prisma/client";

import { selectNextRange } from "./verseSelector";
import { getVerse, getSurahMeta, VerseData } from "./verseFetcher";
import { getCachedAyahAudio, ensureSurahAudioCache, Reciter, RECITERS } from "./audioFetcher";
import { composeScene } from "./visualComposer";
import { renderVideo, cleanupWorkDir, SceneInput } from "./videoRenderer";
import prisma from "../lib/prisma";

const execFileAsync = promisify(execFile);

const BACKGROUNDS_DIR = path.join(__dirname, "../../assets/backgrounds");
const LANDSCAPE_BG_DIR = path.join(BACKGROUNDS_DIR, "landscape");
const PORTRAIT_BG_DIR = path.join(BACKGROUNDS_DIR, "portrait");
const VIDEOS_DIR = path.join(__dirname, "../../assets/videos");

async function listDir(dir: string, ext: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith(ext))
      .sort(() => Math.random() - 0.5)
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

async function pickImageBackground(): Promise<string> {
  const images = await listDir(BACKGROUNDS_DIR, ".jpg");
  if (images.length > 0) return images[Math.floor(Math.random() * images.length)];

  const fallbacks = ["mosque-sunset.jpg", "geometric-pattern-blue.jpg", "clouds-soft.jpg", "desert-night.jpg"];
  const chosen = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return path.join(BACKGROUNDS_DIR, chosen);
}

async function getLandscapeVideoBackgrounds(): Promise<string[]> {
  return listDir(LANDSCAPE_BG_DIR, ".mp4");
}

async function getPortraitVideoBackgrounds(): Promise<string[]> {
  return listDir(PORTRAIT_BG_DIR, ".mp4");
}

export async function generateContent(
  contentType: ContentType,
  reciterKey: keyof typeof RECITERS = "alafasy",
  forceSurahNumber?: number
): Promise<GeneratedContent> {
  const reciter = RECITERS[reciterKey];

  const range = await selectNextRange(contentType, forceSurahNumber);

  if (contentType === ContentType.LONG_VIDEO) {
    const first = await getVerse(range.surahNumber, 1);
    await ensureSurahAudioCache(reciter, range.surahNumber, first.numberOfAyahsInSurah);
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "quran-gen-"));
  const scenesDir = path.join(workDir, "scenes");
  const audioDir = path.join(workDir, "audio");
  await mkdir(scenesDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });

  const verses: VerseData[] = [];
  const sceneInputs: SceneInput[] = [];
  const aspectRatio = contentType === ContentType.SHORT ? "9:16" : "16:9";
  const backgroundPath = await pickImageBackground();
  const availableVideoBackgrounds = contentType === ContentType.SHORT
    ? await getPortraitVideoBackgrounds()
    : await getLandscapeVideoBackgrounds();
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
      const result = await getCachedAyahAudio(reciter, range.surahNumber, ayah, audioOutPath);
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

  let shortVideoPath: string | undefined;
  if (contentType === ContentType.LONG_VIDEO) {
    shortVideoPath = path.join(
      VIDEOS_DIR,
      `SHORT-${range.surahNumber}-${range.fromAyah}-${actualLastAyah}.mp4`
    );
    const cropDuration = Math.min(totalDuration, 60);
    await execFileAsync("ffmpeg", [
      "-y", "-i", finalVideoPath,
      "-t", String(cropDuration),
      "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
      "-c:a", "aac", "-b:a", "128k",
      shortVideoPath,
    ]);
  }

  return {
    videoPath: finalVideoPath,
    shortVideoPath,
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
  shortVideoPath?: string;
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

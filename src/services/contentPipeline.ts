import { mkdir, mkdtemp, readdir } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { ContentType } from "@prisma/client";

import { selectNextRange } from "./verseSelector";
import { getVerse, getSurahMeta, VerseData } from "./verseFetcher";
import {
  downloadAyahAudio, buildSurahAudio, extractAyahAudio,
  SurahAudioIndex, Reciter, RECITERS, RECITER_ARABIC_NAMES,
} from "./audioFetcher";
import { composeScene } from "./visualComposer";
import { renderVideo, RenderOptions, cleanupWorkDir, SceneInput } from "./videoRenderer";
import prisma from "../lib/prisma";

const execFileAsync = promisify(execFile);

const BACKGROUNDS_DIR = path.join(__dirname, "../../assets/backgrounds");
const LANDSCAPE_BG_DIR = path.join(BACKGROUNDS_DIR, "landscape");
const PORTRAIT_BG_DIR = path.join(BACKGROUNDS_DIR, "portrait");
const VIDEOS_DIR = path.join(__dirname, "../../assets/videos");
const AUDIO_DIR = path.join(__dirname, "../../assets/audio");

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

  let fullSurahAudio: { filePath: string; index: SurahAudioIndex } | null = null;
  if (contentType === ContentType.LONG_VIDEO) {
    const first = await getVerse(range.surahNumber, 1);

    // تحقق من وجود ملف سورة كامل محمّل مسبقاً في assets/audio/
    const sufFile = `surah-${String(range.surahNumber).padStart(3, "0")}-`;
    const existing = await readdir(AUDIO_DIR)
      .then((files) => files.find((f) => f.startsWith(sufFile) && f.endsWith(".mp3")))
      .catch(() => undefined);

    if (existing) {
      const customReciter = existing.replace(/\.mp3$/, "").replace(sufFile, "");
      const reciterArabic = RECITER_ARABIC_NAMES[customReciter] ?? customReciter;
      console.log(`🎧 استخدام ملف سورة محمّل: ${existing} (${reciterArabic})`);
      fullSurahAudio = await buildSurahAudio(customReciter, range.surahNumber, first.numberOfAyahsInSurah);
    } else {
      fullSurahAudio = await buildSurahAudio(reciter, range.surahNumber, first.numberOfAyahsInSurah);
    }
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

      if (fullSurahAudio) {
        return {
          ayah,
          ...(await extractAyahAudio(
            fullSurahAudio.filePath, fullSurahAudio.index, ayah, audioOutPath
          )),
        };
      }

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

  const actualLastAyah = verses[verses.length - 1]?.ayahNumber ?? range.fromAyah;

  const videoFilename = `${contentType}-${Date.now()}.mp4`;
  const finalVideoPath = path.join(VIDEOS_DIR, videoFilename);

  const renderOpts: RenderOptions = {
    scenes: sceneInputs,
    aspectRatio,
    outputPath: finalVideoPath,
  };
  if (sceneBackgrounds.length > 0) {
    renderOpts.videoBackgroundPaths = sceneBackgrounds;
  }
  await renderVideo(renderOpts);

  let shortVideoPath: string | undefined;
  if (contentType === ContentType.LONG_VIDEO) {
    const shortName = `SHORT-${path.basename(finalVideoPath)}`;
    const shortOut = path.join(VIDEOS_DIR, shortName);
    await execFileAsync("ffmpeg", [
      "-i", finalVideoPath,
      "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
      "-t", "60",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-x264opts", "rc-lookahead=5:bframes=1:ref=1",
      "-c:a", "copy",
      "-y", shortOut,
    ]);
    shortVideoPath = shortOut;
  }

  if (actualLastAyah !== range.toAyah) {
    const meta = await getSurahMeta(range.surahNumber);
    let ns = range.surahNumber, na = actualLastAyah + 1;
    if (na > meta.numberOfAyahs) {
      ns = range.surahNumber >= 114 ? 1 : range.surahNumber + 1;
      na = 1;
    }
    await prisma.readingProgress.update({
      where: { contentType },
      data: { currentSurah: ns, currentAyah: na },
    });
  }

  return {
    videoPath: finalVideoPath, shortVideoPath, workDir, contentType,
    surahNumber: range.surahNumber, fromAyah: range.fromAyah, toAyah: actualLastAyah,
    reciter, verses, totalDurationSeconds: totalDuration,
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

import { writeFile, unlink } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { mkdir } from "fs/promises";

const execFileAsync = promisify(execFile);

export type Reciter =
  | "Alafasy_128kbps"
  | "Abdul_Basit_Murattal_192kbps"
  | "Ghamadi_40kbps"
  | "Maher_AlMuaiqly_64kbps";

export const RECITERS: Record<string, Reciter> = {
  alafasy: "Alafasy_128kbps",
  abdulbasit: "Abdul_Basit_Murattal_192kbps",
  ghamadi: "Ghamadi_40kbps",
  maher: "Maher_AlMuaiqly_64kbps",
};

export const RECITER_WEIGHTS: Record<string, number> = {
  abdulbasit: 4,
  alafasy: 3,
  maher: 2,
  ghamadi: 1,
};

export const RECITER_ARABIC_NAMES: Record<string, string> = {
  "Alafasy_128kbps": "مشاري العفاسي",
  "Abdul_Basit_Murattal_192kbps": "عبدالباسط عبدالصمد",
  "Ghamadi_40kbps": "سعد الغامدي",
  "Maher_AlMuaiqly_64kbps": "ماهر المعيقلي",
  "IslamSobhi": "إسلام صبحي",
};

const EVERYAYAH_BASE = "https://everyayah.com/data";

const AUDIO_DIR = path.join(__dirname, "../../assets/audio");
const TMP_CONCAT_DIR = path.join(AUDIO_DIR, ".tmp-concat");

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

export function buildAudioUrl(
  reciter: string,
  surahNumber: number,
  ayahNumber: number
): string {
  return `${EVERYAYAH_BASE}/${reciter}/${pad3(surahNumber)}${pad3(
    ayahNumber
  )}.mp3`;
}

function surahFileName(reciter: string, surahNumber: number): string {
  const safe = reciter.replace(/[^a-zA-Z0-9_-]/g, "");
  return `surah-${String(surahNumber).padStart(3, "0")}-${safe}.mp3`;
}

function indexFileName(reciter: string, surahNumber: number): string {
  const safe = reciter.replace(/[^a-zA-Z0-9_-]/g, "");
  return `surah-${String(surahNumber).padStart(3, "0")}-${safe}.json`;
}

export interface AyahTimestamp {
  ayah: number;
  startSec: number;
  endSec: number;
}

export interface SurahAudioIndex {
  surahNumber: number;
  reciter: string;
  totalVerses: number;
  totalDurationSec: number;
  ayahs: AyahTimestamp[];
}

/**
 * كيحمّل ملف صوت آية واحدة من EveryAyah وكيحفظه محلياً
 */
export async function downloadAyahAudio(
  reciter: Reciter,
  surahNumber: number,
  ayahNumber: number,
  outputPath: string
): Promise<{ filePath: string; durationSeconds: number }> {
  const url = buildAudioUrl(reciter, surahNumber, ayahNumber);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `فشل تحميل الصوت من ${url} — HTTP ${res.status}. تحقق من القارئ أو رقم الآية.`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) {
    throw new Error(
      `الملف المحمّل صغير جداً (${buffer.length} bytes) — راجع الرابط: ${url}`
    );
  }

  await writeFile(outputPath, buffer);

  const durationSeconds = await getAudioDuration(outputPath);

  return { filePath: outputPath, durationSeconds };
}

/**
 * كيبني ملف الصوت الكامل للسورة من آيات فردية + index timestamps
 * أول مرة ينزّل الآيات ويجمعهم بملف واحد، بعدها يرجع الموجود
 * إذا كان في ملف جاهز assets/audio/ (مثل إسلام صبحي)، يبني index بنسبة أطوال النص
 */
export async function buildSurahAudio(
  reciter: string,
  surahNumber: number,
  totalVerses: number
): Promise<{ filePath: string; index: SurahAudioIndex }> {
  await mkdir(AUDIO_DIR, { recursive: true });

  const { readFile, access } = await import("fs/promises");

  const fullPath = path.join(AUDIO_DIR, surahFileName(reciter, surahNumber));
  const indexPath = path.join(AUDIO_DIR, indexFileName(reciter, surahNumber));

  // 1. الملف + index موجودين → استعملهم
  try {
    await access(fullPath);
    await access(indexPath);
    const index: SurahAudioIndex = JSON.parse(await readFile(indexPath, "utf-8"));
    return { filePath: fullPath, index };
  } catch {
    // مش موجود — نولّد
  }

  // 2. ملف جاهز موجود بدون index → نبني index من أطوال النص
  try {
    await access(fullPath);
    const { getVerse } = await import("./verseFetcher");
    console.log(`📊 بناء index لـ ${reciter} — سورة ${surahNumber} (${totalVerses} آية)...`);

    const verses = await Promise.all(
      Array.from({ length: totalVerses }, (_, i) => getVerse(surahNumber, i + 1))
    );
    const charCounts = verses.map((v) => v.textArabic.length);
    const totalChars = charCounts.reduce((a, b) => a + b, 0);
    const totalDuration = await getAudioDuration(fullPath);

    const ayahs: AyahTimestamp[] = [];
    let cursor = 0;
    for (let i = 0; i < totalVerses; i++) {
      const dur = (charCounts[i] / totalChars) * totalDuration;
      ayahs.push({ ayah: i + 1, startSec: cursor, endSec: cursor + dur });
      cursor += dur;
    }

    const index: SurahAudioIndex = {
      surahNumber, reciter, totalVerses, totalDurationSec: totalDuration, ayahs,
    };
    await writeFile(indexPath, JSON.stringify(index, null, 2));
    console.log(`   ✅ index بنجاح (${totalDuration.toFixed(1)}ث، ${totalVerses} آية)`);
    return { filePath: fullPath, index };
  } catch {
    // مش موجود جاهز — ننزّل من EveryAyah
  }

  // 3. تنزيل من EveryAyah
  console.log(`🎧 تحميل سورة ${surahNumber} (${totalVerses} آية) — ${reciter}...`);
  const tmpDir = path.join(TMP_CONCAT_DIR, `${surahNumber}-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  const concatFile = path.join(tmpDir, "files.txt");
  const durations: number[] = [];

  for (let ayah = 1; ayah <= totalVerses; ayah++) {
    const ayahTmp = path.join(tmpDir, `${pad3(surahNumber)}${pad3(ayah)}.mp3`);
    const url = buildAudioUrl(reciter, surahNumber, ayah);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`فشل تحميل آية ${surahNumber}:${ayah} — HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) throw new Error(`ملف صغير جداً للآية ${surahNumber}:${ayah}`);
    await writeFile(ayahTmp, buffer);

    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", ayahTmp,
    ]);
    durations.push(parseFloat(stdout.trim()));

    const entry = `file '${ayahTmp}'\n`;
    await writeFile(concatFile, entry, { flag: "a" });
  }

  const ayahs: AyahTimestamp[] = [];
  let cursor = 0;
  for (let i = 0; i < totalVerses; i++) {
    ayahs.push({ ayah: i + 1, startSec: cursor, endSec: cursor + durations[i] });
    cursor += durations[i];
  }

  await execFileAsync("ffmpeg", [
    "-f", "concat", "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    fullPath,
  ]);

  const index: SurahAudioIndex = {
    surahNumber, reciter, totalVerses, totalDurationSec: cursor, ayahs,
  };
  await writeFile(indexPath, JSON.stringify(index, null, 2));

  await execFileAsync("rm", ["-rf", tmpDir]);

  console.log(`   ✅ ملف السورة: ${fullPath} (${(cursor / 60).toFixed(1)} دقيقة)`);
  return { filePath: fullPath, index };
}

/**
 * كيستخرج آية من ملف السورة الكامل إلى مسار مؤقت للـ render
 */
export async function extractAyahAudio(
  surahFilePath: string,
  index: SurahAudioIndex,
  ayahNumber: number,
  outputPath: string
): Promise<{ filePath: string; durationSeconds: number }> {
  const info = index.ayahs.find((a) => a.ayah === ayahNumber);
  if (!info) throw new Error(`الآية ${ayahNumber} مو مسجلة في index السورة`);

  await execFileAsync("ffmpeg", [
    "-ss", String(info.startSec),
    "-i", surahFilePath,
    "-t", String(info.endSec - info.startSec),
    "-c", "copy",
    "-y", outputPath,
  ]);

  return { filePath: outputPath, durationSeconds: info.endSec - info.startSec };
}

export async function getAudioDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return parseFloat(stdout.trim());
}

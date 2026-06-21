/**
 * audioFetcher.ts
 * كيحمّل ملف صوت الآية من EveryAyah.com (تسجيلات قراء معتمدين، آية بآية)
 *
 * بنية الرابط: https://everyayah.com/data/{Reciter_Folder}/{SSSAAA}.mp3
 * SSS = رقم السورة (3 أرقام، padded) | AAA = رقم الآية (3 أرقام، padded)
 *
 * قائمة القراء المتوفرين (أسماء المجلدات الرسمية فالسيرفر):
 * - Alafasy_128kbps          => مشاري العفاسي
 * - Abdul_Basit_Murattal_192kbps => عبدالباسط عبدالصمد (مرتل)
 * - Ghamadi_40kbps           => سعد الغامدي
 * - Maher_AlMuaiqly_64kbps   => ماهر المعيقلي
 */

import { writeFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

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

// أوزان الاختيار العشوائي (تفضيل الجودة العالية)
export const RECITER_WEIGHTS: Record<string, number> = {
  abdulbasit: 4, // 192kbps — أفضل جودة
  alafasy: 3,    // 128kbps — جودة جيدة
  maher: 2,      // 64kbps  — متوسط
  ghamadi: 1,     // 40kbps  — أقل جودة
};

export const RECITER_ARABIC_NAMES: Record<Reciter, string> = {
  "Alafasy_128kbps": "مشاري العفاسي",
  "Abdul_Basit_Murattal_192kbps": "عبدالباسط عبدالصمد",
  "Ghamadi_40kbps": "سعد الغامدي",
  "Maher_AlMuaiqly_64kbps": "ماهر المعيقلي",
};

const EVERYAYAH_BASE = "https://everyayah.com/data";

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

/**
 * كيبني الرابط المباشر لملف صوت آية معينة
 */
export function buildAudioUrl(
  reciter: Reciter,
  surahNumber: number,
  ayahNumber: number
): string {
  return `${EVERYAYAH_BASE}/${reciter}/${pad3(surahNumber)}${pad3(
    ayahNumber
  )}.mp3`;
}

/**
 * كيحمّل ملف صوت آية واحدة وكيحفظه محلياً
 * كيرجع المسار المحلي + مدة الملف بالثواني (عبر ffprobe)
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
    // ملف صغير جداً = احتمال خطأ (404 page بشكل mp3 وهمي)
    throw new Error(
      `الملف المحمّل صغير جداً (${buffer.length} bytes) — راجع الرابط: ${url}`
    );
  }

  await writeFile(outputPath, buffer);

  const durationSeconds = await getAudioDuration(outputPath);

  return { filePath: outputPath, durationSeconds };
}

/**
 * كيحمّل عدة آيات متتالية ويدمجهم لاحقاً (مفيد لفيديو سورة كاملة)
 * كيرجع لائحة بالملفات + المدة الإجمالية
 */
export async function downloadAyahRangeAudio(
  reciter: Reciter,
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  outputDir: string
): Promise<{ files: string[]; totalDuration: number }> {
  const files: string[] = [];
  let totalDuration = 0;

  for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
    const outPath = `${outputDir}/${pad3(surahNumber)}${pad3(ayah)}.mp3`;
    const { filePath, durationSeconds } = await downloadAyahAudio(
      reciter,
      surahNumber,
      ayah,
      outPath
    );
    files.push(filePath);
    totalDuration += durationSeconds;
    // تأخير بسيط لتجنب الضغط على السيرفر
    await new Promise((r) => setTimeout(r, 200));
  }

  return { files, totalDuration };
}

/**
 * كيحسب مدة ملف صوتي بالثواني عبر ffprobe (لازم يكون مثبت على السيرفر)
 */
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

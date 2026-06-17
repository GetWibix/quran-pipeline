/**
 * visualComposer.ts
 * كيرسم "مشهد" ثابت (صورة PNG) لكل آية: خلفية + نص عربي بالتشكيل + الترجمة
 *
 * مهم: node-canvas (Cairo backend) كيدعم RTL بشكل طبيعي عبر `ctx.direction = "rtl"`
 * بدون الحاجة لـ arabic-reshaper/bidi-js يدوياً (بخلاف PDFKit اللي كان خاصو هاد المعالجة اليدوية
 * فمشروع ZIZ ANAMMAS). Cairo كيدير shaping صحيح للحروف العربية المتصلة تلقائياً.
 *
 * استراتيجية الأداء (VPS صغير 1-2GB RAM):
 * - نرسمو صورة واحدة فقط لكل آية (ماشي فريم لكل ثانية) — الحركة كتجي من FFmpeg بعدين
 * - نستخدمو canvas واحد يتم إعادة استخدامه (ماشي إنشاء instance جديد لكل صورة)
 */

import { createCanvas, registerFont, Canvas, CanvasRenderingContext2D } from "canvas";
import { writeFile } from "fs/promises";
import path from "path";

export type AspectRatio = "9:16" | "16:9";

interface ComposeSceneOptions {
  textArabic: string;
  translation?: string;
  surahLabel: string; // مثلاً "سورة البقرة - الآية 5"
  aspectRatio: AspectRatio;
  backgroundImagePath: string; // مسار صورة خلفية ثابتة (من مكتبة templates)
  outputPath: string;
}

const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 }, // Shorts
  "16:9": { width: 1920, height: 1080 }, // فيديو طويل
};

let fontsRegistered = false;

/**
 * كيسجل الخطوط العربية مرة واحدة فقط (lazy init) — خاصك تحمّل ملفات .ttf هاد الخطوط
 * ووضعهم فمجلد assets/fonts/ قبل تشغيل الكود
 *
 * Amiri: خط قرآني تقليدي واضح وجميل (مجاني، Google Fonts)
 * NotoNaskhArabic: بديل احتياطي، دعم واسع للتشكيل
 */
function ensureFontsRegistered(fontsDir: string) {
  if (fontsRegistered) return;

  registerFont(path.join(fontsDir, "Amiri-Regular.ttf"), {
    family: "Amiri",
  });
  registerFont(path.join(fontsDir, "Amiri-Bold.ttf"), {
    family: "Amiri",
    weight: "bold",
  });
  registerFont(path.join(fontsDir, "NotoNaskhArabic-Regular.ttf"), {
    family: "NotoNaskhArabic",
  });

  fontsRegistered = true;
}

/**
 * كيرسم نص متعدد الأسطر، ويرجع عدد الأسطر المرسومة (مفيد لحساب الموضع العمودي)
 * كيدير "word wrap" تلقائي حسب عرض الكانفاس المتاح
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  let lineCount = 0;
  const lines: string[] = [];

  // نبني الأسطر أولاً (RTL: الكلمات كتقرا من اليمين لليسار، لكن الـ wrap logic نفسه)
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  for (const l of lines) {
    ctx.fillText(l, centerX, y);
    y += lineHeight;
    lineCount++;
  }

  return lineCount;
}

/**
 * كيولّد صورة مشهد واحدة: خلفية + آية بالعربية + ترجمة + تسمية السورة
 * هاد الصورة غادي تستخدم بعدين فـ FFmpeg كـ "static scene" بمدة محددة
 */
export async function composeScene(opts: ComposeSceneOptions): Promise<string> {
  const { width, height } = DIMENSIONS[opts.aspectRatio];
  const fontsDir = path.join(__dirname, "../../assets/fonts");
  ensureFontsRegistered(fontsDir);

  const canvas: Canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // --- 1. الخلفية ---
  const { loadImage } = await import("canvas");
  const bg = await loadImage(opts.backgroundImagePath);
  ctx.drawImage(bg, 0, 0, width, height);

  // طبقة تعتيم خفيفة فوق الخلفية لتحسين وضوح النص (تباين أفضل)
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, width, height);

  // --- 2. النص العربي (الآية) ---
  (ctx as unknown as { direction: string }).direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFD700"; // ذهبي، تباين جيد مع خلفيات داكنة
  ctx.font = `bold ${Math.round(width * 0.052)}px Amiri`;

  // ظل خفيف للنص لتحسين القراءة فوق خلفيات متغيرة
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  const verseAreaMaxWidth = width * 0.85;
  const verseStartY = height * 0.38;
  const verseLineHeight = width * 0.075;

  drawWrappedText(
    ctx,
    opts.textArabic,
    width / 2,
    verseStartY,
    verseAreaMaxWidth,
    verseLineHeight
  );

  // --- 3. الترجمة (إن وجدت) ---
  if (opts.translation) {
    (ctx as unknown as { direction: string }).direction = "ltr";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#E8E8E8";
    ctx.font = `${Math.round(width * 0.028)}px NotoNaskhArabic`;
    drawWrappedText(
      ctx,
      opts.translation,
      width / 2,
      height * 0.68,
      verseAreaMaxWidth,
      width * 0.04
    );
  }

  // --- 4. تسمية السورة/الآية (أسفل الشاشة) ---
  (ctx as unknown as { direction: string }).direction = "rtl";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `${Math.round(width * 0.024)}px Amiri`;
  ctx.fillText(opts.surahLabel, width / 2, height * 0.92);

  // --- حفظ الصورة ---
  const buffer = canvas.toBuffer("image/png");
  await writeFile(opts.outputPath, buffer);

  return opts.outputPath;
}

/**
 * كيولّد عدة مشاهد (آية لكل مشهد) لفيديو يحتوي على عدة آيات
 * كيرجع لائحة مرتبة بمسارات الصور
 */
export async function composeMultipleScenes(
  scenes: Omit<ComposeSceneOptions, "outputPath">[],
  outputDir: string
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const outputPath = path.join(outputDir, `scene-${String(i).padStart(3, "0")}.png`);
    await composeScene({ ...scenes[i], outputPath });
    paths.push(outputPath);
  }
  return paths;
}

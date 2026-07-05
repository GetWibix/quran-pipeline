import { createCanvas, registerFont, loadImage, Canvas, CanvasRenderingContext2D } from "canvas";
import { writeFile } from "fs/promises";
import path from "path";

export type AspectRatio = "9:16" | "16:9";

interface ComposeSceneOptions {
  textArabic: string;
  translation?: string;
  surahLabel: string;
  aspectRatio: AspectRatio;
  backgroundImagePath: string;
  outputPath: string;
  transparent?: boolean;
}

const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

let fontsRegistered = false;
const imageCache = new Map<string, any>();

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

export async function composeScene(opts: ComposeSceneOptions): Promise<string> {
  const { width, height } = DIMENSIONS[opts.aspectRatio];
  const fontsDir = path.join(__dirname, "../../assets/fonts");
  ensureFontsRegistered(fontsDir);

  const canvas: Canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!opts.transparent) {
    let bg = imageCache.get(opts.backgroundImagePath);
    if (!bg) {
      bg = await loadImage(opts.backgroundImagePath);
      imageCache.set(opts.backgroundImagePath, bg);
    }
    ctx.drawImage(bg, 0, 0, width, height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, width, height);
  }

  (ctx as unknown as { direction: string }).direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFD700";
  ctx.font = `bold ${Math.round(width * 0.052)}px Amiri`;

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

  (ctx as unknown as { direction: string }).direction = "rtl";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `${Math.round(width * 0.024)}px Amiri`;
  ctx.fillText(opts.surahLabel, width / 2, height * 0.92);

  const buffer = canvas.toBuffer("image/png");
  await writeFile(opts.outputPath, buffer);

  return opts.outputPath;
}

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

import { createCanvas, registerFont, loadImage } from "canvas";
import path from "path";

const FONT_DIR = path.join(__dirname, "../../assets/fonts");
const BG_DIR = path.join(__dirname, "../../assets/poster-bg");

registerFont(path.join(FONT_DIR, "UthmanicHafs.ttf"), { family: "UthmanicHafs" });
registerFont(path.join(FONT_DIR, "Amiri-Bold.ttf"), { family: "AmiriBold" });
registerFont(path.join(FONT_DIR, "Amiri-Regular.ttf"), { family: "AmiriRegular" });

export interface PosterVerse {
  number: number;
  text: string;
}

export interface PosterOptions {
  surahName: string;
  verses: PosterVerse[];
  backgroundFile?: string;
}

interface FontPlan {
  size: number;
  lineH: number;
  wrapAt: number;
}

const FONT_PLANS: FontPlan[] = [
  { size: 48, lineH: 74, wrapAt: 38 },
  { size: 44, lineH: 68, wrapAt: 42 },
  { size: 40, lineH: 62, wrapAt: 46 },
  { size: 36, lineH: 56, wrapAt: 52 },
  { size: 32, lineH: 50, wrapAt: 58 },
  { size: 28, lineH: 44, wrapAt: 64 },
  { size: 24, lineH: 38, wrapAt: 72 },
];

const HEADER_Y = 248;
const DECO_Y = 272;
const TEXT_TOP = 295;
const TEXT_BOT = 1075;
const NOR_Y = 1130;
const TEXT_CENTER_X = 827;
const VNUM_FONT = 12;
const HEADER_FONT = 22;

function wrapText(text: string, wrapAt: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += wrapAt) {
    lines.push(text.slice(i, i + wrapAt));
  }
  return lines;
}

export async function generatePoster(options: PosterOptions): Promise<Buffer> {
  const bgFile = options.backgroundFile ?? "background.png";
  const bgImg = await loadImage(path.join(BG_DIR, bgFile));

  const W = bgImg.width;
  const H = bgImg.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, W, H);

  // ─── Header (surah name, gold) ──────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#D4AF37";
  ctx.font = `${HEADER_FONT}px 'AmiriBold'`;
  ctx.fillText(options.surahName, TEXT_CENTER_X, HEADER_Y);

  ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(TEXT_CENTER_X - 70, DECO_Y);
  ctx.lineTo(TEXT_CENTER_X + 70, DECO_Y);
  ctx.stroke();

  // ─── Pick best font plan ────────────────────────────
  const maxBlockH = TEXT_BOT - TEXT_TOP;
  type Line = { text: string; verseIdx: number; verseNum: number; isFirst: boolean };

  let plan = FONT_PLANS[0];
  let lines: Line[] = [];

  for (const candidate of FONT_PLANS) {
    const wrappedLines: Line[] = [];
    for (let i = 0; i < options.verses.length; i++) {
      const v = options.verses[i];
      const wrapped = wrapText(v.text, candidate.wrapAt);
      wrapped.forEach((text, j) => {
        wrappedLines.push({ text, verseIdx: i, verseNum: v.number, isFirst: j === 0 });
      });
    }
    const blockH = wrappedLines.length * candidate.lineH;
    if (blockH <= maxBlockH) {
      plan = candidate;
      lines = wrappedLines;
      break;
    }
  }

  if (lines.length === 0) {
    plan = FONT_PLANS[FONT_PLANS.length - 1];
    for (let i = 0; i < options.verses.length; i++) {
      const v = options.verses[i];
      const wrapped = wrapText(v.text, plan.wrapAt);
      wrapped.forEach((text, j) => {
        lines.push({ text, verseIdx: i, verseNum: v.number, isFirst: j === 0 });
      });
    }
  }

  // ─── Center vertically within text zone ────────────
  const blockH = lines.length * plan.lineH;
  const baseY = Math.round((TEXT_TOP + TEXT_BOT - blockH) / 2);

  // ─── Verses in white ────────────────────────────────
  ctx.textBaseline = "middle";
  let currentY = baseY;

  for (const line of lines) {
    ctx.font = `${plan.size}px 'UthmanicHafs'`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";

    const displayText = line.isFirst
      ? `${line.text}  ﴿${line.verseNum}﴾`
      : line.text;

    ctx.fillText(displayText, TEXT_CENTER_X, currentY);
    currentY += plan.lineH;
  }

  // ─── NOR-QURAN branding (subtle gold) ───────────────
  ctx.textAlign = "center";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "11px 'AmiriRegular'";
  ctx.globalAlpha = 0.3;
  ctx.fillText("NOR-QURAN", TEXT_CENTER_X, NOR_Y);
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

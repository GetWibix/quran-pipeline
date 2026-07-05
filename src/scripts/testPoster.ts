import { createCanvas, registerFont, loadImage } from "canvas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const FONT_DIR = path.join(__dirname, "../../assets/fonts");
registerFont(path.join(FONT_DIR, "UthmanicHafs.ttf"), { family: "UthmanicHafs" });
registerFont(path.join(FONT_DIR, "Amiri-Bold.ttf"), { family: "AmiriBold" });

async function main() {
  const bgImg = await loadImage(path.join(__dirname, "../../assets/poster-bg/2.png"));
  const W = bgImg.width;
  const H = bgImg.height;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, W, H);

  // ─── Dark card overlay in center ─────────────────────
  const cardW = W - 100;
  const cardH = 600;
  const cardX = (W - cardW) / 2;
  const cardY = (H - cardH) / 2 - 30;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 30);
  ctx.fill();

  // Gold border around card
  ctx.strokeStyle = "rgba(212, 168, 67, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 30);
  ctx.stroke();

  // ─── Top ornament ────────────────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#D4A843";
  ctx.font = "28px 'AmiriBold'";
  ctx.globalAlpha = 0.6;
  ctx.fillText("﷽", W / 2, cardY + 60);
  ctx.globalAlpha = 1;

  // Decorative line
  ctx.strokeStyle = "rgba(212, 168, 67, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, cardY + 85);
  ctx.lineTo(W / 2 + 100, cardY + 85);
  ctx.stroke();

  // ─── Surah name ──────────────────────────────────────
  ctx.fillStyle = "#D4A843";
  ctx.font = "18px 'AmiriBold'";
  ctx.globalAlpha = 0.7;
  ctx.fillText("سورة الفاتحة", W / 2, cardY + 115);
  ctx.globalAlpha = 1;

  // ─── Ayah text ───────────────────────────────────────
  const VERSES = [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَٰلَمِينَ",
    "الرَّحْمَٰنِ الرَّحِيمِ",
    "مَٰلِكِ يَوْمِ الدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "اهْدِنَا الصِّرَٰطَ الْمُسْتَقِيمَ",
    "صِرَٰطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّآلِّينَ",
  ];

  const fontSize = 50;
  const lineH = 72;
  const totalH = VERSES.length * lineH;
  let startY = cardY + (cardH - totalH) / 2 + 30;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < VERSES.length; i++) {
    const y = startY + i * lineH;
    const text = VERSES[i];

    ctx.font = `${fontSize}px 'UthmanicHafs'`;

    // Measure and wrap if needed
    const maxW = cardW - 80;
    if (ctx.measureText(text).width > maxW) {
      // Wrap into two lines
      const words = text.split(" ");
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      ctx.fillText(line1, W / 2, y - lineH / 4);
      ctx.fillText(line2, W / 2, y + lineH / 4);
      startY += lineH / 2; // extra space
    } else {
      ctx.fillText(text, W / 2, y);
    }
  }

  // ─── Bottom ornament ─────────────────────────────────
  ctx.strokeStyle = "rgba(212, 168, 67, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, cardY + cardH - 90);
  ctx.lineTo(W / 2 + 100, cardY + cardH - 90);
  ctx.stroke();

  ctx.fillStyle = "#D4A843";
  ctx.font = "24px 'AmiriBold'";
  ctx.globalAlpha = 0.5;
  ctx.fillText("✦", W / 2, cardY + cardH - 70);
  ctx.globalAlpha = 1;

  // ─── NOR-QURAN ───────────────────────────────────────
  ctx.fillStyle = "#D4A843";
  ctx.font = "13px 'AmiriBold'";
  ctx.globalAlpha = 0.25;
  ctx.fillText("NOR-QURAN", W / 2, H - 45);
  ctx.globalAlpha = 1;

  const outDir = path.join(__dirname, "../../test-output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "poster-experiment-2.png");
  await writeFile(outPath, canvas.toBuffer("image/png"));

  console.log(`✅ Poster saved: ${outPath}`);
}

main().catch(console.error);

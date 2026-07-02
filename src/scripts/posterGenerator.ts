import { createCanvas, registerFont, loadImage } from "canvas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const FONT_DIR = path.join(__dirname, "../../assets/fonts");
registerFont(path.join(FONT_DIR, "UthmanicHafs.ttf"), { family: "UthmanicHafs" });
registerFont(path.join(FONT_DIR, "Amiri-Bold.ttf"), { family: "AmiriBold" });

const VERSES = [
  { num: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
  { num: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَٰلَمِينَ" },
  { num: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ" },
  { num: 4, text: "مَٰلِكِ يَوْمِ الدِّينِ" },
  { num: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
  { num: 6, text: "اهْدِنَا الصِّرَٰطَ الْمُسْتَقِيمَ" },
  { num: 7, text: "صِرَٰطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّآلِّينَ" },
];

async function main() {
  const bgImg = await loadImage(path.join(__dirname, "../../assets/poster-bg/2.png"));
  const W = bgImg.width;
  const H = bgImg.height;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, W, H);

  // ─── Header: سورة الفاتحة ──────────────────────────
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#D4A843";
  ctx.font = "30px 'AmiriBold'";
  ctx.fillText("سورة الفاتحة", W / 2, 630);

  // decorative line under header
  ctx.strokeStyle = "rgba(212, 168, 67, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 660);
  ctx.lineTo(W / 2 + 120, 660);
  ctx.stroke();

  // ─── Verses ─────────────────────────────────────────
  let startY = 720;
  const lineH = 80;
  const margin = 60;
  const maxW = W - margin * 2;

  ctx.textBaseline = "middle";

  for (let i = 0; i < VERSES.length; i++) {
    const v = VERSES[i];
    const y = startY + i * lineH;

    // Verse text (center aligned)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "48px 'UthmanicHafs'";

    let displayText = v.text;
    if (ctx.measureText(displayText).width > maxW) {
      ctx.font = "40px 'UthmanicHafs'";
    }
    ctx.fillText(displayText, W / 2, y);

    // Verse number marker (small, next to text)
    ctx.fillStyle = "#D4A843";
    ctx.font = "14px 'AmiriBold'";
    ctx.globalAlpha = 0.4;
    ctx.fillText(`﴿${v.num}﴾`, W / 2 + ctx.measureText(displayText).width / 2 + 30, y);
    ctx.globalAlpha = 1;
  }

  // ─── NOR-QURAN ──────────────────────────────────────
  ctx.textAlign = "center";
  ctx.fillStyle = "#D4A843";
  ctx.font = "14px 'AmiriBold'";
  ctx.globalAlpha = 0.3;
  ctx.fillText("NOR-QURAN", W / 2, H - 55);
  ctx.globalAlpha = 1;

  const outDir = path.join(__dirname, "../../test-output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "poster-fatiha-2.png");
  await writeFile(outPath, canvas.toBuffer("image/png"));

  console.log(`✅ Poster saved: ${outPath}`);
}

main().catch(console.error);

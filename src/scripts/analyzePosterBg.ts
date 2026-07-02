import { createCanvas, loadImage } from "canvas";
import path from "path";

(async () => {
  const img = await loadImage(path.join(__dirname, "../../assets/poster-bg/2.png"));
  const W = img.width;
  const H = img.height;
  console.log("Dimensions:", W, "x", H);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const centerX = Math.round(W / 2);
  const stripW = 100;

  const brightness: { y: number; lum: number }[] = [];

  for (let y = 0; y < H; y += 5) {
    let total = 0;
    let count = 0;
    for (let x = centerX - stripW / 2; x < centerX + stripW / 2; x++) {
      const px = ctx.getImageData(Math.round(x), y, 1, 1).data;
      const lum = 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2];
      total += lum;
      count++;
    }
    brightness.push({ y, lum: Math.round(total / count) });
  }

  console.log("\n--- Vertical brightness (center 100px strip, every 50px) ---");
  for (const b of brightness) {
    if (b.y % 50 > 5) continue;
    const bar = b.lum < 40 ? "###" : b.lum < 80 ? "===" : b.lum < 140 ? "---" : "   ";
    console.log(`${String(b.y).padStart(4)} | lum=${String(b.lum).padStart(3)} ${bar}`);
  }

  console.log("\n--- Key vertical transitions (dark ⇄ light) ---");
  let prevDark = brightness[0].lum < 60;
  for (const b of brightness) {
    const isDark = b.lum < 60;
    if (isDark !== prevDark) {
      console.log(`  y=${String(b.y).padStart(4)}  ${isDark ? "DARK START" : "DARK END  "}  lum=${b.lum}`);
      prevDark = isDark;
    }
  }

  // Horizontal scan at key heights
  console.log("\n--- Horizontal brightness at key Y positions ---");
  const scanYs = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1670];
  for (const y of scanYs) {
    if (y >= H) continue;
    let left = 0, center = 0, right = 0, c = 0;
    for (let x = 10; x < 80; x += 2) { const p = ctx.getImageData(x, y, 1, 1).data; left += 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]; c++; }
    const l = left / c; c = 0;
    for (let x = W / 2 - 60; x < W / 2 + 60; x += 2) { const p = ctx.getImageData(Math.round(x), y, 1, 1).data; center += 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]; c++; }
    const cn = center / c; c = 0;
    for (let x = W - 80; x < W - 10; x += 2) { const p = ctx.getImageData(Math.round(x), y, 1, 1).data; right += 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]; c++; }
    const r = right / c;
    const bar = (v: number) => v < 30 ? "#" : v < 60 ? "=" : v < 100 ? "-" : " ";
    console.log(`y=${String(y).padStart(4)}  L=[${bar(l)}]${String(Math.round(l)).padStart(3)}  C=[${bar(cn)}]${String(Math.round(cn)).padStart(3)}  R=[${bar(r)}]${String(Math.round(r)).padStart(3)}`);
  }

  console.log("\n--- Corner colors (RGBA) ---");
  const corners: [string, number, number][] = [
    ["top-left", 20, 20],
    ["top-right", W - 20, 20],
    ["bottom-left", 20, H - 20],
    ["bottom-right", W - 20, H - 20],
    ["center", W / 2, H / 2],
  ];
  for (const [label, x, y] of corners) {
    const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    console.log(`${String(label).padEnd(12)} (${Math.round(x)},${Math.round(y)})  rgba(${px[0]},${px[1]},${px[2]},${px[3]})`);
  }
})().catch(console.error);

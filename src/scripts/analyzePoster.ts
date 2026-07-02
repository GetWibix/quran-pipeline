import { loadImage, createCanvas } from "canvas";

async function analyze() {
  const img = await loadImage("/var/www/quran-pipeline/test-output/poster-with-bg.png");
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);

  console.log("Image:", img.width, "x", img.height);
  console.log("\nLuminance scan (vertical center line):");
  for (let y = 0; y < img.height; y += 30) {
    const p = ctx.getImageData(img.width / 2, y, 1, 1).data;
    const bright = p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114;
    const marker = bright > 150 ? " █ BRIGHT" : bright > 80 ? " ░ MEDIUM" : "";
    console.log(`y=${y.toString().padStart(4)}: rgb(${p[0]},${p[1]},${p[2]})${marker}`);
  }
}

analyze().catch(console.error);

import { loadImage, createCanvas } from "canvas";

async function analyze() {
  const img = await loadImage("/var/www/quran-pipeline/test-output/poster-fatiha-2.png");
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // Check each verse position horizontally
  const verseYs = [720, 800, 880, 960, 1040, 1120, 1200];
  for (const y of verseYs) {
    let hasText = false;
    for (let x = 500; x < img.width - 50; x += 5) {
      const p = ctx.getImageData(x, y, 1, 1).data;
      if (p[0] > 200 && p[1] > 200 && p[2] > 200) {
        hasText = true;
        break;
      }
    }
    console.log(`y=${y}: text=${hasText}`);
  }
}

analyze().catch(console.error);

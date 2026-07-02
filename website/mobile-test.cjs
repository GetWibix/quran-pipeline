const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  await page.goto('https://quran.waxbix.com/quran/', { waitUntil: 'networkidle' });
  console.log("=== QURAN PAGE ===");
  const overflow = await page.evaluate(() => ({
    scrollW: document.body.scrollWidth,
    clientW: document.body.clientWidth,
    hasOverflow: document.body.scrollWidth > document.body.clientWidth
  }));
  console.log("Overflow:", JSON.stringify(overflow));

  const smallTargets = await page.evaluate(() => {
    const small = [];
    document.querySelectorAll('button, a, [role="button"], input, .play-btn, .filter-btn').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        small.push({ tag: el.tagName, cls: el.className.slice(0,40), text: (el.textContent||'').trim().slice(0,20), w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    return small;
  });
  console.log("Small touch targets:", smallTargets.length);
  smallTargets.slice(0,15).forEach(t => console.log(`  [${t.w}x${t.h}] <${t.tag}> ${t.text}`));

  const layout = await page.evaluate(() => {
    const main = document.querySelector('#main-content');
    if (!main) return null;
    const style = getComputedStyle(main);
    const firstCard = main.querySelector('[class*="surah"]') || main.querySelector('a[href*="/quran/"]');
    const cardStyle = firstCard ? getComputedStyle(firstCard) : null;
    return {
      paddingTop: style.paddingTop,
      gridGap: style.gap,
      cardWidth: cardStyle ? cardStyle.width : null,
      cardPadding: cardStyle ? cardStyle.padding : null,
      fontSize: cardStyle ? cardStyle.fontSize : null,
    };
  });
  console.log("Layout:", JSON.stringify(layout, null, 2));

  await page.goto('https://quran.waxbix.com/quran/1', { waitUntil: 'networkidle' });
  console.log("\n=== SURAH 1 PAGE ===");
  const overflow2 = await page.evaluate(() => ({
    scrollW: document.body.scrollWidth,
    clientW: document.body.clientWidth,
    hasOverflow: document.body.scrollWidth > document.body.clientWidth
  }));
  console.log("Overflow:", JSON.stringify(overflow2));

  const small2 = await page.evaluate(() => {
    const small = [];
    document.querySelectorAll('.play-btn, button, a, [role="button"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        small.push({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,20), w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    return small;
  });
  console.log("Small touch targets:", small2.length);
  small2.slice(0,10).forEach(t => console.log(`  [${t.w}x${t.h}] <${t.tag}> ${t.text}`));

  const detailLayout = await page.evaluate(() => {
    const cover = document.querySelector('[class*="w-48"]') || document.querySelector('[class*="rounded-2xl"]');
    const coverRect = cover ? cover.getBoundingClientRect() : null;
    const firstAyah = document.querySelector('.ayah-item') || document.querySelector('[class*="glow-card"]');
    const ayahStyle = firstAyah ? getComputedStyle(firstAyah) : null;
    const main = document.querySelector('#main-content');
    const style = main ? getComputedStyle(main) : null;
    return {
      coverW: coverRect ? Math.round(coverRect.width) : null,
      coverH: coverRect ? Math.round(coverRect.height) : null,
      mainPaddingTop: style ? style.paddingTop : null,
      ayahPadding: ayahStyle ? ayahStyle.padding : null,
    };
  });
  console.log("Detail layout:", JSON.stringify(detailLayout, null, 2));

  await browser.close();
})();

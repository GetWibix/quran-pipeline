const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  // Test Quran index page
  await page.goto('https://quran.waxbix.com/quran/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/quran-index-mobile.png', fullPage: true });

  // Check visible filter button sizes
  const filterSizes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.filter-btn')).map(b => {
      const r = b.getBoundingClientRect();
      return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log("Filter buttons:", JSON.stringify(filterSizes));

  // Check card sizes and content
  const cardInfo = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="surah-card"]');
    return Array.from(cards).slice(0,4).map(c => {
      const r = c.getBoundingClientRect();
      const text = c.textContent.trim().slice(0,40);
      return { text, w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log("Sample cards:", JSON.stringify(cardInfo));

  // Check search input
  const searchInfo = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return null;
    const r = input.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log("Search input:", JSON.stringify(searchInfo));

  // Test Surah detail page
  await page.goto('https://quran.waxbix.com/quran/1', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/surah1-mobile.png', fullPage: true });

  // Back button size
  const backBtn = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href="/quran"]');
    if (!links.length) return null;
    const r = links[0].getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log("Back button:", JSON.stringify(backBtn));

  // Play button sizes
  const playBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.play-btn')).slice(0,3).map(b => {
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
  });
  console.log("Play buttons:", JSON.stringify(playBtns));

  // Check header spacing on mobile
  const headerSpacing = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    const hr = header.getBoundingClientRect();
    const main = document.querySelector('#main-content');
    const mr = main ? main.getBoundingClientRect() : null;
    return {
      headerHeight: hr.height,
      headerBottom: hr.bottom,
      mainTop: mr ? mr.top : null,
      gap: mr ? mr.top - hr.bottom : null,
    };
  });
  console.log("Header spacing:", JSON.stringify(headerSpacing));

  // Check cover on mobile
  const cover = await page.evaluate(() => {
    const el = document.querySelector('[class*="w-48"]') || document.querySelector('[class*="rounded-2xl"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const parent = el.parentElement;
    const pr = parent ? parent.getBoundingClientRect() : null;
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      parentW: pr ? Math.round(pr.width) : null,
      ratio: pr ? (r.width / pr.width * 100).toFixed(0) + '%' : null,
    };
  });
  console.log("Cover:", JSON.stringify(cover));

  await browser.close();
})();

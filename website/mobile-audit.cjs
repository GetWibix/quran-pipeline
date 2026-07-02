const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // iPhone 14 Pro viewport
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log("============================================");
  console.log("📱 MOBILE AUDIT - QURAN INDEX PAGE");
  console.log("============================================");
  await page.goto('https://quran.waxbix.com/quran/', { waitUntil: 'networkidle' });

  await page.screenshot({ path: '/tmp/audit-quran-index.png', fullPage: true });

  const overflow = await page.evaluate(() => ({
    scrollW: document.body.scrollWidth, clientW: document.body.clientWidth
  }));
  console.log(`✅ Overflow: ${overflow.scrollW <= overflow.clientW ? 'none' : 'YES (BAD)'}`);

  const touchTargets = await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('button, a, [role="button"], input, .play-btn, .filter-btn').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
        const visible = el.offsetParent !== null;
        const style = window.getComputedStyle(el);
        const hidden = style.display === 'none' || style.visibility === 'hidden';
        if (!hidden && visible) {
          issues.push({
            tag: el.tagName, text: (el.textContent||'').trim().slice(0,20),
            w: Math.round(r.width), h: Math.round(r.height),
            cls: el.className.slice(0,30)
          });
        }
      }
    });
    return issues;
  });
  console.log(`\n❌ Small touch targets: ${touchTargets.length}`);
  touchTargets.forEach(t => console.log(`   [${t.w}x${t.h}] <${t.tag}> "${t.text}" (${t.cls})`));

  const layout = await page.evaluate(() => {
    const main = document.querySelector('#main-content');
    const style = main ? getComputedStyle(main) : null;
    const cards = document.querySelectorAll('[class*="surah"]') || document.querySelectorAll('a[href*="/quran/"]');
    const firstCard = cards[0];
    const cs = firstCard ? getComputedStyle(firstCard) : null;
    return {
      paddingTop: style?.paddingTop,
      cardWidth: cs?.width,
      cardHeight: firstCard ? Math.round(firstCard.getBoundingClientRect().height) : null,
    };
  });
  console.log(`\n📐 Layout:`);
  console.log(`   Padding top: ${layout.paddingTop}`);
  console.log(`   Card: ${layout.cardWidth} x ${layout.cardHeight}px`);

  console.log("\n============================================");
  console.log("📱 MOBILE AUDIT - SURAH DETAIL PAGE");
  console.log("============================================");
  await page.goto('https://quran.waxbix.com/quran/1', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/audit-surah1.png', fullPage: true });

  const overflow2 = await page.evaluate(() => ({
    scrollW: document.body.scrollWidth, clientW: document.body.clientWidth
  }));
  console.log(`✅ Overflow: ${overflow2.scrollW <= overflow2.clientW ? 'none' : 'YES (BAD)'}`);

  const touch2 = await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('button, a, [role="button"], .play-btn').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          issues.push({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,20), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
    });
    return issues;
  });
  console.log(`❌ Small touch targets: ${touch2.length}`);
  touch2.forEach(t => console.log(`   [${t.w}x${t.h}] <${t.tag}> "${t.text}"`));

  const detail = await page.evaluate(() => {
    const cover = document.querySelector('[class*="rounded-2xl"]');
    const cr = cover ? cover.getBoundingClientRect() : null;
    const backLink = document.querySelector('a[href="/quran"]');
    const br = backLink ? backLink.getBoundingClientRect() : null;
    const playBtns = document.querySelectorAll('.play-btn');
    const pr = playBtns.length ? playBtns[0].getBoundingClientRect() : null;
    const firstAyah = document.querySelector('.ayah-item');
    const ar = firstAyah ? firstAyah.getBoundingClientRect() : null;
    return {
      coverW: cr ? Math.round(cr.width) : null,
      coverH: cr ? Math.round(cr.height) : null,
      backBtnW: br ? Math.round(br.width) : null,
      backBtnH: br ? Math.round(br.height) : null,
      playBtnW: pr ? Math.round(pr.width) : null,
      playBtnH: pr ? Math.round(pr.height) : null,
      ayahItemH: ar ? Math.round(ar.height) : null,
    };
  });
  console.log(`\n📐 Detail layout:`);
  console.log(`   Cover: ${detail.coverW}x${detail.coverH}`);
  console.log(`   Back btn: ${detail.backBtnW}x${detail.backBtnH}`);
  console.log(`   Play btn: ${detail.playBtnW}x${detail.playBtnH}`);
  console.log(`   Ayah item height: ${detail.ayahItemH}px`);

  const main = await page.evaluate(() => {
    const m = document.querySelector('#main-content');
    const s = m ? getComputedStyle(m) : null;
    return { paddingTop: s?.paddingTop };
  });
  console.log(`   Padding top: ${main.paddingTop}`);

  // Test hamburger menu button on home page
  console.log("\n============================================");
  console.log("📱 MOBILE AUDIT - HOME PAGE HEADER");
  console.log("============================================");
  await page.goto('https://quran.waxbix.com/', { waitUntil: 'networkidle' });

  const header = await page.evaluate(() => {
    const hamburger = document.getElementById('mobile-menu-btn');
    const hr = hamburger ? hamburger.getBoundingClientRect() : null;
    const github = document.querySelector('a[href*="github"]');
    const gr = github ? github.getBoundingClientRect() : null;
    return {
      hamburgerW: hr ? Math.round(hr.width) : null,
      hamburgerH: hr ? Math.round(hr.height) : null,
      githubW: gr ? Math.round(gr.width) : null,
      githubH: gr ? Math.round(gr.height) : null,
    };
  });
  console.log(`   Hamburger btn: ${header.hamburgerW}x${header.hamburgerH}`);
  console.log(`   GitHub btn: ${header.githubW}x${header.githubH}`);

  await browser.close();
})();

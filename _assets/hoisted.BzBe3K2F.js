import"./hoisted.BzcJXfT6.js";const r=JSON.parse(document.getElementById("surahs-data").textContent),s=document.getElementById("surahs-container"),n=document.getElementById("search-input");function i(t=""){const a=r.filter(e=>e.nameArabic.includes(t)||e.englishName.toLowerCase().includes(t.toLowerCase()));s.innerHTML=a.map(e=>`
        <a href="/quran/${e.number}" class="glow-card p-4 text-center group cursor-pointer">
          <div class="text-lg font-bold text-primary mb-1">${e.number}</div>
          <div class="font-semibold text-lg font-amiri">${e.nameArabic}</div>
          <div class="text-text-muted text-xs mt-1">${e.englishName}</div>
          <div class="text-text-muted text-xs">${e.numberOfAyahs} آية</div>
        </a>
      `).join("")}n&&n.addEventListener("input",t=>i(t.target.value));

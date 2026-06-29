import"./hoisted.BzcJXfT6.js";async function c(){try{let e=function(a=""){const i=r.filter(t=>t.nameArabic.includes(a)||t.englishName.toLowerCase().includes(a.toLowerCase()));s.innerHTML=i.map(t=>`
            <a href="/quran/${t.number}" class="glow-card p-4 text-center group cursor-pointer">
              <div class="text-lg font-bold text-primary mb-1">${t.number}</div>
              <div class="font-semibold text-lg font-amiri">${t.nameArabic}</div>
              <div class="text-text-muted text-xs mt-1">${t.englishName}</div>
              <div class="text-text-muted text-xs">${t.numberOfAyahs} آية</div>
            </a>
          `).join("")};var d=e;const r=(await(await fetch("https://api.alquran.cloud/v1/surah")).json()).data,s=document.getElementById("surahs-container"),n=document.getElementById("search-input");e(),n&&n.addEventListener("input",a=>e(a.target.value))}catch{document.getElementById("surahs-container").innerHTML='<div class="text-center text-red-400 py-12 col-span-full">عذراً، تعذر تحميل السور. حاول مرة أخرى لاحقاً.</div>'}}c();

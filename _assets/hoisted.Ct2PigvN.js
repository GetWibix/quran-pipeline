import"./hoisted.CMQ76DSi.js";const d=JSON.parse(document.getElementById("surahs-data").textContent),s=document.getElementById("surahs-container"),r=document.getElementById("search-input"),i=document.querySelectorAll(".filter-btn");let n="all";function l(){const t=(r?.value||"").trim(),a=d.filter(e=>{const c=!t||e.name.includes(t)||e.englishName.toLowerCase().includes(t.toLowerCase())||String(e.number)===t,o=n==="all"||e.revelationType===n;return c&&o});if(a.length===0){s.innerHTML='<div class="col-span-full text-center text-text-muted py-16">لا توجد نتائج للبحث</div>';return}s.innerHTML=a.map(e=>`
        <a href="/quran/${e.number}" class="group bg-card hover:bg-card-hover rounded-xl p-4 transition-all duration-300">
          <div class="relative w-full aspect-square mb-3 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 overflow-hidden shadow-lg group-hover:shadow-xl group-hover:shadow-accent/10 transition-all">
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl md:text-4xl font-bold text-white/80 font-amiri">${e.number}</span>
            </div>
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-accent shadow-xl shadow-accent/30 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                <svg class="w-5 h-5 mr-0.5 text-white" fill="currentColor" viewBox="0 0 384 512">
                  <path d="M73 39c-14.8-9.3-33.4-9.1-48 .3-14.7 9.5-23.7 25.9-23.7 43.6v346.2c0 17.7 9 34.1 23.7 43.6 14.6 9.4 33.2 9.6 48 .3l288-194.3c14.4-9.7 22.3-25.1 22.3-41s-7.9-31.3-22.3-41L73 39z"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="text-sm font-semibold truncate text-white">${e.name}</div>
          <div class="text-xs text-text-muted truncate mt-0.5">${e.englishName}</div>
        </a>
      `).join("")}i.forEach(t=>{t.addEventListener("click",()=>{i.forEach(a=>{a.classList.remove("bg-white","text-black"),a.classList.add("bg-white/10","text-text-secondary")}),t.classList.remove("bg-white/10","text-text-secondary"),t.classList.add("bg-white","text-black"),n=t.getAttribute("data-filter"),l()})});r&&r.addEventListener("input",l);

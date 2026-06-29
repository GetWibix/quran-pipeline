import"./hoisted.BzcJXfT6.js";async function r(){const a=window.location.pathname.split("/").pop();try{const e=(await(await fetch(`https://api.alquran.cloud/v1/surah/${a}`)).json()).data.ayahs,i=document.getElementById("ayahs-container");i.innerHTML=e.map((t,s)=>`
          <div class="glow-card p-6 text-center" id="ayah-${t.numberInSurah}">
            <div class="text-text-muted text-xs mb-2">الآية ${t.numberInSurah}</div>
            <div class="arabic-verse mb-3">${t.text}</div>
            <button
              onclick="playAudio(${t.numberInSurah})"
              class="text-primary hover:text-secondary transition-colors text-sm"
              id="play-btn-${t.numberInSurah}"
            >
              ▶ استمع
            </button>
            <audio id="audio-${t.numberInSurah}" preload="none"></audio>
          </div>
        `).join("")}catch{document.getElementById("ayahs-container").innerHTML='<div class="text-center text-red-400 py-8">عذراً، تعذر تحميل الآيات.</div>'}}window.playAudio=function(a){const o=window.location.pathname.split("/").pop(),n=document.getElementById(`audio-${a}`),e=document.getElementById(`play-btn-${a}`),i=o.padStart(3,"0"),t=a.toString().padStart(3,"0"),s=`https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/${i}${t}.mp3`;n.src!==s&&(n.src=s),n.paused?(n.play(),e.innerHTML="⏸ إيقاف"):(n.pause(),e.innerHTML="▶ استمع"),n.onended=()=>{e.innerHTML="▶ استمع"}};r();

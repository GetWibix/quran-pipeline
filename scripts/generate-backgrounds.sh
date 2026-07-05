#!/bin/bash
# generate-backgrounds.sh
# يولد خلفيات فيديو متنوعة عبر FFmpeg (بدون حقوق نشر)
set -e

OUTPUT_DIR="$(dirname "$0")/../assets/backgrounds"
mkdir -p "$OUTPUT_DIR"

W=1920
H=1080
FPS=30
DUR=15

echo "╔══════════════════════════════════════════════╗"
echo "║     🎨  توليد خلفيات قرآنية متنوعة           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

COUNT=0

gen() {
  local name="$1"
  local filter="$2"
  local out="$OUTPUT_DIR/bg-$name.mp4"

  if [ -f "$out" ] && [ -s "$out" ]; then
    echo "   ✅ موجود: $name"
    return
  fi

  echo "   🎬 [$((++COUNT))] توليد: $name..."
  ffmpeg -y -f lavfi -i "$filter" -c:v libx264 -preset veryfast -crf 23 \
    -pix_fmt yuv420p -t "$DUR" -r "$FPS" "$out" 2>/dev/null && \
    echo "      ✅ $(du -h "$out" | cut -f1)" || \
    echo "      ⚠️ فشل"
}

# ─── سماء وغيوم ──────────────────────────────
gen "سماء-زرقاء-1" "color=c=#87CEEB:s=${W}x${H}:d=${DUR}"
gen "سماء-غروب-1" "color=c=#FF6B35:s=${W}x${H}:d=${DUR}"
gen "سماء-ليل-1" "color=c=#0B0B2B:s=${W}x${H}:d=${DUR}"
gen "سماء-ضباب-1" "color=c=#B0C4DE:s=${W}x${H}:d=${DUR}"

# ─── غيوم متحركة ─────────────────────────────
gen "غيوم-بيضاء-1" "nullsrc=s=${W}x${H}:d=${DUR},geq=r='255*min(1,max(0,255-abs(800-mod(X+2*T*50,1600))/2))':g='255*min(1,max(0,255-abs(800-mod(X+2*T*50,1600))/2))':b='255*min(1,max(0,255-abs(800-mod(X+2*T*50,1600))/2))',format=yuv420p"
gen "غيوم-غروب-1" "color=c=#FF8C42:s=${W}x${H}:d=${DUR},drawbox=x=0:y=200:w=iw:h=3:color=white@0.3:t=fill,drawbox=x=500-mod(2*T*60,900):y=300:w=400:h=60:color=white@0.2:t=fill"

# ─── نجوم وفضاء ──────────────────────────────
gen "نجوم-1" "color=c=#000011:s=${W}x${H}:d=${DUR},drawbox=x=100:y=100:w=3:h=3:color=white@0.8:t=fill,drawbox=x=300:y=50:w=2:h=2:color=white@0.6:t=fill,drawbox=x=500:y=200:w=4:h=4:color=white@0.9:t=fill,drawbox=x=700:y=80:w=2:h=2:color=white@0.5:t=fill,drawbox=x=900:y=300:w=3:h=3:color=white@0.7:t=fill,drawbox=x=1100:y=150:w=2:h=2:color=white@0.8:t=fill,drawbox=x=1300:y=400:w=3:h=3:color=white@0.6:t=fill,drawbox=x=1500:y=100:w=2:h=2:color=white@0.9:t=fill,drawbox=x=1700:y=250:w=4:h=4:color=white@0.5:t=fill,drawbox=x=200:y=500:w=2:h=2:color=white@0.7:t=fill,drawbox=x=800:y=600:w=3:h=3:color=white@0.6:t=fill,drawbox=x=1400:y=700:w=2:h=2:color=white@0.8:t=fill,drawbox=x=600:y=800:w=3:h=3:color=white@0.5:t=fill,drawbox=x=1600:y=900:w=2:h=2:color=white@0.7:t=fill"
gen "نجوم-متلألئة-1" "nullsrc=s=${W}x${H}:d=${DUR},geq=r='255*random(1)*lt(random(2),0.02)':g='255*random(1)*lt(random(2),0.02)':b='255*random(1)*lt(random(2),0.02)',format=yuv420p"
gen "فضاء-1" "color=c=#05051A:s=${W}x${H}:d=${DUR}"
gen "مجرة-1" "color=c=#1A0A2E:s=${W}x${H}:d=${DUR}"

# ─── غروب وشروق ──────────────────────────────
gen "غروب-1" "color=c=#E8630A:s=${W}x${H}:d=${DUR}"
gen "شروق-1" "color=c=#F4A460:s=${W}x${H}:d=${DUR}"

# ─── أمواج وماء ──────────────────────────────
gen "أمواج-هادئة-1" "color=c=#1E90FF:s=${W}x${H}:d=${DUR}"
gen "ماء-1" "color=c=#4682B4:s=${W}x${H}:d=${DUR}"

# ─── ألوان متدرجة متحركة ─────────────────────
gen "تدرج-أزرق-1" "color=c=#000033:s=${W}x${H}:d=${DUR},drawbox=x=0:y=H/2:w=iw:h=H/2:color=#004488@0.5:t=fill"
gen "تدرج-ذهبي-1" "color=c=#4A1A00:s=${W}x${H}:d=${DUR},drawbox=x=0:y=H/2:w=iw:h=H/2:color=#D4A017@0.4:t=fill"
gen "تدرج-أخضر-1" "color=c=#004D00:s=${W}x${H}:d=${DUR},drawbox=x=0:y=H/2:w=iw:h=H/2:color=#008000@0.3:t=fill"

# ─── خلفيات دينية (المسجد النبوي بألوان) ─────
gen "مسجد-أخضر-1" "color=c=#0D5C2E:s=${W}x${H}:d=${DUR}"
gen "مسجد-ذهبي-1" "color=c=#8B6914:s=${W}x${H}:d=${DUR}"
gen "مسجد-أزرق-1" "color=c=#1B3A5C:s=${W}x${H}:d=${DUR}"

# ─── طبيعة ────────────────────────────────────
gen "طبيعة-خضراء-1" "color=c=#228B22:s=${W}x${H}:d=${DUR}"
gen "صحراء-1" "color=c=#C2A03A:s=${W}x${H}:d=${DUR}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     ✅ تم توليد $COUNT خلفية                       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
ls -lh "$OUTPUT_DIR"/bg-*.mp4 2>/dev/null

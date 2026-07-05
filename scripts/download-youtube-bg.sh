#!/bin/bash
# download-youtube-bg.sh - v3 (simple approach)
set -e
OUT="assets/backgrounds"

TOTAL=0
SUCCESS=0

dl() {
  local ID="$1" NAME="$2" DUR="$3"
  TOTAL=$((TOTAL + 1))
  local OUT_FILE="$OUT/bg-$NAME.mp4"

  if [ -f "$OUT_FILE" ] && [ -s "$OUT_FILE" ]; then
    echo "  ✅ موجود: $NAME"
    SUCCESS=$((SUCCESS + 1))
    return
  fi

  echo "  📥 [$TOTAL] $NAME ..."
  local TMP="/tmp/ytbg_${ID}.mp4"
  
  if yt-dlp -q -f "bestvideo[height<=1080][ext=mp4]" --no-audio \
    --download-sections "*0-25" --force-keyframes-at-cuts \
    -o "$TMP" "https://youtube.com/watch?v=$ID" 2>/dev/null; then
    
    if [ -s "$TMP" ]; then
      local SZ=$(du -h "$TMP" | cut -f1)
      ffmpeg -y -i "$TMP" -t "$DUR" -c:v libx264 -preset veryfast -crf 23 \
        -pix_fmt yuv420p -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
        "$OUT_FILE" 2>/dev/null
      rm -f "$TMP"

      if [ -s "$OUT_FILE" ]; then
        echo "     ✅ ${DUR}s, $(du -h "$OUT_FILE" | cut -f1)"
        SUCCESS=$((SUCCESS + 1))
      else
        echo "     ⚠️ فشل القص"
      fi
    fi
  fi
  sleep 1
}

# Category: Sky & Clouds
dl "RFmQSO2fO30" "غيوم-جبال" 15
dl "4NkTnfxY8_Y" "سماء-غيوم" 15
dl "98TUaEPV0GY" "سماء-نجوم" 15
dl "7O0dRO0LMrA" "قمر-ليل" 15

# Category: Nature
dl "U9N2h3GY7jU" "شلال-ماء" 15
dl "J9pW4mZOBZs" "غروب-شمس" 15
dl "wMEADMQ4_Iw" "طبيعة-ربيع" 15
dl "6odsNDomKWE" "جبال-ثلوج" 15
dl "-cye5-tqWUE" "غابات-مطرية" 15

# Category: Water
dl "oGGHE6YXBlo" "أمواج-بحر" 15
dl "RvreULjnzFo" "أمطار-غابة" 15
dl "ujkudLuvYQ8" "نهر-جاري" 15
dl "ltpaL7v2YxI" "موجة-بحر" 15

# Category: Sun & Landscape
dl "fXjlZbYX6yA" "شروق-شمس" 15

echo ""
echo "✅ $SUCCESS/$TOTAL فيديو تم تحميلها بنجاح"
ls -lhS "$OUT"/bg-*.mp4 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}' | head -30

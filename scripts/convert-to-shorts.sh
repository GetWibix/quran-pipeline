#!/bin/bash
# convert-to-shorts.sh
# يقص الفيديو الطويل 16:9 إلى 9:16 مناسب للشورتس
# الاستخدام:
#   ./convert-to-shorts.sh input.mp4                    ← يحفظ كـ input-shorts.mp4
#   ./convert-to-shorts.sh input.mp4 output.mp4         ← يحفظ بالمسمى المحدد
#   ./convert-to-shorts.sh input.mp4 output.mp4 45      ← يقص أول 45 ثانية (default: 60)

set -e

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}-shorts.mp4}"
DURATION="${3:-60}"

if [ -z "$INPUT" ] || [ ! -f "$INPUT" ]; then
  echo "❌ الاستخدام: $0 input.mp4 [output.mp4] [duration]"
  exit 1
fi

echo "╔══════════════════════════════════════════════╗"
echo "║     📱  تحويل فيديو 16:9 ← 9:16 للشورتس    ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  المدخل: $(basename "$INPUT")"
echo "║  المخرج: $(basename "$OUTPUT")"
echo "║  المدة:  ${DURATION} ثانية"
echo "╚══════════════════════════════════════════════╝"

# يقيس حجم المدخل
SIZE=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$INPUT" 2>/dev/null || echo "?x?")
echo "📐 الأبعاد الأصلية: $SIZE"

START=$SECONDS
ffmpeg -y -i "$INPUT" \
  -t "$DURATION" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "$OUTPUT"

ELAPSED=$((SECONDS - START))
SIZE_OUT=$(du -h "$OUTPUT" | cut -f1)
echo "✅ تم خلال ${ELAPSED}ث — $SIZE_OUT"
ls -lh "$OUTPUT"

#!/bin/bash
# download-backgrounds.sh
# ينزّل فيديوهات خلفية متنوعة من Pixabay (مجانية، بدون حقوق نشر)
set -e

OUTPUT_DIR="$(dirname "$0")/../assets/backgrounds"
mkdir -p "$OUTPUT_DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║     🌌  تحميل خلفيات قرآنية متنوعة          ║"
echo "╚══════════════════════════════════════════════╝"

declare -A VIDEOS
# المصدر: Pixabay - فيديوهات مجانية بدون حقوق نشر
# التصنيفات: سماء، غيوم، نجوم، طبيعة، مسجد، ماء، فضاء

VIDEOS["سماء-غروب-1"]="https://cdn.pixabay.com/video/2023/06/20/168177-837679350_large.mp4"
VIDEOS["سماء-غروب-2"]="https://cdn.pixabay.com/video/2022/06/08/119848-721453225_large.mp4"
VIDEOS["سماء-زرقاء-1"]="https://cdn.pixabay.com/video/2021/11/22/99501-623143719_large.mp4"
VIDEOS["سماء-ليل-1"]="https://cdn.pixabay.com/video/2022/12/10/142292-777543094_large.mp4"
VIDEOS["غيوم-1"]="https://cdn.pixabay.com/video/2023/06/17/167305-835303829_large.mp4"
VIDEOS["غيوم-2"]="https://cdn.pixabay.com/video/2018/04/20/16023-265187844_large.mp4"
VIDEOS["غيوم-غروب-1"]="https://cdn.pixabay.com/video/2023/05/22/165041-830896637_large.mp4"
VIDEOS["نجوم-1"]="https://cdn.pixabay.com/video/2022/09/17/131650-747327989_large.mp4"
VIDEOS["نجوم-فضاء-1"]="https://cdn.pixabay.com/video/2022/07/27/126014-735461115_large.mp4"
VIDEOS["فضاء-1"]="https://cdn.pixabay.com/video/2021/05/10/74346-548171262_large.mp4"
VIDEOS["مجرة-1"]="https://cdn.pixabay.com/video/2021/02/05/64625-514016119_large.mp4"
VIDEOS["شروق-1"]="https://cdn.pixabay.com/video/2023/05/08/162054-825854018_large.mp4"
VIDEOS["غروب-1"]="https://cdn.pixabay.com/video/2022/09/28/133060-751019831_large.mp4"
VIDEOS["غروب-شاطئ-1"]="https://cdn.pixabay.com/video/2022/05/28/117798-717939947_large.mp4"
VIDEOS["أمواج-1"]="https://cdn.pixabay.com/video/2019/02/15/21480-319499691_large.mp4"
VIDEOS["ماء-1"]="https://cdn.pixabay.com/video/2022/05/29/118704-718151590_large.mp4"
VIDEOS["شلال-1"]="https://cdn.pixabay.com/video/2023/08/12/176823-854658664_large.mp4"
VIDEOS["مسجد-1"]="https://cdn.pixabay.com/video/2021/12/07/100827-628557288_large.mp4"
VIDEOS["مسجد-ليل-1"]="https://cdn.pixabay.com/video/2023/03/30/156071-813312186_large.mp4"
VIDEOS["مسجد-قبة-1"]="https://cdn.pixabay.com/video/2023/04/18/159466-821783454_large.mp4"
VIDEOS["أزهار-1"]="https://cdn.pixabay.com/video/2023/04/18/159560-822048141_large.mp4"
VIDEOS["طبيعة-خضراء-1"]="https://cdn.pixabay.com/video/2023/04/06/157371-815700525_large.mp4"
VIDEOS["جبال-1"]="https://cdn.pixabay.com/video/2022/12/17/143515-781093979_large.mp4"
VIDEOS["صحراء-1"]="https://cdn.pixabay.com/video/2022/12/13/142698-779121968_large.mp4"
VIDEOS["أمطار-1"]="https://cdn.pixabay.com/video/2016/11/16/8678-192418690_large.mp4"
VIDEOS["ثلوج-1"]="https://cdn.pixabay.com/video/2022/12/22/144104-783124159_large.mp4"
VIDEOS["شفق-قطبي-1"]="https://cdn.pixabay.com/video/2022/10/07/134421-754848607_large.mp4"
VIDEOS["ضوء-شمس-1"]="https://cdn.pixabay.com/video/2022/06/17/121110-725918243_large.mp4"
VIDEOS["قمر-1"]="https://cdn.pixabay.com/video/2023/03/30/156017-813089768_large.mp4"
VIDEOS["سحاب-متحرك-1"]="https://cdn.pixabay.com/video/2021/07/08/80299-566664848_large.mp4"

TOTAL=${#VIDEOS[@]}
COUNT=0
SUCCESS=0

for name in "${!VIDEOS[@]}"; do
  url="${VIDEOS[$name]}"
  ext="mp4"
  output="$OUTPUT_DIR/bg-$name.$ext"

  if [ -f "$output" ] && [ -s "$output" ]; then
    echo "   ✅ موجود مسبقاً: $name"
    ((COUNT++))
    ((SUCCESS++))
    continue
  fi

  echo "   📥 [$((++COUNT))/$TOTAL] تحميل: $name..."
  if wget -q --timeout=30 -O "$output" "$url" 2>/dev/null; then
    if [ -s "$output" ]; then
      size=$(du -h "$output" | cut -f1)
      echo "      ✅ تم — $size"
      ((SUCCESS++))
    else
      echo "      ⚠️ ملف فارغ"
      rm -f "$output"
    fi
  else
    echo "      ⚠️ فشل التحميل"
  fi

  # تأخير قصير بين التحميلات
  sleep 1
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     ✅ تم تحميل $SUCCESS من $TOTAL فيديو           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "الخلفيات في: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/bg-*.mp4 2>/dev/null | wc -l

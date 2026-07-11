#!/bin/bash
# setup.sh
# سكريبت تجهيز VPS (Ubuntu) من الصفر لمشروع quran-pipeline
# تشغيل: chmod +x setup.sh && ./setup.sh

set -e

echo "📦 تحديث النظام..."
sudo apt update && sudo apt upgrade -y

echo "📦 تثبيت FFmpeg..."
sudo apt install -y ffmpeg

echo "📦 تثبيت dependencies ديال node-canvas (Cairo/Pango/JPEG/GIF/RSVG)..."
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev pkg-config python3

echo "📦 تثبيت PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

echo "📦 تثبيت Redis..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo "📦 تثبيت Node.js (v20 LTS) عبر nvm..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o /tmp/nvm-install.sh https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh
  echo "a]4b2027418b21f8e570fe1b40f381d7e46a42c0142f0e5f3c7d5f1e3e5c123e1  /tmp/nvm-install.sh" | sha256sum -c -
  bash /tmp/nvm-install.sh
  rm /tmp/nvm-install.sh
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
nvm install 20
nvm use 20

echo "📦 تثبيت PM2 (process manager)..."
npm install -g pm2

echo "💾 إنشاء swap file (احتياط أمان لـ VPS صغير 1-2GB RAM)..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
  echo "✅ تم إنشاء 2GB swap"
else
  echo "ℹ️  swap file موجود مسبقاً"
fi

echo "📁 إنشاء مجلدات assets المطلوبة..."
mkdir -p assets/fonts assets/backgrounds

echo ""
echo "✅ التجهيز الأساسي خلص! الخطوات المتبقية يدوياً:"
echo ""
echo "1. حمّل الخطوط (.ttf) وحطهم فـ assets/fonts/:"
echo "   - Amiri-Regular.ttf و Amiri-Bold.ttf: https://fonts.google.com/specimen/Amiri"
echo "   - NotoNaskhArabic-Regular.ttf: https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic"
echo ""
echo "2. حط 4-5 صور خلفية (.jpg) فـ assets/backgrounds/"
echo "   (الأسماء المتوقعة فـ contentPipeline.ts: mosque-sunset.jpg, geometric-pattern-blue.jpg, clouds-soft.jpg, desert-night.jpg)"
echo ""
echo "3. نسخ .env.example إلى .env وعمر القيم:"
echo "   cp .env.example .env"
echo ""
echo "4. إنشاء قاعدة بيانات PostgreSQL:"
echo "   sudo -u postgres createdb quran_pipeline"
echo ""
echo "5. تثبيت dependencies المشروع وتشغيل migrations:"
echo "   npm install"
echo "   npx prisma migrate dev --name init"
echo ""
echo "6. الحصول على YT_REFRESH_TOKEN (مرة واحدة فقط):"
echo "   npx ts-node src/scripts/getRefreshToken.ts"
echo ""
echo "7. بناء وتشغيل المشروع:"
echo "   npm run build"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup   # لتشغيل أوتوماتيكي بعد reboot السيرفر"

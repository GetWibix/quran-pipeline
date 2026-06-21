#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║     🚀  تحديث ونشر Quran Pipeline  🚀      ║"
echo "╚══════════════════════════════════════════════╝"

cd "$(dirname "$0")"

# 1. سحب آخر التحديثات من GitHub
echo ""
echo "📥 [1/6] سحب آخر التحديثات من GitHub..."
git pull origin main

# 2. تثبيت الاعتماديات
echo ""
echo "📦 [2/6] تثبيت الاعتماديات..."
npm install

# 3. تحديث Prisma
echo ""
echo "🗄️  [3/6] تحديث قاعدة البيانات..."
npx prisma generate
npx prisma db push

# 4. بناء المشروع
echo ""
echo "🔨 [4/6] بناء المشروع (TypeScript)..."
npm run build

# 5. تحديث PM2
echo ""
echo "🔄 [5/6] إعادة تشغيل خدمات PM2..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js

# 6. عرض الحالة
echo ""
echo "📊 [6/6] حالة الخدمات..."
pm2 list | grep quran-

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     ✅✅✅  تم التحديث بنجاح  ✅✅✅         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "لمشاهدة الأحداث المباشرة:"
echo "  pm2 logs quran-worker"
echo "  pm2 logs quran-scheduler"

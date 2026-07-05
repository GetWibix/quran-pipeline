#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║     🚀  تحديث ونشر Quran Pipeline  🚀      ║"
echo "╚══════════════════════════════════════════════╝"

cd "$(dirname "$0")"

# 1. سحب آخر التحديثات من GitHub
echo ""
echo "📥 [1/7] سحب آخر التحديثات من GitHub..."
git pull origin main

# 2. إنشاء قاعدة البيانات إن لم تكن موجودة
echo ""
echo "🗄️  [2/7] التأكد من وجود قاعدة البيانات..."
DB_URL="${DATABASE_URL:-$(grep '^DATABASE_URL=' .env | head -1 | cut -d= -f2-)}"
if [ -n "$DB_URL" ]; then
  DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\).*|\1|p')
  DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
  DB_PASS=$(echo "$DB_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p')
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc \
    "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null \
    | grep -q 1 || {
      echo "   📦 إنشاء قاعدة البيانات $DB_NAME..."
      PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        -c "CREATE DATABASE $DB_NAME" 2>/dev/null && echo "   ✅ تم الإنشاء" \
        || echo "   ⚠️  لا يمكن إنشاء قاعدة البيانات — قد تحتاج صلاحيات"
    }
else
  echo "   ⚠️  لم يتم العثور على DATABASE_URL في .env"
fi

# 3. تثبيت الاعتماديات
echo ""
echo "📦 [3/7] تثبيت الاعتماديات..."
npm install

# 4. تحديث Prisma
echo ""
echo "🗄️  [4/7] تحديث قاعدة البيانات..."
npx prisma generate
npx prisma db push

# 4. بناء المشروع
echo ""
echo "🔨 [5/7] بناء المشروع (TypeScript)..."
npm run build

# 6. تحديث PM2
echo ""
echo "🔄 [6/7] إعادة تشغيل خدمات PM2..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js

# 7. عرض الحالة
echo ""
echo "📊 [7/7] حالة الخدمات..."
pm2 list | grep quran-

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     ✅✅✅  تم التحديث بنجاح  ✅✅✅         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "لمشاهدة الأحداث المباشرة:"
echo "  pm2 logs quran-worker"
echo "  pm2 logs quran-scheduler"

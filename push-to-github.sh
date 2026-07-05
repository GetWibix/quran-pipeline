#!/bin/bash
# push-to-github.sh
# سكريبت رفع المشروع إلى GitHub
# التشغيل: chmod +x push-to-github.sh && ./push-to-github.sh

set -e

REPO_URL="https://github.com/GetWibix/quran-pipeline.git"
BRANCH="main"

echo "========================================"
echo "  🚀 رفع المشروع إلى GitHub"
echo "========================================"
echo ""

# 1. التأكد من وجود Git
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. قم بتثبيته أولاً:"
    echo "   sudo apt install git"
    exit 1
fi

# 2. تهيئة Git (إن لم يكن)
if [ ! -d ".git" ]; then
    echo "📦 تهيئة مستودع Git..."
    git init
    echo "✅ تم"
else
    echo "ℹ️  مستودع Git موجود مسبقاً"
fi

# 3. ضبط remote
echo "🔗 إضافة remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
echo "✅ remote: $REPO_URL"

# 4. إضافة جميع الملفات
echo "📁 إضافة الملفات..."
git add -A

# 5. تأكيد (commit)
echo "💾 إنشاء commit..."
git commit -m "🎉 الإصدار الأول - Quran Pipeline

نظام آلي لتوليد ونشر محتوى قرآني على يوتيوب
تطوير: https://waxbix.com
بالتعاون مع: GetWibix"

# 6. دفع إلى GitHub
echo "☁️  رفع إلى GitHub..."
echo ""
echo "⚠️  سيُطلب منك إدخال اسم المستخدم وكلمة السر (أو Personal Access Token)"
echo "   لإنشاء Token: https://github.com/settings/tokens"
echo ""
git push -u origin "$BRANCH"

echo ""
echo "========================================"
echo "  ✅ تم الرفع بنجاح!"
echo "  📎 $REPO_URL"
echo "========================================"

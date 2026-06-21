<div align="center">
  <img src="https://raw.githubusercontent.com/waxbix/quran-pipeline/main/assets/banner.png" alt="Quran Pipeline" width="100%" style="max-width: 800px;">
  
  <h1 align="center" style="font-size: 2.5em; margin: 20px 0;">القرآن 🕌 Pipeline</h1>
  <p align="center"><b>نظام آلي ذكي لنشر محتوى قرآني على يوتيوب — 24/7/365</b></p>

  <p align="center">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
    <img src="https://img.shields.io/badge/Redis-FF4438?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
    <img src="https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube API"/>
    <img src="https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white" alt="FFmpeg"/>
    <img src="https://img.shields.io/badge/OpenRouter-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter"/>
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/PM2-2B037E?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2"/>
  </p>

  <p align="center">
    <img src="https://img.shields.io/github/license/waxbix/quran-pipeline?style=flat-square&color=blue" alt="License"/>
    <img src="https://img.shields.io/github/stars/waxbix/quran-pipeline?style=flat-square&color=yellow" alt="Stars"/>
    <img src="https://img.shields.io/github/issues/waxbix/quran-pipeline?style=flat-square&color=red" alt="Issues"/>
    <img src="https://img.shields.io/badge/الدعم-PayPal-00457C?style=flat-square&logo=paypal" alt="PayPal"/>
  </p>

  <hr>

  <p align="center">
    🌟 <b>مشروع خيري مفتوح المصدر</b> — لوجه الله تعالى، لا أجر مادي ولا بيع<br>
    🤲 <i>"وَجَعَلۡنَا مِنۢ بَيۡنِ أَيۡدِيهِمۡ سَدࣰّا وَمِنۡ خَلۡفِهِمۡ سَدࣰّا فَأَغۡشَيۡنَـٰهُمۡ فَهُمۡ لَا يُبۡصِرُونَ"</i>
  </p>
</div>

---

## 📋 المحتويات

- [✨ الميزات](#-الميزات)
- [🛠️ التقنيات المستخدمة](#️-التقنيات-المستخدمة)
- [📸 معاينة المحتوى](#-معاينة-المحتوى)
- [🚀 البدء السريع (للمطورين)](#-البدء-السريع-للمطورين)
  - [المتطلبات](#المتطلبات)
  - [التشغيل المحلي](#التشغيل-المحلي)
  - [التشغيل عبر Docker](#التشغيل-عبر-docker)
- [🌐 النشر على السيرفر (VPS)](#-النشر-على-السيرفر-vps)
- [⚙️ الإعدادات](#️-الإعدادات)
  - [1. حساب YouTube API](#1-حساب-youtube-api)
  - [2. مفتاح OpenRouter (AI مجاني)](#2-مفتاح-openrouter-ai-مجاني)
  - [3. قاعدة البيانات](#3-قاعدة-البيانات)
  - [4. إشعارات Telegram (اختياري)](#4-إشعارات-telegram-اختياري)
  - [5. ملف .env](#5-ملف-env)
- [🎯 كيف يعمل النظام؟](#-كيف-يعمل-النظام)
- [📁 هيكل المشروع](#-هيكل-المشروع)
- [📜 الترخيص](#-الترخيص)
- [🤝 الدعم والتبرع](#-الدعم-والتبرع)
- [📞 التواصل](#-التواصل)

---

## ✨ الميزات

| الميزة | الوصف |
|--------|-------|
| **🤖 ذكاء اصطناعي** | يختار آيات متنوعة ويولد عناوين جذابة ومحترمة |
| **🎬 Shorts 30-60 ثانية** | متوافق مع YouTube Shorts (آيات كاملة، لا قطع) |
| **📖 قراءة تسلسلية** | يتقدم عبر القرآن كامل (6236 آية) بدون تكرار |
| **🎙️ قراء متعددون (وزني)** | عبدالباسط 40%، العفاسي 30%، المعيقلي 20%، الغامدي 10% |
| **🎞️ خلفية فيديو متحركة** | 4 خلفيات مختلفة، واحدة لكل آية (شفافة) |
| **📊 تحليل القناة** | يجيب المشاهدات/الإعجابات/التعليقات ويحلل أفضل أوقات النشر |
| **⏰ أوقات نشر ديناميكية** | تتكيف تلقائياً حسب أداء الفيديوهات السابقة |
| **🧪 معاينة قبل النشر** | سكربت preview + e2e لاختبار الفيديو قبل الرفع |
| **📦 Docker** | جاهز للتشغيل الفوري على أي سيرفر |
| **🔄 طابور مهام** | BullMQ + Redis لإدارة العمليات بدون ازدواجية |
| **📊 متتبع Quota** | سقف آمن 9,500/10,000 unit — يراعي حدود YouTube API |
| **📱 إشعارات Telegram** | تقارير يومية عن النجاح والفشل + تحليلات |
| **🧹 تنظيف تلقائي** | يحذف الملفات المؤقتة لتوفير المساحة |
| **💾 استهلاك خفيف** | يعمل على VPS بذاكرة 1-2GB RAM (~475MB RAM للتوليد) |

---

## 🛠️ التقنيات المستخدمة

<div align="center">

| التقنية | الاستخدام |
|---------|-----------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20" height="20"> **TypeScript** | لغة البرمجة الأساسية |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="20" height="20"> **Node.js** | بيئة التشغيل |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="20" height="20"> **PostgreSQL** | قاعدة البيانات |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="20" height="20"> **Redis** | طابور المهام + التخزين المؤقت |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="20" height="20"> **Docker** | حاويات النشر |
| <img src="https://img.icons8.com/color/48/null/youtube-play.png" width="20" height="20"> **YouTube API** | رفع الفيدوهات |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ffmpeg/ffmpeg-original.svg" width="20" height="20"> **FFmpeg** | توليف الفيديو والصوت |
| <img src="https://img.icons8.com/color/48/null/chatgpt.png" width="20" height="20"> **OpenRouter** | ذكاء اصطناعي مجاني (GPT-4o) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="20" height="20"> **Prisma** | إدارة قاعدة البيانات |
| **PM2** | إدارة العمليات في الإنتاج |

</div>

---

## 📸 معاينة المحتوى

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://via.placeholder.com/200x356/1a0a2e/FFD700?text=Short+1" width="200" alt="Short Example">
        <br><sub>شورت 1 — آية البقرة</sub>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/200x356/0a1628/E8E8E8?text=Short+2" width="200" alt="Short Example">
        <br><sub>شورت 2 — آية الكرسي</sub>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/200x356/1a2a1a/FFD700?text=Short+3" width="200" alt="Short Example">
        <br><sub>شورت 3 — سورة يس</sub>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/200x356/2e1a0a/E8E8E8?text=Short+4" width="200" alt="Short Example">
        <br><sub>شورت 4 — سورة الرحمن</sub>
      </td>
    </tr>
  </table>

  **مثال فيديو منشور:** [https://youtube.com/watch?v=ZgsbWF_XPPw](https://youtube.com/watch?v=ZgsbWF_XPPw)
</div>

---

## 🚀 البدء السريع (للمطورين)

### المتطلبات

| المتطلب | النسخة | رابط التحميل |
|---------|--------|-------------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| PostgreSQL | ≥ 14 | [postgresql.org](https://postgresql.org) |
| Redis | ≥ 6 | [redis.io](https://redis.io) |
| FFmpeg | ≥ 4 | [ffmpeg.org](https://ffmpeg.org) |
| Docker (اختياري) | ≥ 24 | [docker.com](https://docker.com) |

### التشغيل المحلي

```bash
# 1. استنساخ المشروع
git clone https://github.com/GetWibix/quran-pipeline.git
cd quran-pipeline

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد ملف البيئة
cp .env.example .env

# 4. إنشاء قاعدة البيانات
sudo -u postgres createdb quran_pipeline

# 5. تشغيل التهجير (migrations)
npx prisma migrate dev --name init

# 6. بناء المشروع
npm run build

# 7. تشغيل النظام
pm2 start ecosystem.config.js
```

### التشغيل عبر Docker

```bash
# 1. تأكد من تثبيت Docker
docker --version

# 2. انسخ ملف البيئة
cp .env.example .env

# 3. شغّل النظام كامل
docker compose up -d --build

# 4. تابع السجلات
docker compose logs -f worker
docker compose logs -f app
```

---

## 🌐 النشر على السيرفر (VPS)

### السيرفر الموصى به

| المواصفة | الحد الأدنى | الموصى به |
|---------|------------|-----------|
| **RAM** | 1 GB | 2 GB |
| **CPU** | 1 Core | 2 Cores |
| **Storage** | 10 GB | 20 GB |
| **OS** | Ubuntu 22.04 | Ubuntu 24.04 |
| **السعر** | ~$5/شهر | ~$10/شهر |

### خطوات النشر

<details>
<summary>🖥️ اضغط لتوسيع خطوات النشر على VPS</summary>

#### 1. الاتصال بالسيرفر
```bash
ssh user@your-server-ip
```

#### 2. تشغيل سكريبت التجهيز
```bash
cd /var/www/quran-pipeline
chmod +x setup.sh
./setup.sh
```

#### 3. إعداد المتغيرات
```bash
cp .env.example .env
nano .env
```

#### 4. إنشاء قاعدة بيانات
```bash
sudo -u postgres createdb quran_pipeline
```

#### 5. تشغيل Docker
```bash
docker compose up -d --build
```

#### 6. فتح المنافذ (إن لزم)
```bash
sudo ufw allow 5432  # PostgreSQL
sudo ufw allow 6379  # Redis
```

</details>

---

## ⚙️ الإعدادات

### 1. حساب YouTube API

<details>
<summary>📺 اضغط لتوسيع خطوات إنشاء حساب YouTube API</summary>

#### 1. افتح Google Cloud Console
  - رابط: https://console.cloud.google.com
  - أنشئ مشروع جديد أو استخدم مشروع موجود

  <img src="https://i.imgur.com/pX7Qj9B.png" width="600" alt="Google Cloud Console">

#### 2. فعّل YouTube Data API v3
  - اذهب إلى `APIs & Services` > `Library`
  - ابحث عن "YouTube Data API v3"
  - اضغط `Enable`

  <img src="https://i.imgur.com/mzwXhIM.png" width="600" alt="Enable YouTube API">

#### 3. أنشئ OAuth Credentials
  - اذهب إلى `APIs & Services` > `Credentials`
  - اضغط `Create Credentials` > `OAuth Client ID`
  - اختر **Desktop application**
  - انسخ **Client ID** و **Client Secret**

  <img src="https://i.imgur.com/6n0nMFU.png" width="600" alt="OAuth Credentials">

#### 4. ضع القيم في ملف `.env`
```
YT_CLIENT_ID="your-client-id.apps.googleusercontent.com"
YT_CLIENT_SECRET="your-client-secret"
```

#### 5. احصل على Refresh Token
```bash
npm run get-refresh-token
```
- افتح الرابط في المتصفح
- سجل الدخول بحساب اليوتيوب
- وافق على الصلاحيات
- انسخ الـ code والصقه في الطرفية

<img src="https://i.imgur.com/yh2nFwG.png" width="600" alt="OAuth Consent">

</details>

### 2. مفتاح OpenRouter (AI مجاني)

<details>
<summary>🤖 اضغط لتوسيع خطوات الحصول على مفتاح AI مجاني</summary>

1. افتح https://openrouter.ai/keys
2. سجل الدخول بحساب Google
3. اضغط `Create Key`
4. انسخ المفتاح وضعه في `.env`:
```
OPENROUTER_API_KEY="sk-or-v1-..."
```

**الموديلات المجانية المستخدمة:**
- `openai/gpt-oss-120b:free`
- `nvidia/nemotron-3-ultra-550b-a55b:free`
- `nex-agi/nex-n2-pro:free`
- `poolside/laguna-m.1:free`

> النظام يجرب الموديلات بالترتيب — إذا فشل أول واحد ينتقل للتالي تلقائياً.

</details>

### 3. قاعدة البيانات

<details>
<summary>🗄️ اضغط لتوسيع خطوات إعداد PostgreSQL</summary>

```bash
# إنشاء مستخدم جديد
sudo -u postgres createuser --no-superuser --no-createrole --createdb quran_user

# تعيين كلمة سر
sudo -u postgres psql -c "ALTER USER quran_user PASSWORD 'your_strong_password';"

# إنشاء قاعدة البيانات
sudo -u postgres createdb --owner=quran_user quran_pipeline

# تعديل .env
DATABASE_URL="postgresql://quran_user:your_strong_password@localhost:5432/quran_pipeline"
```

</details>

### 4. إشعارات Telegram (اختياري)

<details>
<summary>📱 اضغط لتوسيع خطوات إعداد Telegram</summary>

1. افتح [@BotFather](https://t.me/BotFather)
2. أرسل `/newbot` → اختر اسماً → احصل على التوكن
3. ابدأ محادثة مع البوت الجديد
4. افتح الرابط:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
5. أرسل رسالة للبوت، ثم حدث الصفحة
6. خذ رقم `chat_id` من الرد
7. ضع القيم في `.env`:
```
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

</details>

### 5. ملف `.env`

```env
# قاعدة البيانات
DATABASE_URL="postgresql://quran_user:password@localhost:5432/quran_pipeline"

# Redis
REDIS_URL="redis://localhost:6379"

# YouTube API
YT_CLIENT_ID="xxxxx.apps.googleusercontent.com"
YT_CLIENT_SECRET="xxxxx"
YT_REFRESH_TOKEN="1//xxxxxxxx"

# OpenRouter (AI مجاني)
OPENROUTER_API_KEY="sk-or-v1-xxxxx"

# Telegram (اختياري)
TELEGRAM_BOT_TOKEN="xxxxx:xxxxx"
TELEGRAM_CHAT_ID="xxxxx"
```

---

## 🎯 كيف يعمل النظام؟

<div align="center">
  
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Scheduler       │────▶│  Queue (BullMQ)  │────▶│  Worker                 │
│  (cron jobs)     │     │  + Redis         │     │  (concurrency 1)        │
│  ├ Short 8:00    │     └──────────────────┘     │  ├ اختيار قارئ (وزني)   │
│  ├ Short 16:00   │                              │  ├ Content Pipeline      │
│  ├ Long الجمعة   │                              │  ├ AI Metadata          │
│  ├ فحص تفاعل     │                              │  └ YouTube Publish      │
│  └ Stats 22:30   │                              └──────────┬──────────────┘
└─────────────────┘                                         │
                    ┌────────────────────────────────────────┼──────────────────────────┐
                    ▼                                        ▼                          ▼
        ┌──────────────────────────┐             ┌──────────────────────┐  ┌────────────────────────┐
        │  Content Pipeline        │             │  Decision Agent      │  │  Stats Collector       │
        │  ├ AI Verse Selector     │             │  ├ OpenRouter Title  │  │  ├ YouTube Analytics   │
        │  ├ Verse Fetch           │             │  ├ Description+Tags  │  │  ├ تحليل أوقات النشر   │
        │  ├ Audio Download        │             │  └ أوقات ديناميكية   │  │  └ تحديث تلقائي        │
        │  ├ Visual Compose (شفاف) │             └──────────────────────┘  └────────────────────────┘
        │  └ Video Render (خلفيات) │                                         ┌──────────────────────┐
        └──────────────────────────┘                                         │  Notifier (Telegram) │
                                                                              └──────────────────────┘
```

</div>

### سكربتات المساعدة

```bash
# معاينة سريعة (بدون قاعدة بيانات ولا AI)
npm run preview -- --surah 1 --from 1 --to 3

# اختبار شامل حتى النشر (AI + DB + فيديو، بدون رفع ليوتيوب)
npm run e2e
# أو:
node dist/scripts/e2eTest.js --type SHORT --reciter maher

# الحصول على توين يوتيوب
npm run get-refresh-token
```

### دورة العمل (Job Cycle)

1. **⏰ Scheduler** يشغّل cron jobs في أوقات محددة:
   - `8:00` — Short الصباح | `16:00` — Short المساء
   - `الجمعة 14:00` — فيديو طويل أسبوعي
   - `20:00` — فحص التفاعل (هل نزيد Short إضافي؟)
   - `22:30` — جمع إحصائيات يوتيوب + تحليل أوقات النشر
2. **📥 Queue** يضيف مهمة إلى BullMQ (Redis)
3. **🤖 Worker** يستقبل المهمة ويبدأ التوليد:
   - **🎙️ اختيار قارئ** (وزني: عبدالباسط 40%، العفاسي 30%، ...)
   - **🧠 AI** يختار آيات متناسبة (سورة 3 آية 15-16 مثلاً)
   - **📖 جلب النص** من alquran.cloud API
   - **🎵 تحميل الصوت** من EveryAyah.com (تسجيلات حقيقية)
   - **🖼️ رسم المشهد** (PNG شفاف — بدون خلفية ثابتة)
   - **🎞️ خلفية فيديو متحركة** (واحدة مختلفة لكل آية)
   - **🎬 توليف الفيديو** باستخدام FFmpeg
   - **🏷️ توليد وصف** عبر AI (عنوان + فوائد + هاشتاغات)
4. **📤 YouTube** رفع الفيديو (مع جدولة حسب أفضل وقت من التحليل)
5. **🧹 تنظيف** حذف الملفات المؤقتة — الفيديو يبقى في `assets/videos/`
6. **📲 إشعار** Telegram بالنجاح أو الفشل

---

## 📁 هيكل المشروع

```
quran-pipeline/
├── 📁 src/
│   ├── 📁 services/
│   │   ├── 📄 verseSelector.ts     # AI يختار الآيات
│   │   ├── 📄 verseFetcher.ts      # جلب النص من API
│   │   ├── 📄 audioFetcher.ts      # تحميل الصوت
│   │   ├── 📄 visualComposer.ts    # رسم المشاهد
│   │   ├── 📄 videoRenderer.ts     # توليف الفيديو
│   │   ├── 📄 contentPipeline.ts   # تنسيق الكل
│   │   ├── 📄 decisionAgent.ts     # AI للعنوان والوصف + أوقات ديناميكية
│   │   ├── 📄 statsCollector.ts    # سحب إحصائيات يوتيوب + تحليل أوقات النشر
│   │   ├── 📄 youtubePublisher.ts  # رفع ليوتيوب
│   │   ├── 📄 quotaTracker.ts      # متتبع الحصة (سقف 9,500)
│   │   └── 📄 notifier.ts          # إشعارات Telegram
│   ├── 📁 queue/
│   │   ├── 📄 queue.ts             # BullMQ Queue
│   │   └── 📄 worker.ts            # معالج المهام (اختيار قارئ وزني)
│   ├── 📁 scripts/
│   │   ├── 📄 getRefreshToken.ts   # الحصول على توكن يوتيوب
│   │   ├── 📄 previewVideo.ts      # معاينة سريعة لفيديو (بدون DB/AI)
│   │   └── 📄 e2eTest.ts           # اختبار شامل حتى النشر (بدون رفع)
│   └── 📄 scheduler.ts             # Cron jobs + Stats collection
├── 📁 prisma/
│   └── 📄 schema.prisma           # نموذج قاعدة البيانات
├── 📁 assets/
│   ├── 📁 fonts/                   # خطوط عربية
│   ├── 📁 backgrounds/             # خلفيات فيديو/صور
│   └── 📁 videos/                  # الفيديوهات المنتجة
├── 📄 Dockerfile                   # بناء Docker
├── 📄 docker-compose.yml           # تشغيل Docker متكامل
├── 📄 setup.sh                     # تجهيز السيرفر
├── 📄 ecosystem.config.js          # إدارة PM2
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 .env.example
```

---

## 📜 الترخيص

<div align="center">

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              رخصة المشروع — لوجه الله تعالى
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅  يمكنك:
  • استخدام المشروع لأي غرض خيري أو ديني
  • تعديل الكود وتطويره
  • مشاركته مع الآخرين

  ❌  لا يمكنك:
  • بيع المشروع أو أي جزء منه
  • استخدامه في منتجات تجارية مدفوعة
  • إزالة حقوق المطور من الملفات

  🤲  هذا العمل خالص لوجه الله تعالى
  ❤️  ادعُ لأهله بالرحمة والمغفرة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</div>

---

## 🤝 الدعم والتبرع

<div align="center">
  <p>
    هذا المشروع <b>مجاني بالكامل</b> ومفتوح المصدر — لا يُباع ولا يُشترى.
  </p>
  <p>
    إذا أردت دعمنا <b>للاستمرار في نشر الخير</b>:
  </p>
  <p>
    <a href="https://paypal.me/Bosamalive">
      <img src="https://img.shields.io/badge/دعم_عبر-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal">
    </a>
  </p>
  <p>
    <sub>⚠️ التبرع اختياري بالكامل — المشروع مستمر بخدمة القرآن مجاناً دائماً إن شاء الله</sub>
  </p>
</div>

---

## 📞 التواصل

<div align="center">
  <p>
    <b>المطور:</b> <a href="https://waxbix.com">waxbix.com</a>
  </p>
  <p>
    📧 <b>البريد الإلكتروني:</b>
    <a href="mailto:contact@waxbix.com">contact@waxbix.com</a>
  </p>
  <p>
    للاستفسارات، الاقتراحات، أو الإبلاغ عن مشكلة — لا تتردد في التواصل.
  </p>
</div>

---

<div align="center">
  <p>
    <sub>
      تم التطوير بواسطة <a href="https://waxbix.com"><b>waxbix.com</b></a>
      <br>
      🕌 {وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ} 🕌
    </sub>
  </p>
  <p>
    <img src="https://img.shields.io/github/last-commit/waxbix/quran-pipeline?style=flat-square&label=آخر_تحديث" alt="Last Commit">
    <img src="https://img.shields.io/github/repo-size/waxbix/quran-pipeline?style=flat-square&label=حجم_المشروع" alt="Repo Size">
    <img src="https://img.shields.io/github/commit-activity/m/waxbix/quran-pipeline?style=flat-square&label=النشاط" alt="Commit Activity">
  </p>
</div>

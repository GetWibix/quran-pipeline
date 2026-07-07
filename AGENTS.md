# مطور هذا المشروع

## عني
- Full-stack developer، Node.js/TypeScript
- أبناء أنظمة أتمتة ومنصات ويب متكاملة

## Stack الخاص بي
- Backend: Node.js/Express 4، TypeScript، Prisma، PostgreSQL، Redis
- Frontend: Next.js 16، Tailwind CSS، shadcn/ui
- AI: OpenRouter، Google Gemini
- Media: FFmpeg، Sharp، node-canvas
- DevOps: Docker، PM2، Nginx

## أسلوب العمل
- أكتب TypeScript فقط
- لا أضيف comments في الكود
- لا أستخدم any
- API responses: `{ success: true, data, message }`
- Pagination: `{ data, pagination: { page, limit, total } }`
- كل الأخطاء عبر AppError + global handler

## تفضيلاتي في المحادثة
- أجب بالعربية
- كن مباشراً بدون مقدمات
- إذا في خطأ، قله فوراً
- اشرح باختصار

## مشاريعي
- quran-pipeline: أتمتة فيديوهات قرآنية
- Zizanammas: منصة جمعية ثقافية

## ملاحظات تقنية (quran-pipeline)
- PM2: استخدم `exec_mode: "fork"` — cluster mode يعلق BullMQ Worker
- Facebook: `scheduled_publish_time` لازم مع `published: "false"` + `unpublished_content_type: "SCHEDULED"` (بدون `published: "false"` يرجع خطأ)
- Facebook: لا ترسل `scheduled_publish_time` إذا وقت النشر قريب (<15 دقيقة)
- R2: إذا placeholders, علّقهم في .env عشان `isConfigured()` ترجع false
- `isScheduled` لازم يكون قبل `publishToAllPlatforms` (TS error لو استعملته قبل تعريفه)

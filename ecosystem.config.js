/**
 * ecosystem.config.js
 * تكوين PM2 لتشغيل المشروع كامل على VPS — عمليتين مستقلتين:
 * 1. quran-worker: كيعالج jobs توليد المحتوى (concurrency: 1، استهلاك موارد عند الطلب فقط)
 * 2. quran-scheduler: خفيف جداً، دايماً نائم، كيفعّل cron jobs فقط
 *
 * تشغيل: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: "quran-worker",
      script: "dist/queue/worker.js",
      instances: 1, // ⚠️ لا تستخدم "max" أو cluster mode هنا — concurrency: 1 إلزامية
      autorestart: true,
      max_memory_restart: "800M", // إعادة تشغيل احتياطية إذا تسرب ذاكرة (VPS صغير)
      env: { NODE_ENV: "production" },
    },
    {
      name: "quran-scheduler",
      script: "dist/scheduler.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "150M", // خفيف جداً، فقط cron triggers
      env: { NODE_ENV: "production" },
    },
  ],
};

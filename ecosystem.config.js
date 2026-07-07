/**
 * ecosystem.config.js
 * تكوين PM2 لتشغيل المشروع كامل على VPS — 3 عمليات مستقلة:
 * 1. quran-worker: كيعالج jobs توليد المحتوى (concurrency: 1، استهلاك موارد عند الطلب فقط)
 * 2. quran-scheduler: خفيف جداً، دايماً نائم، كيفعّل cron jobs فقط
 * 3. quran-file-server: خفيف جداً، يخدم ملفات الفيديو للمنصات اللي تحتاج رابط عام
 *
 * تشغيل: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: "quran-worker",
      script: "dist/queue/worker.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "800M",
      env: { NODE_ENV: "production" },
    },
    {
      name: "quran-scheduler",
      script: "dist/scheduler.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "150M",
      env: { NODE_ENV: "production" },
    },
  ],
};

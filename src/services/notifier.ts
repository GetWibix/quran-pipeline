/**
 * notifier.ts
 * كيبعت تقرير عبر Telegram Bot بعد كل عملية نشر (نجاح أو فشل)
 * نفس الأسلوب اللي استخدمتيه فـ Waxbix Nexus
 *
 * متطلبات (env vars):
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID (الـ chat اللي غادي تستقبل فيه التقارير)
 */

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.error("TELEGRAM_CHAT_ID غير محدد — تم تجاوز الإشعار");
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      console.error("فشل إرسال إشعار Telegram:", await res.text());
    }
  } catch (err) {
    // فشل الإشعار ماشي خطأ قاتل للـ pipeline — فقط نسجلو فالـ console
    console.error("خطأ شبكة وقت إرسال إشعار Telegram:", err);
  }
}

export async function notifyPublishSuccess(params: {
  title: string;
  videoUrl: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  contentType: string;
  scheduledAt?: string;
  extraPlatforms?: string;
}): Promise<void> {
  const scheduleInfo = params.scheduledAt
    ? `🕐 مجدول لـ: ${new Date(params.scheduledAt).toLocaleString("ar-MA")}`
    : "✅ تم النشر فوراً";

  const extraInfo = params.extraPlatforms ? `\n${params.extraPlatforms}` : "";

  const text = `
✅ <b>تم نشر محتوى جديد</b>

📖 ${params.surahName} (آية ${params.fromAyah}-${params.toAyah})
🎬 النوع: ${params.contentType === "SHORT" ? "Short" : "فيديو طويل"}
📝 العنوان: ${params.title}
🔗 ${params.videoUrl}
${scheduleInfo}${extraInfo}
`.trim();

  await sendTelegramMessage(text);
}

export async function notifyPublishFailure(params: {
  step: string;
  error: string;
  contentType?: string;
}): Promise<void> {
  const text = `
❌ <b>فشل فعملية النشر</b>

⚠️ الخطوة: ${params.step}
📋 نوع المحتوى: ${params.contentType ?? "غير محدد"}
🔴 الخطأ: ${params.error}

يرجى المراجعة اليدوية.
`.trim();

  await sendTelegramMessage(text);
}

export async function notifyDailySummary(params: {
  publishedToday: number;
  quotaRemaining: number;
  extraContentTriggered: boolean;
}): Promise<void> {
  const text = `
📊 <b>ملخص اليوم</b>

📤 المنشور اليوم: ${params.publishedToday}
📈 Quota متبقية (رفعات تقريبية): ${params.quotaRemaining}
🤖 محتوى إضافي بسبب التفاعل: ${params.extraContentTriggered ? "نعم" : "لا"}
`.trim();

  await sendTelegramMessage(text);
}

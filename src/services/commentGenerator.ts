import OpenAI from "openai";
import { getFreeModels } from "./modelRegistry";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/quran-pipeline",
    "X-Title": "Quran Pipeline",
  },
});

const FALLBACK_COMMENTS = [
  "اللهم اجعل هذه التلاوة نوراً في قلوبنا وشفاءً لصدورنا 🤲 شاركنا الأجر مع غيرك 💚",
  "سبحان الله.. آية تتلى وقلب يخشع. ادعو لنا وشارك الفيديو لتعم الفائدة 🕊️",
  "لا تنسوا مشاركة هذا الفيديو مع أحبابكم لتعم البركة 🤲 جعلها الله في ميزان حسناتكم",
  "اللهم اجعل القرآن ربيع قلوبنا ونور صدورنا 🌙 انشر تؤجر 🤲",
  "ذكر الله يطمئن القلوب 💚 شارك مع من تحب لتعم الطمأنينة",
  "ما أجمل كلام الله! تأمل في معاني هذه الآيات ودعنا نعرف أيها أثّر فيك 🖋️",
  "آيات تتلى وقلوب تخشع 🤲 سبحان الله العظيم",
  "اللهم ارزقنا تدبر القرآن والعمل به 🤲",
];

export async function generateComment(
  title: string,
  surahName: string,
  fromAyah: number,
  toAyah: number,
): Promise<string> {
  const models = getFreeModels();

  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `أنت مسلم متحمس تنشر محتوى قرآنياً على يوتيوب.
اكتب تعليقاً قصيراً وجذاباً (جملة إلى جملتين) على الفيديو التالي.
اجعل التعليق متنوعاً: مرة تشجيع على التدبر، مرة دعاء، مرة تأمل في الآيات.
لا تكرر نفس الأسلوب دائماً.
اكتب التعليق فقط بالعربية الفصحى أو العامية الخفيفة.
لا تستخدم علامات تنصيص.`,
          },
          {
            role: "user",
            content: `عنوان الفيديو: ${title}
السورة: ${surahName} (${fromAyah}-${toAyah})
اكتب تعليقاً مناسباً:`,
          },
        ],
        max_tokens: 60,
        temperature: 0.9,
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text && text.length > 5) return text;
    } catch {
      continue;
    }
  }

  return FALLBACK_COMMENTS[Math.floor(Math.random() * FALLBACK_COMMENTS.length)];
}

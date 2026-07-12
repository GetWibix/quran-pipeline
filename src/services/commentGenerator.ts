import { Mistral } from "@mistralai/mistralai";
import { getFreeModels } from "./modelRegistry";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
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

const PROMPT_KEYWORDS = [
  "اكتب تعليقاً", "تعليقاً مناسباً", "عنوان الفيديو", "السورة:",
  "system", "user:", "assistant:", "أنت مسلم",
];

const ARABIC_REGEX = /[\u0600-\u06FF]/;

function isValidComment(text: string, title: string, surahName: string): boolean {
  if (text.length < 10 || text.length > 300) return false;
  const arabicCount = (text.match(ARABIC_REGEX) || []).length;
  if (arabicCount < text.length * 0.3) return false;
  if (text.includes(title) || text.includes(surahName)) return false;
  for (const keyword of PROMPT_KEYWORDS) {
    if (text.includes(keyword)) return false;
  }
  return true;
}

export async function generateComment(
  title: string,
  surahName: string,
  fromAyah: number,
  toAyah: number,
): Promise<string> {
  const models = getFreeModels();

  for (const model of models) {
    try {
      const response = await mistral.chat.complete({
        model,
        messages: [
          {
            role: "system",
            content: "Write 1 short Arabic dua (supplication) for this Quran video. No list. Just the dua.",
          },
          {
            role: "user",
            content: `سورة ${surahName} ${fromAyah}-${toAyah}`,
          },
        ],
        maxTokens: 100,
        temperature: 0.9,
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const text = typeof rawContent === "string" ? rawContent.trim() : "";
      if (isValidComment(text, title, surahName)) return text;
    } catch {
      continue;
    }
  }

  return FALLBACK_COMMENTS[Math.floor(Math.random() * FALLBACK_COMMENTS.length)];
}

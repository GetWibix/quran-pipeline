import OpenAI from "openai";
import { getFreeModels } from "./modelRegistry";
import { SITE_LINK_SHORT} from "../site";

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
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `اكتب تعليقاً قصيراً وجذاباً (جملة إلى جملتين) بالفصحى على هذا الفيديو القرآني. تنوع بين دعاء، تشجيع على التدبر، أو تأمل.`,
          },
          {
            role: "user",
            content: `السورة: ${surahName} (${fromAyah}-${toAyah})
التعليق:`,
          },
        ],
        max_tokens: 60,
        temperature: 0.9,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";
      if (isValidComment(text, title, surahName)) return text + SITE_LINK_SHORT;
    } catch {
      continue;
    }
  }

  return FALLBACK_COMMENTS[Math.floor(Math.random() * FALLBACK_COMMENTS.length)] + SITE_LINK_SHORT;
}

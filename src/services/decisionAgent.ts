/**
 * decisionAgent.ts
 * "العقل" ديال النظام: كيولّد العنوان/الوصف/الهاشتاغات عبر OpenRouter (موديلات مجانية)،
 * وكيقرر واش نزيدو محتوى إضافي اليوم بناءً على التفاعل (مع احترام صارم لـ Quota)
 *
 * كل قرار "إبداعي" (زيادة محتوى) كيتسجل فـ AgentDecisionLog للشفافية والتدقيق
 */

import OpenAI from "openai";
import { PrismaClient, ContentType } from "@prisma/client";
import { VerseData } from "./verseFetcher";
import { remainingVideoUploadsToday } from "./quotaTracker";
import { getFreeModels } from "./modelRegistry";

const prisma = new PrismaClient();
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/quran-pipeline",
    "X-Title": "Quran Pipeline",
  },
});

const FREE_MODELS = getFreeModels();

export interface GeneratedMetadata {
  title: string;
  description: string;
  tags: string[];
}

function buildDescription(
  aiDescription: string,
  reciterArabic: string,
  surahName: string,
  fromAyah: number,
  toAyah: number,
  combinedText: string,
  tags: string[],
  contentType: ContentType
): string {
  const hashtags = [...new Set(tags)]
    .filter(t => /^[\u0600-\u06FFa-zA-Z]+$/.test(t.replace(/_/g, "")))
    .slice(0, 15)
    .map(t => `#${t.startsWith("#") ? t.slice(1) : t}`)
    .join(" ");

  if (contentType === ContentType.POSTER) {
    return aiDescription;
  }

  return [
    aiDescription,
    "",
    `🎙️ القارئ: ${reciterArabic}`,
    `📖 السورة: ${surahName} (${fromAyah}-${toAyah})`,
    "",
    "📜 نص الآيات:",
    combinedText,
    "",
    "🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً",
    "",
    hashtags,
  ].join("\n");
}

function buildMessages(surahName: string, fromAyah: number, toAyah: number, combinedText: string, contentType: ContentType) {
  const isPoster = contentType === ContentType.POSTER;

  const systemContent = isPoster
    ? `أنت مساعد متخصص في إنتاج محتوى ديني لصفحة فيسبوك قرآنية.
المطلوب: caption مؤثر وجذاب لمنشور مصور (poster) فيه آيات قرآنية على خلفية جذابة.

ال caption خاص يكون:
- يعبر عن معنى الآيات بأسلوب بليغ وجذاب
- يلامس القلب ويحفز على التفاعل (مشاركة، حفظ، تدبر)
- محترم وليس clickbait
- ينتهي بدعوة للتفاعل (مثلاً: "شارك الآية لتكون في ميزان حسناتك")

الهاشتاغات خاصها تكون متنوعة (8-12 كلمة): عامة (#قرآن, #إسلام) ومتخصصة (#اسم_السورة, #الموضوع).
أجب فقط JSON صحيح بدون markdown.`
    : `أنت مساعد متخصص فإنتاج محتوى ديني محترم لقناة يوتيوب قرآنية.
ممنوع أي عنوان فيه exaggeration أو clickbait يخالف الاحترام الديني.

العنوان خاص يكون مؤثر عاطفياً ويلامس القلب — يستهدف المشاعر (طمأنينة، سكينة، راحة، خوف، رجاء، تذكير، أمل).
مثلاً بدل "سورة الملك بصوت فلان" → "تلاوة هادئة لسورة الملك.. تريح قلبك قبل النوم".
أو بدل "سورة البقرة" → "آيات تمنحك الأمن والبركة في حياتك".
تجنب الكلمات المتكررة النمطية، تميز بلمسة إنسانية واقعية.

الهاشتاغات خاصها تكون متعلقة بالقرآن/الإسلام/السورة المحددة (12-20 كلمة).
نوّع بين هاشتاغات عامة (#قرآن_كريم, #تلاوة, #اسلام) ومتخصصة (#اسم_السورة, #رقم_الآية, #الموضوع).
أجب فقط JSON صحيح بدون أي markdown.`;

  const userContent = isPoster
    ? `السورة: ${surahName}، الآيات من ${fromAyah} إلى ${toAyah}
نص الآيات: "${combinedText}"
نوع المحتوى: منشور مصور (بوستر) فيسبوكي

أعطني JSON:
{
  "title": "ملخص جذاب للآيات (أقل من 50 حرف)",
  "description": "caption مؤثر وجذاب للمنشور (فقرة قصيرة)",
  "tags": ["هاشتاغ1", "هاشتاغ2", "..."]
}`
    : `السورة: ${surahName}، الآيات من ${fromAyah} إلى ${toAyah}
نص الآيات: "${combinedText}"
نوع المحتوى: ${contentType === ContentType.SHORT ? "Short (فيديو قصير)" : "فيديو طويل"}

أعطني JSON:
{
  "title": "عنوان مؤثر عاطفياً أقل من 70 حرف",
  "description": "فقرة واحدة تصف فوائد/عبر/دروس هذه الآيات (بدون قائمة، بدون إيموجي)",
  "tags": ["كلمة1", "كلمة2", "..."]
}`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}

function parseResponse(rawText: string, surahName: string, fromAyah: number, toAyah: number): { title: string; description: string; tags: string[] } {
  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as { title: string; description: string; tags: string[] };
  } catch {
    return {
      title: `سورة ${surahName} - الآيات ${fromAyah}-${toAyah}`,
      description: `تلاوة خاشعة لآيات من سورة ${surahName}`,
      tags: ["قرآن_كريم", "تلاوة", "اسلام", surahName, "دعاء", "خشوع", "تدبر", "القرآن"],
    };
  }
}

export async function generateMetadata(
  verses: VerseData[],
  contentType: ContentType,
  reciterArabic: string,
  reciterRaw: string
): Promise<GeneratedMetadata> {
  const surahName = verses[0].surahNameArabic;
  const fromAyah = verses[0].ayahNumber;
  const toAyah = verses[verses.length - 1].ayahNumber;
  const combinedText = verses.map((v) => v.textArabic).join(" ");
  const messages = buildMessages(surahName, fromAyah, toAyah, combinedText, contentType);

  let lastError: string | null = null;
  let aiTitle = `سورة ${surahName} - الآيات ${fromAyah}-${toAyah}`;
  let aiDescription = `تلاوة خاشعة لآيات من سورة ${surahName}`;
  let tags: string[] = ["قرآن_كريم", "تلاوة", surahName, "اسلام"];

  for (const model of FREE_MODELS) {
    try {
      const response = await client.chat.completions.create({ model, messages });
      const rawText = response.choices[0]?.message?.content?.trim() || "{}";
      const parsed = parseResponse(rawText, surahName, fromAyah, toAyah);
      aiTitle = parsed.title;
      aiDescription = parsed.description;
      tags = parsed.tags;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ الموديل ${model} فشل: ${lastError} — نجرب التالي`);
    }
  }

  if (lastError) {
    console.error("🚫 كل الموديلات المجانية فشلت، آخر خطأ:", lastError);
  }

  const description = buildDescription(aiDescription, reciterArabic, surahName, fromAyah, toAyah, combinedText, tags, contentType);

  return { title: aiTitle, description, tags };
}

export async function getNextOptimalPublishTime(contentType: ContentType): Promise<string> {
  const { getOptimalHours } = await import("./statsCollector");
  const optimal = await getOptimalHours();
  const hours = optimal[contentType];

  const now = new Date();
  const candidates = hours.map((h) => {
    const d = new Date(now);
    d.setUTCHours(h, 0, 0, 0);
    if (d <= now) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  });
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0].toISOString();
}

export async function shouldGenerateExtraContent(): Promise<{
  shouldGenerate: boolean;
  reasoning: string;
}> {
  const remainingUploads = await remainingVideoUploadsToday();
  if (remainingUploads <= 1) {
    const reasoning = "لا يوجد مجال كافي فالـ Quota اليوم — تم تأجيل أي زيادة لليوم الجاي";
    await logDecision("EXTRA_SHORT_TRIGGERED", reasoning, { remainingUploads });
    return { shouldGenerate: false, reasoning };
  }

  const recentContent = await prisma.publishedContent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  if (recentContent.length < 3) {
    const reasoning = "لا توجد بيانات تفاعل كافية بعد لاتخاذ قرار موثوق";
    await logDecision("EXTRA_SHORT_TRIGGERED", reasoning, {});
    return { shouldGenerate: false, reasoning };
  }

  const avgEngagement =
    recentContent.reduce((sum, c) => sum + c.engagementScore, 0) /
    recentContent.length;

  const ENGAGEMENT_THRESHOLD = 0.05;
  const shouldGenerate = avgEngagement >= ENGAGEMENT_THRESHOLD;

  const reasoning = shouldGenerate
    ? `متوسط التفاعل الأخير (${avgEngagement.toFixed(3)}) أعلى من العتبة (${ENGAGEMENT_THRESHOLD}) — تم تفعيل محتوى إضافي`
    : `متوسط التفاعل الأخير (${avgEngagement.toFixed(3)}) ضمن المعدل الطبيعي — لا حاجة لمحتوى إضافي اليوم`;

  await logDecision("EXTRA_SHORT_TRIGGERED", reasoning, {
    avgEngagement,
    remainingUploads,
  });

  return { shouldGenerate, reasoning };
}

async function logDecision(
  decisionType: string,
  reasoning: string,
  contextData: Record<string, unknown>
) {
  await prisma.agentDecisionLog.create({
    data: { decisionType, reasoning, contextData: contextData as any },
  });
}

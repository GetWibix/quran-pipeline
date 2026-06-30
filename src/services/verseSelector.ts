/**
 * verseSelector.ts
 * كيقرر شنو الآيات اللي غادي نولّدو محتوى ليها — يستعمل الذكاء الاصطناعي لاختيار
 * مقطع متنوع ومميز، مع الحفاظ على التقدم التسلسلي عموماً عبر القرآن.
 */

import OpenAI from "openai";
import { PrismaClient, ContentType } from "@prisma/client";
import { getSurahMeta, getVerse } from "./verseFetcher";

const prisma = new PrismaClient();
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/quran-pipeline",
    "X-Title": "Quran Pipeline",
  },
});

const TOTAL_SURAHS = 114;
const WINDOW_SIZE = 30;
const MAX_SHORT_SECONDS = 180;

export interface SelectedRange {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
}

const FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nex-agi/nex-n2-pro:free",
  "poolside/laguna-m.1:free",
];

async function aiSelectRange(
  currentSurah: number,
  currentAyah: number,
  surahMeta: { numberOfAyahs: number; nameArabic: string },
  contentType: ContentType
): Promise<{ fromAyah: number; toAyah: number } | null> {
  const windowEnd = Math.min(currentAyah + WINDOW_SIZE - 1, surahMeta.numberOfAyahs);

  // ذاكرة: نجيب آخر فيديو منشور باش يعرف AI شنو تم قبل
  const lastPublished = await prisma.publishedContent.findFirst({
    where: { status: "PUBLISHED", contentType },
    orderBy: { publishedAt: "desc" },
    select: { surahNumber: true, fromAyah: true, toAyah: true, title: true },
  });

  const sampleVerses: { ayah: number; text: string }[] = [];
  for (let i = currentAyah; i <= windowEnd; i++) {
    try {
      const v = await getVerse(currentSurah, i);
      sampleVerses.push({ ayah: i, text: v.textArabic.substring(0, 100) });
    } catch { break; }
  }

  if (sampleVerses.length === 0) return null;

  const versesList = sampleVerses.map(v => `${v.ayah}: ${v.text}`).join("\n");

  const maxVerses = contentType === "SHORT" ? 8 : 40;
  const durationHint = contentType === "SHORT"
    ? "Short (حتى 3 دقائق = 180 ثانية، اختر 2-8 آيات)"
    : "فيديو طويل";

  const memoryHint = lastPublished
    ? `آخر مقطع نشرناه: سورة ${lastPublished.surahNumber} آية ${lastPublished.fromAyah}-${lastPublished.toAyah} بعنوان "${lastPublished.title}". اختر آيات مختلفة ومتنوعة.`
    : "هذا أول مقطع، ابدأ بأي آية مناسبة.";

  const messages = [
    {
      role: "system" as const,
      content: `أنت خبير قرآن تختار آيات لمقاطع يوتيوب.
اختر 2-8 آيات متتالية من القائمة تشكل معنى متماسكاً وجذاباً.
تنوّع في اختياراتك: مرة آية عذاب، مرة رحمة، مرة أحكام، مرة قصص، إلخ.
يجب أن يكون المقطع مختلفاً عن المقطع السابق.
أجب فقط JSON:
{"fromAyah": رقم, "toAyah": رقم}`,
    },
    {
      role: "user" as const,
      content: `${memoryHint}
السورة: ${surahMeta.nameArabic} (${currentSurah})
الآيات المتاحة من ${currentAyah} إلى ${windowEnd}:
${versesList}
اختر مقطعاً مناسباً لـ ${durationHint}.`,
    },
  ];

  for (const model of FREE_MODELS) {
    try {
      const resp = await client.chat.completions.create({ model, messages });
      const text = (resp.choices[0]?.message?.content ?? "").replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(text);
      const f = Math.max(currentAyah, parsed.fromAyah ?? currentAyah);
      const t = Math.min(parsed.toAyah ?? f, surahMeta.numberOfAyahs);
      return { fromAyah: f, toAyah: Math.max(f, t) };
    } catch { continue; }
  }
  return null;
}

export async function selectNextRange(
  contentType: ContentType
): Promise<SelectedRange> {
  const progress = await prisma.readingProgress.upsert({
    where: { contentType },
    create: { contentType, currentSurah: 1, currentAyah: 1 },
    update: {},
  });

  let { currentSurah, currentAyah } = progress;
  const surahMeta = await getSurahMeta(currentSurah);

  let fromAyah = currentAyah;
  let toAyah: number;

  if (contentType === ContentType.SHORT) {
    const aiChoice = await aiSelectRange(currentSurah, currentAyah, surahMeta, contentType);
    if (aiChoice) {
      fromAyah = aiChoice.fromAyah;
      toAyah = aiChoice.toAyah;
    } else {
      toAyah = Math.min(currentAyah + 1, surahMeta.numberOfAyahs);
    }
  } else if (contentType === ContentType.POSTER) {
    const remaining = surahMeta.numberOfAyahs - currentAyah + 1;
    toAyah = remaining <= 7 ? surahMeta.numberOfAyahs : Math.min(currentAyah + 6, surahMeta.numberOfAyahs);
  } else {
    const remainingInSurah = surahMeta.numberOfAyahs - currentAyah + 1;
    toAyah =
      remainingInSurah <= 40
        ? surahMeta.numberOfAyahs
        : currentAyah + 29;
  }

  const selected: SelectedRange = { surahNumber: currentSurah, fromAyah, toAyah };

  let nextSurah = currentSurah;
  let nextAyah = toAyah + 1;

  if (nextAyah > surahMeta.numberOfAyahs) {
    nextSurah = currentSurah >= TOTAL_SURAHS ? 1 : currentSurah + 1;
    nextAyah = 1;
  }

  await prisma.readingProgress.update({
    where: { contentType },
    data: { currentSurah: nextSurah, currentAyah: nextAyah },
  });

  return selected;
}

export async function getCurrentProgress(contentType: ContentType) {
  return prisma.readingProgress.findUnique({ where: { contentType } });
}

import { PrismaClient, ContentType } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// قوالب العناوين — 5 أنماط محترمة للمحتوى القرآني
// ممنوع: clickbait, مبالغة, كذب, تضليل
// ============================================================

export interface SeoInput {
  surahName: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciter: string;
  reciterArabic: string;
  contentType: ContentType;
  verseText: string;
  aiHook: string;
  aiDescription: string;
  aiTags: string[];
}

export interface SeoOutput {
  title: string;
  description: string;
  tags: string[];
  patternId: number;
}

interface TitlePattern {
  id: number;
  name: string;
  build: (input: SeoInput) => string;
  maxLength: number;
}

const TITLE_PATTERNS: TitlePattern[] = [
  {
    id: 1,
    name: "سورة + آيات + قارئ",
    maxLength: 70,
    build: (i) => {
      const base = `سورة ${i.surahName} | الآيات ${i.fromAyah}-${i.toAyah} | ${i.reciterArabic}`;
      return base.length > 70 ? `سورة ${i.surahName} ${i.fromAyah}-${i.toAyah} | ${i.reciterArabic}` : base;
    },
  },
  {
    id: 2,
    name: "نص الآية + سورة",
    maxLength: 70,
    build: (i) => {
      const firstWords = i.verseText.replace(/[\u0617-\u061A\u064B-\u0652]/g, "").substring(0, 40).trim();
      const base = `﴿${firstWords}...﴾ | سورة ${i.surahName}`;
      return base.length > 70 ? `سورة ${i.surahName} | ${i.reciterArabic}` : base;
    },
  },
  {
    id: 3,
    name: "تلاوة خاشعة + سورة",
    maxLength: 65,
    build: (i) => {
      return `تلاوة خاشعة | سورة ${i.surahName} | الآيات ${i.fromAyah}-${i.toAyah}`;
    },
  },
  {
    id: 4,
    name: "موضوعي + سورة",
    maxLength: 70,
    build: (i) => {
      const hook = i.aiHook.substring(0, 30).replace(/[^\u0600-\u06FF\s]/g, "").trim();
      if (hook.length < 5) return `سورة ${i.surahName} ${i.fromAyah}-${i.toAyah} | ${i.reciterArabic}`;
      return `${hook} | سورة ${i.surahName} | ${i.reciterArabic}`;
    },
  },
  {
    id: 5,
    name: "سورة + قارئ كلاسيك",
    maxLength: 65,
    build: (i) => {
      return `سورة ${i.surahName} | ${i.fromAyah}-${i.toAyah} | ${i.reciterArabic}`;
    },
  },
];

// ============================================================
// هاشتاغات هرمية — دقيقة ومناسبة للمحتوى الديني
// ============================================================

const LEVEL_1_TAGS = ["القرآن_الكريم", "تلاوة", "اسلام"];

const SURAH_TAG_MAP: Record<number, string[]> = {
  1: ["سورة_الفاتحة", "الفاتحة", "أم_الكتاب"],
  2: ["سورة_البقرة", "البقرة", "آية_الكرسي"],
  3: ["سورة_آل_عمران", "آل_عمران"],
  4: ["سورة_النساء", "النساء"],
  5: ["سورة_المائدة", "المائدة"],
  6: ["سورة_الأنعام", "الأنعام"],
  18: ["سورة_الكهف", "الكهف", "فتنة_المسيح_الدجال"],
  19: ["سورة_مريم", "مريم", "قصة_مريم"],
  36: ["سورة_يس", "يس", "قلب_القرآن"],
  55: ["سورة_الرحمن", "الرحمن", "آلاء_الله"],
  56: ["سورة_الواقعة", "الواقعة"],
  67: ["سورة_تبارك", "الملك", "تبارك"],
  78: ["سورة_النبأ", "النبأ", "عم_يتساءلون"],
  112: ["سورة_الإخلاص", "الإخلاص", "توحيد"],
  113: ["سورة_الفلق", "الفلق", "المعوذتان"],
  114: ["سورة_الناس", "الناس", "المعوذتان"],
};

const RECITER_TAG_MAP: Record<string, string[]> = {
  alafasy: ["مشاري_العفاسي", "العفاسي"],
  abdul_basit: ["عبدالباسط_عبدالصمد", "عبدالباسط"],
  ghamadi: ["سعد_الغامدي", "الغامدي"],
  maher: ["ماهر_المعيقلي", "المعيقلي", "الحرم_المكي"],
};

const VARIANT_TAGS = ["خشوع", "تدبر", "آيات_مكتوبة", "قرآن_مكتوب", "تفسير", "تلاوة_القرآن"];

function getTopicTags(input: SeoInput): string[] {
  const tags: string[] = [];
  const text = input.verseText.toLowerCase();

  const topicMap: [RegExp, string[]][] = [
    [/(رحم|غفر|عفا|توب)/, ["الرحمة", "المغفرة", "التوبة"]],
    [/(جنة|نعيم|فردوس)/, ["الجنة", "النعيم"]],
    [/(نار|جهنم|عذاب)/, ["الآخرة", "العذاب"]],
    [/(صبر|صابر)/, ["الصبر", "الاحتساب"]],
    [/(شكر|شاك)/, ["الشكر", "الحمد"]],
    [/(خلق|خلقنا|خالق)/, ["الخلق", "التوحيد"]],
    [/(نبي|رسول|مرسل)/, ["الأنبياء", "الرسل"]],
    [/(مؤمن|مسلم|صالح)/, ["المؤمنون", "الصالحين"]],
    [/(ظلم|فجار|كفر)/, ["الظلم", "الكفر"]],
    [/(ليل|نهار|شمس|قمر)/, ["آيات_الله", "الكون"]],
    [/(ماء|سحاب|مطر|ريح)/, ["آيات_الله", "الكون"]],
    [/(موت|حياة|بعث|نشر)/, ["الموت", "البعث", "الآخرة"]],
  ];

  for (const [regex, topicTags] of topicMap) {
    if (regex.test(text)) {
      tags.push(...topicTags);
    }
  }

  return [...new Set(tags)].slice(0, 6);
}

// ============================================================
// Description Builder
// ============================================================

function buildDescription(input: SeoInput, hashtags: string[]): string {
  const firstLine = input.aiHook.length > 10 ? input.aiHook : `تلاوة خاشعة لآيات من سورة ${input.surahName}`;
  const cta = "🔔 اشترك في القناة لتصلك تلاوات جديدة يومياً";

  const formattedTags = [...new Set(hashtags)]
    .filter((t) => /^[\u0600-\u06FFa-zA-Z]+$/.test(t.replace(/_/g, "")))
    .slice(0, 15)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .join(" ");

  return [
    firstLine,
    "",
    `🎙️ القارئ: ${input.reciterArabic}`,
    `📖 سورة ${input.surahName} (${input.fromAyah}-${input.toAyah})`,
    "",
    "📜 نص الآيات:",
    input.verseText,
    "",
    cta,
    "",
    formattedTags,
  ].join("\n");
}

// ============================================================
// الوظيفة الرئيسية
// ============================================================

export async function generateSeoMetadata(input: SeoInput): Promise<SeoOutput> {
  // 1. اختر أفضل نمط عنوان
  const patternId = await getBestPattern(input.contentType);

  // 2. بناء العنوان حسب النمط
  const title = TITLE_PATTERNS.find((p) => p.id === patternId)?.build(input)
    ?? TITLE_PATTERNS[0].build(input);

  // 3. بناء الهاشتاغات الهرمية
  const surahTags = SURAH_TAG_MAP[input.surahNumber] ?? [`سورة_${input.surahName}`, input.surahName];
  const reciterTags = RECITER_TAG_MAP[input.reciter] ?? [];
  const topicTags = getTopicTags(input);
  const variantTag = VARIANT_TAGS[Math.floor(Math.random() * VARIANT_TAGS.length)];

  const allTags = [
    ...LEVEL_1_TAGS,
    ...surahTags.slice(0, 3),
    ...reciterTags.slice(0, 2),
    ...topicTags.slice(0, 4),
    variantTag,
  ];

  const tags = [...new Set(allTags)].slice(0, 20);

  // 4. بناء الوصف
  const description = buildDescription(input, tags);

  return { title, description, tags, patternId };
}

// ============================================================
// Pattern Performance Learning
// ============================================================

async function getBestPattern(contentType: ContentType): Promise<number> {
  const patterns = await prisma.titlePatternPerformance.findMany({
    where: { contentType },
    orderBy: { sampleCount: "desc" },
  });

  // أقل من 5 عينات لكل نمط → دور عشوائي
  const totalSamples = patterns.reduce((s, p) => s + p.sampleCount, 0);
  if (totalSamples < 25) {
    const usedPatterns = patterns.map((p) => p.patternId);
    const available = TITLE_PATTERNS.filter((p) => !usedPatterns.includes(p.id));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)].id;
    }
  }

  // اختر النمط الأعلى أداءً (أو عشوائي إذا ما زال باكراً)
  const best = patterns.sort((a, b) => b.avgViews - a.avgViews)[0];
  if (best && best.sampleCount >= 5) {
    return best.patternId;
  }

  return Math.floor(Math.random() * TITLE_PATTERNS.length) + 1;
}

export async function recordPatternPerformance(
  patternId: number,
  contentType: ContentType,
  views: number
): Promise<void> {
  const existing = await prisma.titlePatternPerformance.findUnique({
    where: { patternId_contentType: { patternId, contentType } },
  });

  if (existing) {
    const newCount = existing.sampleCount + 1;
    const newAvg = (existing.avgViews * existing.sampleCount + views) / newCount;
    await prisma.titlePatternPerformance.update({
      where: { id: existing.id },
      data: { avgViews: newAvg, sampleCount: newCount, lastUsedAt: new Date(), lastAnalyzedAt: new Date() },
    });
  } else {
    await prisma.titlePatternPerformance.create({
      data: { patternId, contentType, avgViews: views, sampleCount: 1, lastUsedAt: new Date() },
    });
  }
}

export { TITLE_PATTERNS };

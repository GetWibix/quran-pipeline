/**
 * verseFetcher.ts
 * كيجلب نص الآية بالتشكيل + الترجمة من alquran.cloud API
 *
 * Docs: https://alquran.cloud/api
 * Endpoint pattern: GET /v1/ayah/{surah}:{ayah}/editions/{edition1},{edition2}
 *
 * Editions المفيدة لينا:
 * - quran-uthmani       => النص العربي بالتشكيل الكامل (رسم عثماني)
 * - fr.hamidullah       => ترجمة فرنسية (محمد حميد الله) - معتمدة بزاف
 * - en.sahih            => ترجمة إنجليزية (Saheeh International)
 */

const BASE_URL = "https://api.alquran.cloud/v1";

export interface VerseData {
  surahNumber: number;
  surahNameArabic: string;
  surahNameEnglish: string;
  ayahNumber: number; // رقم الآية داخل السورة
  ayahNumberInQuran: number; // الرقم التسلسلي فالقرآن كامل (1-6236)
  textArabic: string;
  translationFr?: string;
  translationEn?: string;
  numberOfAyahsInSurah: number;
}

interface AlQuranAyahResponse {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string; // اسم السورة بالعربية
    englishName: string;
    numberOfAyahs: number;
  };
}

interface AlQuranEditionsResponse {
  code: number;
  status: string;
  data: AlQuranAyahResponse[];
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * كيجيب آية واحدة محددة (سورة:آية) مع النص + الترجمات
 * مثال: getVerse(1, 1) => الفاتحة، الآية 1
 */
export async function getVerse(
  surahNumber: number,
  ayahNumber: number,
  attempt = 1
): Promise<VerseData> {
  const editions = "quran-uthmani,fr.hamidullah,en.sahih";
  const url = `${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/editions/${editions}`;

  const res = await fetch(url);
  if (res.status === 429 && attempt <= 5) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 15000);
    console.warn(`⏳ rate limit (429) للآية ${surahNumber}:${ayahNumber} — ننتظر ${delay}مس (محاولة ${attempt}/5)`);
    await sleep(delay + Math.random() * 1000);
    return getVerse(surahNumber, ayahNumber, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(
      `فشل جلب الآية ${surahNumber}:${ayahNumber} — HTTP ${res.status}`
    );
  }

  const json = (await res.json()) as AlQuranEditionsResponse;
  if (json.code !== 200 || !json.data || json.data.length === 0) {
    throw new Error(`رد غير متوقع من alquran.cloud: ${JSON.stringify(json)}`);
  }

  const arabicEdition = json.data.find((d) => d.text && /[\u0600-\u06FF]/.test(d.text));
  const frEdition = json.data.find((_, idx) => idx === 1); // fr.hamidullah
  const enEdition = json.data.find((_, idx) => idx === 2); // en.sahih

  if (!arabicEdition) {
    throw new Error("ماتلقاش النص العربي فالرد");
  }

  return {
    surahNumber: arabicEdition.surah.number,
    surahNameArabic: arabicEdition.surah.name,
    surahNameEnglish: arabicEdition.surah.englishName,
    ayahNumber: arabicEdition.numberInSurah,
    ayahNumberInQuran: arabicEdition.number,
    textArabic: arabicEdition.text,
    translationFr: frEdition?.text,
    translationEn: enEdition?.text,
    numberOfAyahsInSurah: arabicEdition.surah.numberOfAyahs,
  };
}

/**
 * كيجيب مجموعة آيات متتالية (مفيد لـ Shorts بآيتين/ثلاثة، أو فيديو طويل بسورة كاملة)
 */
export async function getVerseRange(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  concurrency = 5
): Promise<VerseData[]> {
  const ayahs: number[] = [];
  for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
    ayahs.push(ayah);
  }

  const results: VerseData[] = [];
  for (let i = 0; i < ayahs.length; i += concurrency) {
    const batch = ayahs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((ayah) => getVerse(surahNumber, ayah))
    );
    results.push(...batchResults);
    if (i + concurrency < ayahs.length) {
      await sleep(200);
    }
  }

  return results;
}

/**
 * كيرجع عدد آيات سورة معينة (مفيد لمعرفة أين تنتهي السورة)
 */
export async function getSurahMeta(surahNumber: number): Promise<{
  numberOfAyahs: number;
  nameArabic: string;
  nameEnglish: string;
}> {
  const url = `${BASE_URL}/surah/${surahNumber}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`فشل جلب بيانات السورة ${surahNumber}`);
  const json = await res.json() as { data: { numberOfAyahs: number; name: string; englishName: string } };
  return {
    numberOfAyahs: json.data.numberOfAyahs,
    nameArabic: json.data.name,
    nameEnglish: json.data.englishName,
  };
}

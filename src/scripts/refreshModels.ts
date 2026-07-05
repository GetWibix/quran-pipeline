/**
 * refreshModels.ts
 * يجلب كل الموديلات المجانية من OpenRouter، يختبر جودة كتابتها العربية،
 * ويحدّث models.json تلقائياً — يشغل يدوياً أو عبر cron (أسبوعياً)
 *
 * Usage: npx tsx src/scripts/refreshModels.ts
 */

import "dotenv/config";
import { ModelEntry, saveCache } from "../services/modelRegistry";

const API_KEY = process.env.OPENROUTER_API_KEY!;
const TEST_PROMPT = "اكتب جملة قصيرة عن القرآن الكريم بالعربية الفصحى.";
const TIMEOUT_MS = 25000;
const MAX_MODELS = 6;

interface OpenRouterModel {
  id: string;
}

async function fetchFreeModels(): Promise<string[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = (await res.json()) as { data: OpenRouterModel[] };
  return data.data
    .map((m) => m.id)
    .filter((id) => id.includes(":free"));
}

function scoreArabic(text: string): number {
  if (!text || text.length < 2) return 0;

  const arabicChars = text.match(/[\u0600-\u06FF\u0750-\u077F]/g);
  if (!arabicChars) return 0;

  const arabicRatio = arabicChars.length / text.length;
  if (arabicRatio < 0.3) return Math.round(arabicRatio * 50);

  const diacritics = text.match(/[\u064B-\u0652]/g);
  const diacriticBonus = diacritics ? Math.min(10, diacritics.length) : 0;

  const lengthScore = Math.min(30, text.length);

  const keywords = ["القرآن", "الله", "الإسلام", "الرحمن", "هدى", "نور", "بسم", "الحمد"];
  const keywordScore = keywords.filter((k) => text.includes(k)).length * 5;

  return Math.round(Math.min(100, arabicRatio * 30 + diacriticBonus + lengthScore + keywordScore));
}

async function testModel(model: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "أنت كاتب عربي فصيح." },
          { role: "user", content: TEST_PROMPT },
        ],
        max_tokens: 80,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    const data = (await res.json()) as any;
    if (data.error) return 0;

    const text = (data.choices?.[0]?.message?.content ?? "").trim();
    return scoreArabic(text);
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log("🔍 جلب قائمة الموديلات المجانية من OpenRouter...");
  const allFree = await fetchFreeModels();
  console.log(`📋 وجد ${allFree.length} موديل مجاني\n`);

  const results: { id: string; score: number }[] = [];

  for (let i = 0; i < allFree.length; i++) {
    const model = allFree[i];
    process.stdout.write(`  [${i + 1}/${allFree.length}] ${model.slice(0, 50)}... `);

    const score = await testModel(model);
    results.push({ id: model, score });

    if (score > 0) {
      console.log(`✅ ${score}/100`);
    } else {
      console.log("❌");
    }
  }

  const working = results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log(`\n📊 الموديلات العاملة: ${working.length}/${allFree.length}`);
  console.log(`\n🏆 أفضل الموديلات للعربية:\n`);

  const topModels: ModelEntry[] = working.slice(0, MAX_MODELS).map((m) => ({
    id: m.id,
    score: m.score,
    testedAt: new Date().toISOString(),
  }));

  topModels.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.id} (${m.score}/100)`);
  });

  saveCache(topModels);
  console.log(`\n✅ تم حفظ ${topModels.length} موديل في models.json`);

  if (working.length === 0) {
    console.warn("⚠️ كل الموديلات فشلت — models.json لم يتغير");
  }
}

main().catch((err) => {
  console.error("❌ فشل:", err.message);
  process.exit(1);
});

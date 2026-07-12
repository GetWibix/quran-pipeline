import "dotenv/config";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

const MODELS = [
  "mistral-large-latest",
  "mistral-medium-latest",
  "mistral-small-latest",
];

const TEST_PROMPT = "اكتب جملة قصيرة عن القرآن الكريم بالعربية الفصحى.";

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
  try {
    const resp = await mistral.chat.complete({
      model,
      messages: [
        { role: "system", content: "أنت كاتب عربي فصيح." },
        { role: "user", content: TEST_PROMPT },
      ],
      maxTokens: 80,
      temperature: 0.3,
    });

    const rawContent = resp.choices?.[0]?.message?.content;
    const text = typeof rawContent === "string" ? rawContent.trim() : "";
    return scoreArabic(text);
  } catch {
    return 0;
  }
}

async function main() {
  console.log("🔍 اختبار موديلات Mistral للعربية...\n");

  for (const model of MODELS) {
    process.stdout.write(`  ${model}... `);
    const score = await testModel(model);
    if (score > 0) {
      console.log(`✅ ${score}/100`);
    } else {
      console.log("❌");
    }
  }
}

main().catch((err) => {
  console.error("❌ فشل:", err.message);
  process.exit(1);
});

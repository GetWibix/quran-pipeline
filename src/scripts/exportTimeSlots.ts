/**
 * exportTimeSlots.ts
 * يصدر بيانات TimeSlotScore و AgentDecisionLog كـ SQL
 * لتشغيلها على قاعدة بيانات الإنتاج.
 *
 * الاستخدام:
 *   npx ts-node src/scripts/exportTimeSlots.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function esc(val: string): string {
  return val.replace(/'/g, "''");
}

async function main() {
  const slots = await prisma.timeSlotScore.findMany({
    orderBy: { performanceScore: "desc" },
  });
  const logs = await prisma.agentDecisionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const now = new Date().toISOString();

  process.stdout.write("-- ============================================\n");
  process.stdout.write("--  Quran Pipeline - بيانات أوقات النشر\n");
  process.stdout.write("--  أنشئت في: " + now + "\n");
  process.stdout.write("--  شغّل هاد SQL على قاعدة بيانات الإنتاج\n");
  process.stdout.write("-- ============================================\n\n");

  // ─── TimeSlotScore (ساعات + أيام) ─────────────────────────
  process.stdout.write("--  TimeSlotScore (أداء الأوقات)\n");
  process.stdout.write("TRUNCATE \"TimeSlotScore\" CASCADE;\n");

  for (const s of slots) {
    const score = Number(s.performanceScore).toFixed(6);
    const conf = Number(s.confidence).toFixed(4);
    const stmt =
      `INSERT INTO "TimeSlotScore" ` +
      `("id", "contentType", "hour", "minute", "performanceScore", "confidence", "sampleCount", "lastAnalyzedAt", "createdAt", "updatedAt") ` +
      `VALUES (` +
      `'${s.id}', '${s.contentType}', ${s.hour}, ${s.minute}, ` +
      `${score}, ${conf}, ${s.sampleCount}, ` +
      `NOW(), NOW(), NOW()` +
      `);`;
    process.stdout.write(stmt + "\n");
  }

  // ─── AgentDecisionLog (التوصية) ───────────────────────────
  process.stdout.write("\n--  AgentDecisionLog (التوصية)\n");
  for (const l of logs) {
    const reasoning = esc(l.reasoning);
    const contextJson = esc(JSON.stringify(l.contextData || {}));
    const stmt =
      `INSERT INTO "AgentDecisionLog" ` +
      `("id", "decisionType", "reasoning", "contextData", "createdAt") ` +
      `VALUES (` +
      `'${l.id}', '${esc(l.decisionType)}', '${reasoning}', '${contextJson}'::json, NOW()` +
      `);`;
    process.stdout.write(stmt + "\n");
  }

  // ─── تعليمات ─────────────────────────────────────────────
  process.stdout.write("\n-- ============================================\n");
  process.stdout.write("--  بعد تشغيل SQL، حدث .env في الإنتاج:\n");
  process.stdout.write("--    DEFAULT_PUBLISH_HOUR=14\n");
  process.stdout.write("--    DEFAULT_PUBLISH_MINUTE=0\n");
  process.stdout.write("-- ============================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ فشل:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

import "dotenv/config";
import {
  refreshFacebookToken,
  updateEnvInPlace,
  checkTokenHealth,
} from "../services/tokenRefresher";

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║  🔄 تحديث توكن فيسبوك التلقائي            ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  console.log("🔍 فحص صحة التوكن الحالي...");
  const health = await checkTokenHealth();
  console.log(`   النوع: ${health.type}`);
  console.log(`   صالح: ${health.isValid ? "✅" : "❌"}`);
  console.log(`   باقي: ${health.daysRemaining} يوم\n`);

  if (!health.shouldRefresh) {
    console.log("✅ التوكن لا يزال صالحاً — لا حاجة للتحديث");
    return;
  }

  if (!process.env.META_USER_ACCESS_TOKEN) {
    console.error("❌ META_USER_ACCESS_TOKEN غير موجود في .env");
    console.error("💡 أضف User Token (من Graph API Explorer) إلى .env:");
    console.error("   META_USER_ACCESS_TOKEN=\"EAAx...\"");
    process.exit(1);
  }

  console.log("🔄 تجديد التوكن عبر Facebook API...");
  const result = await refreshFacebookToken();
  console.log(`   ✅ User Token: محدث`);

  console.log("💾 حفظ في .env...");
  await updateEnvInPlace({
    META_USER_ACCESS_TOKEN: result.userToken,
    META_PAGE_ACCESS_TOKEN: result.pageToken,
  });

  const daysValid = Math.floor((result.userTokenExpiresAt - Date.now() / 1000) / 86400);
  console.log(`\n✅✅✅ تم التحديث بنجاح!`);
  console.log(`📅 صالح لمدة: ${daysValid} يوم`);
  console.log(`📘 الصفحة: ${process.env.META_PAGE_ID}`);
}

main().catch((err) => {
  console.error(`\n❌ فشل التحديث: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

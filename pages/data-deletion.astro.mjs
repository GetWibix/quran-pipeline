import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_CmgA8ERQ.mjs';
import { $ as $$Header, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
export { renderers } from '../renderers.mjs';

const $$DataDeletion = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u062D\u0630\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", "canonical": "https://quran.waxbix.com/data-deletion" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<section class="pt-32 pb-10 xs:pb-12 sm:pb-16 relative min-h-screen overflow-hidden"> <div class="hero-glow"></div> <div class="max-w-4xl mx-auto px-4"> <h1 class="text-3xl xs:text-4xl md:text-5xl font-bold text-center mb-6 sm:mb-8"> <span class="gradient-text">حذف البيانات</span> </h1> <div class="space-y-4 sm:space-y-6 text-text-secondary leading-relaxed"> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">مقدمة</h2> <p class="text-sm xs:text-base">يحترم تطبيق QuranLive خصوصية المستخدمين. إذا كنت ترغب في حذف جميع بياناتك المرتبطة بالتطبيق، يمكنك اتباع الإرشادات أدناه.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">كيفية طلب حذف البيانات</h2> <p class="text-sm xs:text-base">لحذف بياناتك من تطبيق QuranLive، لديك طريقتان:</p> <ul class="list-disc list-inside space-y-2 mt-3 text-sm xs:text-base"> <li>التوجه إلى <a href="https://www.facebook.com/settings?tab=applications" class="text-primary hover:text-secondary underline" target="_blank" rel="noopener noreferrer">إعدادات فيسبوك &gt; التطبيقات والمواقع</a>، وإزالة تطبيق QuranLive. هذا يلغي وصول التطبيق إلى بياناتك.</li> <li>إرسال طلب حذف بيانات عبر البريد الإلكتروني مع ذكر اسم المستخدم أو معرف فيسبوك.</li> </ul> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">البيانات التي نحتفظ بها</h2> <p class="text-sm xs:text-base">تطبيق QuranLive لا يخزن أي بيانات شخصية للمستخدمين في قواعد البيانات الخاصة به. التطبيق يستخدم فقط توكن الوصول المقدم من فيسبوك لنشر المحتوى على الصفحات التي يملكها المستخدم، ولا يتم تخزين أي معلومات تعريفية.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">التواصل لطلب الحذف</h2> <p class="text-sm xs:text-base">لطلب حذف بياناتك يدوياً، يرجى إرسال بريد إلكتروني على:</p> <p class="mt-2"> <a href="mailto:contact@waxbix.com" class="text-primary hover:text-secondary text-base xs:text-lg inline-block py-2.5 min-h-[44px]">contact@waxbix.com</a> </p> <p class="text-sm xs:text-base mt-2">سنقوم بمعالجة طلبك في غضون 30 يوماً من استلامه، وتأكيد الحذف عبر البريد الإلكتروني.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">بيانات فيسبوك</h2> <p class="text-sm xs:text-base">بعد إزالة التطبيق من إعدادات فيسبوك، سيتم حذف أي بيانات مرتبطة بالتطبيق من خوادم فيسبوك وفقاً لسياسة الخصوصية الخاصة بهم. لمزيد من المعلومات، راجع <a href="https://www.facebook.com/privacy/policy/" class="text-primary hover:text-secondary underline" target="_blank" rel="noopener noreferrer">سياسة بيانات فيسبوك</a>.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <p class="text-text-muted text-xs xs:text-sm">آخر تحديث: يوليو 2026</p> </div> </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/data-deletion.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/data-deletion.astro";
const $$url = "/data-deletion";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DataDeletion,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

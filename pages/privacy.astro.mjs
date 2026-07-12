import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_CmgA8ERQ.mjs';
import { $ as $$Header, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
export { renderers } from '../renderers.mjs';

const $$Privacy = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629", "canonical": "https://quran.waxbix.com/privacy" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<section class="pt-32 pb-10 xs:pb-12 sm:pb-16 relative min-h-screen overflow-hidden"> <div class="hero-glow"></div> <div class="max-w-4xl mx-auto px-4"> <h1 class="text-3xl xs:text-4xl md:text-5xl font-bold text-center mb-6 sm:mb-8"> <span class="gradient-text">سياسة الخصوصية</span> </h1> <div class="space-y-4 sm:space-y-6 text-text-secondary leading-relaxed"> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">مقدمة</h2> <p class="text-sm xs:text-base">نحن في NOR Quran نلتزم بحماية خصوصية زوار موقعنا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">المعلومات التي نجمعها</h2> <p class="text-sm xs:text-base">موقع NOR Quran لا يجمع أي معلومات شخصية. قد نجمع بيانات إحصائية مجهولة المصدر عبر GitHub Pages لتحسين تجربة المستخدم.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">ملفات تعريف الارتباط (Cookies)</h2> <p class="text-sm xs:text-base">لا نستخدم ملفات تعريف الارتباط لتتبع المستخدمين. قد تستخدم GitHub Pages ملفات تعريف ارتباط تقنية ضرورية لتشغيل الموقع.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">خدمات الطرف الثالث</h2> <p class="text-sm xs:text-base">يستخدم الموقع YouTube API لعرض الفيديوهات المضمنة. يرجى مراجعة سياسة خصوصية Google للمزيد من المعلومات.</p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <h2 class="text-lg xs:text-xl font-bold text-white mb-2 sm:mb-3">التواصل</h2> <p class="text-sm xs:text-base">للاستفسارات بخصوص سياسة الخصوصية، يرجى التواصل عبر: <a href="mailto:contact@waxbix.com" class="text-primary hover:text-secondary inline-block py-2.5 min-h-[44px]">contact@waxbix.com</a></p> </div> <div class="glow-card p-4 xs:p-5 sm:p-6"> <p class="text-text-muted text-xs xs:text-sm">آخر تحديث: يونيو 2026</p> </div> </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/privacy.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/privacy.astro";
const $$url = "/privacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Privacy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

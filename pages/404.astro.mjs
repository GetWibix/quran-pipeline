import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_nuiVDF-S.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0627\u0644\u0635\u0641\u062D\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629", "canonical": "https://quran.waxbix.com/404" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden"> <div class="hero-glow"></div> <div class="text-center z-10 px-4"> <div class="text-6xl xs:text-7xl sm:text-8xl md:text-9xl font-bold gradient-text mb-3 sm:mb-4">404</div> <h1 class="text-2xl xs:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">الصفحة غير موجودة</h1> <p class="text-text-secondary text-sm xs:text-base md:text-lg mb-6 sm:mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p> <a href="/" class="btn-primary text-sm xs:text-base md:text-lg px-6 xs:px-8 py-3 sm:py-4">العودة إلى الرئيسية</a> </div> </div> ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/404.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

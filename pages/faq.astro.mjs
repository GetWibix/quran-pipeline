import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_CmgA8ERQ.mjs';
import { $ as $$Header, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
export { renderers } from '../renderers.mjs';

const $$Faq = createComponent(($$result, $$props, $$slots) => {
  const faqs = [
    {
      q: "\u0647\u0644 \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u062C\u0627\u0646\u064A\u061F",
      a: "\u0646\u0639\u0645\u060C NOR Quran \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0648\u0645\u062C\u0627\u0646\u064A \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062E\u064A\u0631\u064A\u0629. \u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u064A \u0631\u0633\u0648\u0645 \u0623\u0648 \u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A."
    },
    {
      q: "\u0647\u0644 \u0623\u0633\u062A\u0637\u064A\u0639 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0643\u0648\u062F \u0644\u0645\u0634\u0631\u0648\u0639\u064A\u061F",
      a: "\u0646\u0639\u0645\u060C \u0628\u0634\u0631\u0637 \u063A\u064A\u0631 \u062A\u062C\u0627\u0631\u064A. \u0627\u0644\u0643\u0648\u062F \u0645\u0631\u062E\u0635 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0634\u062E\u0635\u064A \u0648\u0627\u0644\u062E\u064A\u0631\u064A."
    },
    {
      q: "\u0647\u0644 \u064A\u062D\u062A\u0627\u062C \u0633\u064A\u0631\u0641\u0631 \u0642\u0648\u064A\u061F",
      a: "\u0644\u0627\u060C 1-2GB RAM \u0643\u0627\u0641\u064A\u0629 \u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0646\u0638\u0627\u0645. \u064A\u0645\u0643\u0646\u0643 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 VPS \u0645\u0646\u062E\u0641\u0636 \u0627\u0644\u062A\u0643\u0644\u0641\u0629."
    },
    {
      q: "\u0643\u064A\u0641 \u0623\u062D\u0635\u0644 \u0639\u0644\u0649 \u062A\u0648\u0643\u0646 \u064A\u0648\u062A\u064A\u0648\u0628\u061F",
      a: "\u0639\u0628\u0631 \u062A\u0634\u063A\u064A\u0644 \u0633\u0643\u0631\u064A\u0628\u062A getRefreshToken \u0627\u0644\u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0645\u0634\u0631\u0648\u0639. \u0627\u062A\u0628\u0639 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0641\u064A \u0635\u0641\u062D\u0629 /docs."
    },
    {
      q: "\u0647\u0644 \u064A\u062F\u0639\u0645 \u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0642\u0631\u0622\u0646\u061F",
      a: "\u062D\u0627\u0644\u064A\u0627\u064B \u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u062F\u0639\u0645 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0641\u0642\u0637. \u062F\u0639\u0645 \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0642\u064A\u062F \u0627\u0644\u062A\u0637\u0648\u064A\u0631."
    },
    {
      q: "\u0643\u064A\u0641 \u0623\u0636\u064A\u0641 \u0642\u0627\u0631\u0626 \u062C\u062F\u064A\u062F\u061F",
      a: "\u064A\u0639\u062F\u0644 \u0641\u064A \u0627\u0644\u0643\u0648\u062F \u0628\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0627\u0631\u0626 \u0627\u0644\u062C\u062F\u064A\u062F \u0641\u064A \u0645\u0644\u0641 \u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A \u0648\u062A\u0648\u0641\u064A\u0631 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0635\u0648\u062A \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0647."
    },
    {
      q: "\u0643\u0645 \u0641\u064A\u062F\u064A\u0648 \u064A\u0646\u0634\u0631 \u0641\u064A \u0627\u0644\u064A\u0648\u0645\u061F",
      a: "\u0627\u0644\u0646\u0638\u0627\u0645 \u064A\u062C\u062F\u0648\u0644 \u0627\u0644\u0646\u0634\u0631 \u0643\u0644 4 \u0633\u0627\u0639\u0627\u062A \u0628\u0645\u0639\u062F\u0644 6 \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0641\u064A \u0627\u0644\u064A\u0648\u0645."
    },
    {
      q: "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u062A\u062C\u0627\u0631\u064A\u0627\u064B\u061F",
      a: "\u0644\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 contact@waxbix.com."
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629", "canonical": "https://quran.waxbix.com/faq", "description": "\u0623\u062C\u0648\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u062D\u0648\u0644 \u0645\u0634\u0631\u0648\u0639 NOR Quran" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<section id="main-content" class="pt-32 pb-10 xs:pb-12 sm:pb-16 relative min-h-screen overflow-hidden"> <div class="hero-glow"></div> <div class="max-w-4xl mx-auto px-4"> <h1 class="text-3xl xs:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4"> <span class="gradient-text">الأسئلة الشائعة</span> </h1> <p class="text-text-secondary text-center text-sm xs:text-base md:text-lg mb-8 sm:mb-12">إجابات على أكثر الأسئلة تكرراً</p> <div class="space-y-3 sm:space-y-4" role="list"> ${faqs.map((faq, i) => renderTemplate`<div class="glow-card p-4 xs:p-5 sm:p-6" role="listitem"> <h3> <button class="faq-btn w-full flex items-center justify-between text-right py-2 sm:py-3 min-h-[44px] gap-2" aria-expanded="false"${addAttribute(`faq-answer-${i}`, "aria-controls")}${addAttribute(`faq-btn-${i}`, "id")}> <span class="font-bold text-sm xs:text-base sm:text-lg">${faq.q}</span> <svg class="w-5 h-5 text-text-secondary transform transition-transform duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> </h3> <div${addAttribute(`faq-answer-${i}`, "id")} role="region"${addAttribute(`faq-btn-${i}`, "aria-labelledby")} class="faq-answer hidden mt-4 text-text-secondary leading-relaxed"> ${faq.a} </div> </div>`)} </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })} `;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/faq.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/faq.astro";
const $$url = "/faq";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Faq,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

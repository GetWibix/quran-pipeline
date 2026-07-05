import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_nuiVDF-S.mjs';
import { $ as $$Header, a as $$Icon, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
export { renderers } from '../renderers.mjs';

const $$TechStack = createComponent(($$result, $$props, $$slots) => {
  const techs = [
    { name: "TypeScript", usage: "\u0644\u063A\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", icon: "book" },
    { name: "Node.js", usage: "\u0628\u064A\u0626\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644", icon: "nodejs" },
    { name: "PostgreSQL", usage: "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", icon: "database" },
    { name: "Redis", usage: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u0624\u0642\u062A", icon: "redis" },
    { name: "Docker", usage: "\u0627\u0644\u0646\u0634\u0631 \u0648\u0627\u0644\u062D\u0627\u0648\u064A\u0627\u062A", icon: "docker" },
    { name: "FFmpeg", usage: "\u062A\u0631\u0643\u064A\u0628 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0648\u0627\u0644\u0635\u0648\u062A", icon: "video-editing" },
    { name: "YouTube API v3", usage: "\u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A", icon: "youtube" },
    { name: "OpenRouter", usage: "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u062C\u0627\u0646\u064A", icon: "robot" },
    { name: "Prisma", usage: "\u0625\u062F\u0627\u0631\u0629 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", icon: "orm" },
    { name: "BullMQ", usage: "\u0625\u062F\u0627\u0631\u0629 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631", icon: "queue" },
    { name: "Cloudflare R2", usage: "\u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0633\u062D\u0627\u0628\u064A", icon: "cloud" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A", "description": "\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A \u0628\u0646\u0627\u0621 \u0646\u0638\u0627\u0645 NOR Quran", "canonical": "https://quran.waxbix.com/tech-stack" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<section id="main-content" class="pt-32 pb-10 xs:pb-12 sm:pb-16 relative min-h-screen overflow-hidden"> <div class="hero-glow"></div> <div class="max-w-5xl mx-auto px-4"> <h1 class="text-3xl xs:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4"> <span class="gradient-text">التقنيات</span> </h1> <p class="text-text-secondary text-center text-sm xs:text-base md:text-lg mb-8 sm:mb-12">التقنيات والأدوات المستخدمة في بناء النظام</p> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"> ${techs.map((tech) => renderTemplate`<div class="glow-card p-4 xs:p-5 flex items-center gap-3 sm:gap-4"> ${renderComponent($$result2, "Icon", $$Icon, { "name": tech.icon, "size": 20, "class": "xs:w-6 xs:h-6 text-primary" })} <div> <h3 class="font-bold">${tech.name}</h3> <p class="text-text-secondary text-sm">${tech.usage}</p> </div> </div>`)} </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/tech-stack.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/tech-stack.astro";
const $$url = "/tech-stack";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TechStack,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

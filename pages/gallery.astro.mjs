import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_nuiVDF-S.mjs';
import { $ as $$Header, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
import { $ as $$YouTubeEmbed } from '../chunks/YouTubeEmbed_BeaqRllc.mjs';
export { renderers } from '../renderers.mjs';

const $$Gallery = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0627\u0644\u0645\u0639\u0631\u0636", "canonical": "https://quran.waxbix.com/gallery", "description": "\u0634\u0627\u0647\u062F \u0623\u062D\u062F\u062B \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A NOR Quran \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<section id="main-content" class="pt-32 pb-10 xs:pb-12 sm:pb-16 relative min-h-screen overflow-hidden"> <div class="hero-glow"></div> <div class="max-w-6xl mx-auto px-4"> <h1 class="text-3xl xs:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4"> <span class="gradient-text">المعرض</span> </h1> <p class="text-text-secondary text-center text-sm xs:text-base md:text-lg mb-8 sm:mb-12">أحدث فيديوهات NOR Quran المنشورة</p> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"> ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "MedcpoVFAbI", "title": "\u0641\u064A\u062F\u064A\u0648 1" })} ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "nBaZ86iZJik", "title": "\u0641\u064A\u062F\u064A\u0648 2" })} ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "b0YYKoCr1sU", "title": "\u0641\u064A\u062F\u064A\u0648 3" })} ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "mHzfto1wL4Q", "title": "\u0641\u064A\u062F\u064A\u0648 4" })} ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "DF4d2D3PB3A", "title": "\u0641\u064A\u062F\u064A\u0648 5" })} ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "-W1_jS9zd8Y", "title": "\u0641\u064A\u062F\u064A\u0648 6" })} </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/gallery.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/gallery.astro";
const $$url = "/gallery";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Gallery,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

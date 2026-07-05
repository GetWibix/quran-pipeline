import { d as createAstro, c as createComponent, m as maybeRenderHead, r as renderComponent, b as addAttribute, a as renderTemplate } from '../chunks/astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_nuiVDF-S.mjs';
import { a as $$Icon, $ as $$Header, b as $$Footer } from '../chunks/Footer_BmWIUhSZ.mjs';
import 'clsx';
import { $ as $$YouTubeEmbed } from '../chunks/YouTubeEmbed_BeaqRllc.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro("https://quran.waxbix.com");
const $$FeatureCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$FeatureCard;
  const { icon, title, description, link } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<article class="glow-card p-5 xs:p-6 group"> <div class="mb-2 sm:mb-3">${renderComponent($$result, "Icon", $$Icon, { "name": icon, "size": 24, "class": "xs:w-7 xs:h-7 text-primary" })}</div> <h3 class="text-base xs:text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">${title}</h3> <p class="text-text-secondary text-xs xs:text-sm leading-relaxed mb-3 sm:mb-4">${description}</p> ${link && renderTemplate`<a${addAttribute(link, "href")} class="text-white text-sm font-semibold hover:text-gold-light transition-colors inline-flex items-center gap-1">
اعرف المزيد
<span aria-hidden="true">←</span> </a>`} </article>`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/components/FeatureCard.astro", void 0);

const $$Astro = createAstro("https://quran.waxbix.com");
const $$StatCounter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$StatCounter;
  const { value, label, suffix = "" } = Astro2.props;
  const displayValue = value.toLocaleString("en");
  return renderTemplate`${maybeRenderHead()}<div class="text-center p-3 xs:p-4 sm:p-6"> <div class="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-1 sm:mb-2"${addAttribute(value, "data-count")}> ${displayValue} </div> <div class="text-text-secondary text-sm"> ${label} ${suffix && renderTemplate`<span class="text-primary">${suffix}</span>`} </div> </div>`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/components/StatCounter.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const features = [
    { icon: "video", title: "\u0646\u0634\u0631 \u062A\u0644\u0642\u0627\u0626\u064A \u0644\u064A\u0648\u062A\u064A\u0648\u0628", description: "\u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0648\u062C\u062F\u0648\u0644\u062A\u0647 \u0639\u0644\u0649 YouTube \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0628\u0631 API v3 \u0645\u0639 \u062F\u0639\u0645 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0627\u0644\u0642\u0635\u064A\u0631\u0629 \u0648\u0627\u0644\u0637\u0648\u064A\u0644\u0629.", link: "/features" },
    { icon: "robot", title: "\u0639\u0646\u0627\u0648\u064A\u0646 \u0630\u0643\u064A\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A", description: "\u062A\u0648\u0644\u064A\u062F \u0639\u0646\u0627\u0648\u064A\u0646 \u0648\u0648\u0635\u0641 \u0648\u0647\u0627\u0634\u062A\u0627\u063A\u0627\u062A \u0645\u062D\u062A\u0631\u0645\u0629 \u0639\u0628\u0631 OpenRouter \u2014 \u0628\u062F\u0648\u0646 \u0645\u0628\u0627\u0644\u063A\u0629 \u0623\u0648 \u062E\u062F\u0627\u0639.", link: "/features" },
    { icon: "chart", title: "\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0648\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0646\u0634\u0631 \u0627\u0644\u0645\u062B\u0644\u0649", description: "70% \u0623\u0641\u0636\u0644 \u0648\u0642\u062A + 30% \u062A\u062C\u0631\u0628\u0629 \u0623\u0648\u0642\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621 \u0645\u0639 \u0627\u0644\u062A\u0639\u0644\u0645 \u0627\u0644\u062A\u062F\u0631\u064A\u062C\u064A.", link: "/features" },
    { icon: "globe", title: "\u0646\u0634\u0631 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0645\u0646\u0635\u0627\u062A", description: "\u064A\u0646\u0634\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0644\u0649 YouTube\u060C Facebook\u060C Instagram\u060C \u0648Threads \u0645\u0639 \u0625\u0634\u0639\u0627\u0631 Telegram.", link: "/features" },
    { icon: "refresh", title: "\u0642\u0631\u0627\u0621\u0629 \u0645\u062A\u0633\u0644\u0633\u0644\u0629 \u0628\u062F\u0648\u0646 \u062A\u0643\u0631\u0627\u0631", description: "\u064A\u0642\u0631\u0623 \u0627\u0644\u0642\u0631\u0622\u0646 \u0643\u0627\u0645\u0644\u0627\u064B (6,236 \u0622\u064A\u0629) \u0628\u062A\u0633\u0644\u0633\u0644 \u0645\u0646 \u0627\u0644\u0641\u0627\u062A\u062D\u0629 \u0644\u0644\u0646\u0627\u0633 \u0628\u062F\u0648\u0646 \u062A\u0643\u0631\u0627\u0631.", link: "/features" },
    { icon: "mic", title: "\u0623\u0635\u0648\u0627\u062A \u0639\u062F\u0629 \u0642\u0631\u0627\u0621", description: "\u0639\u0628\u062F \u0627\u0644\u0628\u0627\u0633\u0637 40%\u060C \u0627\u0644\u0639\u0641\u0627\u0633\u064A 30%\u060C \u0627\u0644\u0645\u0639\u064A\u0642\u0644\u064A 20%\u060C \u0627\u0644\u063A\u0627\u0645\u062F\u064A 10% \u0645\u0639 \u062A\u0648\u0632\u064A\u0639 \u0639\u0634\u0648\u0627\u0626\u064A.", link: "/features" }
  ];
  const stats = [
    { value: 500, label: "\u0641\u064A\u062F\u064A\u0648 \u0645\u0646\u0634\u0648\u0631" },
    { value: 25e3, label: "\u0645\u0634\u0627\u0647\u062F\u0629" },
    { value: 6, label: "\u0642\u0631\u0627\u0621" },
    { value: 30, label: "\u062C\u0632\u0621 \u0645\u0646\u062C\u0632" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "canonical": "https://quran.waxbix.com" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})}  ${maybeRenderHead()}<section id="main-content" class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"> <div class="absolute inset-0"> <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75&fm=webp" srcset="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75&fm=webp 800w, https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=75&fm=webp 1200w" sizes="100vw" alt="" class="w-full h-full object-cover" loading="eager" fetchpriority="high" decoding="async"> </div> <!-- Overlay gradient: natural dark with gold tint --> <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-bg-dark"></div> <!-- Gold decorative corners --> <div class="absolute top-24 max-sm:top-16 left-2 xs:left-6 md:left-12 w-10 h-10 xs:w-16 xs:h-16 md:w-28 md:h-28 border-t-[1.5px] xs:border-t-2 border-l-[1.5px] xs:border-l-2 border-gold/30 rounded-tl-3xl"></div> <div class="absolute top-24 max-sm:top-16 right-2 xs:right-6 md:right-12 w-10 h-10 xs:w-16 xs:h-16 md:w-28 md:h-28 border-t-[1.5px] xs:border-t-2 border-r-[1.5px] xs:border-r-2 border-gold/30 rounded-tr-3xl"></div> <div class="absolute bottom-40 max-sm:bottom-20 left-2 xs:left-6 md:left-12 w-10 h-10 xs:w-16 xs:h-16 md:w-28 md:h-28 border-b-[1.5px] xs:border-b-2 border-l-[1.5px] xs:border-l-2 border-gold/30 rounded-bl-3xl"></div> <div class="absolute bottom-40 max-sm:bottom-20 right-2 xs:right-6 md:right-12 w-10 h-10 xs:w-16 xs:h-16 md:w-28 md:h-28 border-b-[1.5px] xs:border-b-2 border-r-[1.5px] xs:border-r-2 border-gold/30 rounded-br-3xl"></div> <!-- Content --> <div class="relative z-10 max-w-4xl mx-auto px-4 text-center"> ${renderComponent($$result2, "Icon", $$Icon, { "name": "mosque", "size": 40, "class": "text-gold-light mb-4" })} <h1 class="text-3xl xs:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4"> <span class="text-white">NOR Quran</span> </h1> <p class="text-base xs:text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 font-semibold text-white px-2">
ننشر القرآن الكريم آلياً — 24 ساعة، 7 أيام، 365 يوم
</p> <p class="text-text-secondary text-xs xs:text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
نظام ذكي مفتوح المصدر يختار الآيات، يولد فيديوهات، وينشرها على يوتيوب وفيسبوك وإنستغرام وثريدز — بدون تدخل يدوي.
</p> <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto px-4 sm:px-0"> <a href="/docs" class="btn-gold text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto text-center">
ابدأ الآن
</a> <a href="/features" class="btn-outline-gold text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto text-center">
شاهد الميزات
</a> </div> </div> </section>  <section class="py-10 xs:py-12 sm:py-16 relative"> <div class="max-w-4xl mx-auto px-4 text-center"> <div class="glow-card p-5 xs:p-6 sm:p-8 md:p-12"> <p class="text-base xs:text-lg sm:text-xl md:text-2xl leading-relaxed text-text-secondary">
NOR Quran يقرأ القرآن كاملاً (<span class="text-white font-bold">6,236</span> آية) بتسلسل بدون تكرار. يستخدم الذكاء الاصطناعي لاختيار الآيات المناسبة وتوليد عناوين محترمة. ينشر في أفضل الأوقات بناءً على تحليلات الأداء.
</p> </div> </div> </section>  <section class="py-10 xs:py-12 sm:py-16 relative"> <div class="max-w-7xl mx-auto px-4"> <h2 class="section-title">الميزات الأساسية</h2> <p class="section-subtitle">كل ما تحتاج لنشر القرآن الكريم آلياً باحترافية</p> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> ${features.map((feat) => renderTemplate`${renderComponent($$result2, "FeatureCard", $$FeatureCard, { "icon": feat.icon, "title": feat.title, "description": feat.description, "link": feat.link })}`)} </div> </div> </section>  <section class="py-10 xs:py-12 sm:py-16 relative"> <div class="max-w-5xl mx-auto px-4"> <div class="glow-card p-5 xs:p-6 sm:p-8"> <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"> ${stats.map((stat) => renderTemplate`${renderComponent($$result2, "StatCounter", $$StatCounter, { ...stat })}`)} </div> </div> </div> </section>  <section class="py-10 xs:py-12 sm:py-16 relative"> <div class="max-w-3xl mx-auto px-4"> ${renderComponent($$result2, "YouTubeEmbed", $$YouTubeEmbed, { "videoId": "MedcpoVFAbI", "title": "\u0622\u062E\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u0646\u0634\u0648\u0631" })} </div> </section>  <section class="py-12 xs:py-14 sm:py-20 relative"> <div class="max-w-3xl mx-auto px-4 text-center"> <h2 class="text-2xl xs:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">ابدأ مع NOR Quran</h2> <p class="text-text-secondary text-sm xs:text-base md:text-lg mb-6 sm:mb-8 px-2">انطلق في رحلة نشر القرآن الكريم آلياً — مجاناً ومفتوح المصدر</p> <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0"> <a href="/docs" class="btn-primary text-sm xs:text-base md:text-lg px-5 xs:px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">تعليمات التشغيل</a> <a href="https://github.com/GetWibix/quran-pipeline" target="_blank" rel="noopener noreferrer" class="btn-secondary text-sm xs:text-base md:text-lg px-5 xs:px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">مشاهدة الكود على GitHub</a> </div> </div> </section> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/index.astro", void 0);

const $$file = "/home/runner/work/quran-pipeline/quran-pipeline/website/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

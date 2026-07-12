import { d as createAstro, c as createComponent, m as maybeRenderHead, b as addAttribute, a as renderTemplate } from './astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import 'clsx';

const $$Astro = createAstro("https://quran.waxbix.com");
const $$YouTubeEmbed = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$YouTubeEmbed;
  const { videoId, title = "\u0622\u062E\u0631 \u0641\u064A\u062F\u064A\u0648 \u0645\u0646\u0634\u0648\u0631" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="w-full"> <h3 class="text-xl font-bold mb-4 text-center">${title}</h3> <div class="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black/20"> <iframe${addAttribute(`https://www.youtube.com/embed/${videoId}`, "src")}${addAttribute(title, "title")} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full"></iframe> </div> </div>`;
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/components/YouTubeEmbed.astro", void 0);

export { $$YouTubeEmbed as $ };

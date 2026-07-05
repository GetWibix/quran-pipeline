import { d as createAstro, c as createComponent, a as renderTemplate, e as renderSlot, f as renderHead, u as unescapeHTML, b as addAttribute } from './astro/server_Dvld-7Qp.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                         */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b, _c;
const $$Astro = createAstro("https://quran.waxbix.com");
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title, description = "\u0646\u0638\u0627\u0645 \u0630\u0643\u064A \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0644\u0646\u0634\u0631 \u0622\u064A\u0627\u062A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0622\u0644\u064A\u0627\u064B \u0639\u0644\u0649 \u064A\u0648\u062A\u064A\u0648\u0628 \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0623\u062E\u0631\u0649", ogImage, canonical } = Astro2.props;
  const siteUrl = "https://quran.waxbix.com";
  const pageTitle = `${title} | NOR Quran`;
  const image = ogImage || `${siteUrl}/og-image.png`;
  const canonicalUrl = canonical || siteUrl;
  return renderTemplate(_c || (_c = __template(['<html lang="ar" dir="rtl"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>', '</title><meta name="description"', `><meta name="theme-color" content="#0a1628"><meta name="robots" content="index, follow, max-image-preview:large"><meta name="googlebot" content="index, follow"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self' https://api.alquran.cloud; media-src 'self' https://everyayah.com; frame-src 'self' https://www.youtube.com;"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="canonical"`, `><link rel="alternate" type="application/rss+xml" title="NOR Quran" href="/rss.xml"><link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml"><link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://images.unsplash.com" crossorigin><link rel="dns-prefetch" href="https://everyayah.com"><link rel="dns-prefetch" href="https://api.alquran.cloud"><link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@300;400;500;600;700;800&display=swap"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@300;400;500;600;700;800&display=swap" media="print" onload="this.media='all'"><!-- Open Graph --><meta property="og:type" content="website"><meta property="og:title"`, '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:url"', '><meta property="og:site_name" content="NOR Quran"><meta property="og:locale" content="ar_AR"><!-- Twitter --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><!-- JSON-LD: Organization --><script type="application/ld+json">', '<\/script><!-- JSON-LD: WebSite --><script type="application/ld+json">', "<\/script>", "", "", '</head> <body class="min-h-screen bg-bg-dark text-white"> <a href="#main-content" class="skip-link">\n\u062A\u062E\u0637\u0649 \u0625\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649\n</a> ', " </body></html>"])), pageTitle, addAttribute(description, "content"), addAttribute(canonicalUrl, "href"), addAttribute(pageTitle, "content"), addAttribute(description, "content"), addAttribute(image, "content"), addAttribute(canonicalUrl, "content"), addAttribute(pageTitle, "content"), addAttribute(description, "content"), addAttribute(image, "content"), unescapeHTML(`
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "NOR Quran",
        "description": "\u0646\u0638\u0627\u0645 \u0622\u0644\u064A \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0644\u0646\u0634\u0631 \u0622\u064A\u0627\u062A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0639\u0644\u0649 \u064A\u0648\u062A\u064A\u0648\u0628 \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0623\u062E\u0631\u0649",
        "url": "${siteUrl}",
        "logo": "${siteUrl}/favicon.svg",
        "foundingDate": "2026",
        "developer": {
          "@type": "Organization",
          "name": "Waxbix",
          "url": "https://waxbix.com"
        },
        "sameAs": [
          "https://github.com/GetWibix/quran-pipeline"
        ]
      }
    `), unescapeHTML(`
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "NOR Quran",
        "url": "${siteUrl}",
        "description": "${description}",
        "inLanguage": "ar",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "${siteUrl}/quran?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    `), canonicalUrl === siteUrl && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(`
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "NOR Quran",
          "description": "\u0646\u0638\u0627\u0645 \u0622\u0644\u064A \u0645\u0641\u062A\u0648\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0644\u0646\u0634\u0631 \u0622\u064A\u0627\u062A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0639\u0644\u0649 \u064A\u0648\u062A\u064A\u0648\u0628 \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0623\u062E\u0631\u0649",
          "url": "${siteUrl}",
          "applicationCategory": "Multimedia",
          "operatingSystem": "Linux",
          "author": {
            "@type": "Organization",
            "name": "NOR Quran Team"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }
      `)), canonicalUrl !== siteUrl && renderTemplate(_b || (_b = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(`
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "NOR Quran", "item": "${siteUrl}" },
            { "@type": "ListItem", "position": 2, "name": "${title}", "item": "${canonicalUrl}" }
          ]
        }
      `)), renderHead(), renderSlot($$result, $$slots["default"]));
}, "/home/runner/work/quran-pipeline/quran-pipeline/website/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };

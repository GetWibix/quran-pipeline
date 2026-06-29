import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://quran.waxbix.com',
  base: '/',
  trailingSlash: 'never',
  output: 'static',
  build: {
    assets: '_assets',
  },
});

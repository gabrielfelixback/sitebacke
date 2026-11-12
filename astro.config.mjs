import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://backe.com.br',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});

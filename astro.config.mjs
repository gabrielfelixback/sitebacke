import { defineConfig } from 'astro/config';

// Produção (backe.com.br): valores padrão.
// Preview no GitHub Pages: SITE_URL=https://gabrielfelixback.github.io BASE_PATH=/sitebacke PUBLIC_PREVIEW=true
export default defineConfig({
  site: process.env.SITE_URL || 'https://backe.com.br',
  base: process.env.BASE_PATH || '/',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});

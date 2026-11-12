import { defineConfig } from 'astro/config';

// Produção (backe.com.br): valores padrão.
// Preview no GitHub Pages: SITE_URL=https://gabrielfelixback.github.io BASE_PATH=/sitebacke PUBLIC_PREVIEW=true
export default defineConfig({
  site: process.env.SITE_URL || 'https://backe.com.br',
  base: process.env.BASE_PATH || '/',
  // CSS embutido no HTML (sem folha de estilos bloqueando a primeira pintura).
  build: { inlineStylesheets: 'always' },
  // scripts sempre como arquivo: a CSP só permite scripts do próprio domínio (sem 'unsafe-inline')
  vite: { build: { assetsInlineLimit: 0 } },
  compressHTML: true,
});

# BACKE.co — site institucional e comercial

Site estático em **Astro + TypeScript**, com animações em **GSAP** (carregado sob demanda) e CSS próprio com design tokens.
O objetivo principal do site é levar o visitante até o formulário de **diagnóstico estratégico gratuito**.

## Comandos

```bash
npm install
npm run dev       # desenvolvimento em http://localhost:4321
npm run build     # gera o site estático em dist/
npm run preview   # serve o build localmente
npm test          # testes do módulo de leads (vitest)
node scripts/make-images.cjs   # regenera og-image.png e ícones a partir dos SVGs
bash scripts/encode-videos.sh  # gera vídeos (desktop/celular) e capas WebP a partir de assets-originais/video
node scripts/build-preview-relative.cjs  # build de prévia com caminhos relativos (dist-artifact/)
```

## Estrutura

| Caminho | O que é |
|---|---|
| `src/lib/lead.ts` | Validação, normalização e envio de leads. **Payload idêntico ao do site anterior** (provado em `tests/lead.test.ts` contra o código de produção). |
| `src/lib/turnstile.ts` | Cloudflare Turnstile (mesma sitekey/action). |
| `src/lib/tracking.ts` | Meta Pixel com consentimento (mesma chave `backe_marketing_consent`, mesmos eventos). |
| `src/lib/logo-paths.ts` | Vetores do símbolo e do wordmark (vetorizados do PNG oficial — trocar pelo vetor original quando disponível). |
| `src/data/content.ts` | **Todo o conteúdo** (serviços, FAQ, números, clientes, etapas). Edite aqui. |
| `src/components/*.astro` | Uma seção por componente. |
| `src/scripts/` | `ui.ts` (cabeçalho, menus, acordeões, consentimento), `form.ts` (formulário em 3 etapas), `motion.ts` (revelações leves), `scenes.ts` (cenas de scroll com GSAP, lazy). |
| `src/scripts/video.ts` + `src/components/Vbox.astro` | Todos os vídeos: capa sempre visível, fonte por JS (celular/desktop), botão de play quando o autoplay é bloqueado, carregamento a uma tela de distância. |
| `public/sol.js` | Sol que percorre a página (desktop), manifesto do Custo, sol do formulário e pôr do sol do rodapé. |
| `assets-originais/video/` | Vídeos originais (fora de `public/`, não vão para o site). |
| `public/` | Logos de clientes otimizados, ícones, OG image, `privacidade.html`, robots, sitemap. |
| `referencia/` | Briefing, análise da Fase 01, referências e arquivos originais da marca. |

## Integração de leads (não alterar sem combinar com o worker)

- Endpoint: `POST https://backe-lead-proxy.backeco.workers.dev/api/leads`
- O worker **valida o Turnstile no servidor** e aceita CORS só de `https://backe.com.br`.
- Proteções no cliente: honeypot (`website`), validação por etapa, token obrigatório, timeout de 15s, bloqueio de duplo envio, token renovado após erro.
- UTMs persistidos na sessão (`backe_utm_params`).
- Eventos do Pixel (só com consentimento): `PageView`, `Lead`, `form_start`, `form_step_complete`, `form_validation_error`, `form_submit_attempt`, `form_submit_error`, `cta_click`, `contact_whatsapp`, `contact_instagram`, `service_open`, `faq_open`.

## Deploy

O build (`dist/`) é 100% estático — publique no mesmo GitHub Pages que serve `backe.com.br` hoje.
Para testar o envio real em outro domínio (preview), o domínio precisa ser incluído **no CORS do worker e nos hostnames do widget Turnstile** no painel da Cloudflare.

## Roteiro de teste após publicar

1. Abrir `https://backe.com.br/?utm_source=teste&utm_campaign=redesign`.
2. Enviar o formulário com dados identificáveis como teste (ex.: nome “TESTE redesign”).
3. Conferir no destino dos leads: nome, telefone `55…`, e-mail, empresa, mensagem com nicho e faturamento, interesse e UTMs.
4. Aceitar cookies e repetir: conferir o evento `Lead` no Meta Events Manager.
5. Testar no celular: CTA fixo, menu, formulário, botão de WhatsApp.

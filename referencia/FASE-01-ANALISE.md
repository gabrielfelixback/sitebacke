# BACKE.co — Redesign · FASE 01: Imersão e Análise

> Status: proposta para aprovação. Nenhum código do site foi escrito ainda.

---

## 0. O que foi analisado (e o que não foi)

| Fonte | Status |
|---|---|
| Site atual backe.com.br (navegado, todos os textos extraídos, bundle JS lido) | ✅ |
| Formulário e fluxo de envio de leads (código em produção) | ✅ |
| Hospedagem, CSP, pixel, Turnstile, worker de leads | ✅ |
| Logo oficial (PNG do site + 3 imagens enviadas) | ✅ |
| **6 referências do Behance** | ❌ **Bloqueadas.** O Behance responde 403 com desafio anti-robô para o navegador automatizado e para a ferramenta de leitura. Não contornei a proteção. **Nenhuma análise das referências foi feita — preciso de prints/exports (ver §10).** |
| Código-fonte do site atual | ❌ Não está neste repositório (vazio). Ver §7. |

---

## 1. Diagnóstico do site atual

**O que funciona bem (manter):**
- Mensagem central clara: "Estratégia que conecta. Criatividade que converte."
- Formulário em 2 etapas com micro-compromisso (nome + WhatsApp primeiro). Boa prática de CRO.
- Infra de leads séria: Cloudflare Worker, Turnstile, honeypot, UTMs, Pixel só com consentimento, CSP restritiva.
- Tom de voz direto ("Chega de queimar verba", "Sem metodologia com nome bonito").
- FAQ responde objeções reais (prazo, contrato, investimento).

**Problemas:**
1. **Visual de template.** Hero centralizado, palavras em gradiente e botões pill: é a estética padrão de landing page de 2023–24. Nada ali é reconhecível como Backe sem a logo.
2. **A logo não participa do site.** O símbolo tem uma geometria muito rica (ver §3) e hoje é só um PNG no cabeçalho e no rodapé.
3. **Serviços como catálogo.** São 9 cards com emoji (🎯📱🎨🚁) e o mesmo layout repetido. Emoji derruba a percepção de valor. Os 9 itens soltos reforçam exatamente o que vocês querem evitar ("eles fazem posts e anúncios"), em vez de transmitir "eles estruturam meu crescimento".
4. **Prova social fraca e não verificável.** Há 4 números (+200 marcas, 3.8x ROI, +R$5M, 98%) sem fonte, e nenhum case, depoimento ou trabalho mostrado. Para uma agência criativa, não mostrar trabalho é a maior lacuna.
5. **Falta a seção "custo de não agir".** O site vai direto de "visão" para "serviços" sem criar tensão.
6. **Cor fora do guia.** O site usa #f07020 → #ff404f. O guia indica #FF6A00 (ver §4).
7. **Técnico:**
   - `og:image` é **SVG**. WhatsApp, Facebook e LinkedIn não exibem SVG, então os links compartilhados aparecem sem imagem. Isso é crítico para quem vende pelo WhatsApp.
   - `canonical` e `og:url` apontam para `https://backe.co`, mas o site responde em `backe.com.br`. Do meu ambiente, `backe.co` não respondeu. Precisa confirmar qual é o domínio principal.
   - É uma SPA React: todo o conteúdo depende de JS (pior para SEO e LCP). O bundle tem 208 KB para uma página de conteúdo.
   - Emojis como ícones; schema `LocalBusiness` usa favicon como logo.

---

## 2. Público e jornada

**Quem compra:** donos e sócios de PMEs, de pré-faturamento até mais de R$500k/mês (faixas do formulário). Nichos: e-commerce, serviços, saúde, educação, food, imobiliário, moda, SaaS, varejo, jurídico.
Chegam majoritariamente por **Instagram e anúncios Meta, no celular** (o site tem Pixel e UTMs, e a conversa vai para o WhatsApp).

**Estado mental:** "já tentei agência / faço sozinho / meu marketing está desorganizado, gasto e não vejo retorno."

**Jornada desejada:**
`Reconheço a dor → percebo que a Backe pensa diferente → vejo que eles fazem tudo de forma integrada → confio (prova) → entendo como funciona → objeções resolvidas → peço o diagnóstico`

---

## 3. A logo como linguagem visual

**Leitura da logo:**
- A **haste** do "b" termina num **corte diagonal** (~25°), um gesto afiado e decidido.
- O **bojo** é uma forma orgânica, ovalada e assimétrica, que transborda para a direita.
- Dentro do bojo, uma **curva em S** separa luz e sombra. Lê-se como um **horizonte / sol nascendo**: a metade de baixo é um disco quente.
- O **degradê é vertical**: laranja-dourado no topo (#F18D34), laranja (#EA6832) no meio e coral (#FD434D) na base. Literalmente um nascer do sol.
- Wordmark "ba/cke" empilhado, com tipografia de alto contraste e terminais em gota. "creative .co" em geométrica pequena e espaçada.

**Conceito proposto: "O Horizonte Backe"**
A logo já é estratégia (o corte reto e racional da haste) encontrando criatividade (a curva orgânica do bojo). É o posicionamento de vocês desenhado. O site transforma esses três gestos em sistema:

| Elemento da logo | Uso no site |
|---|---|
| **O disco/sol** (metade inferior do bojo) | Fonte de luz da página. Degradês radiais nascem dele e somem no preto. No hero, o símbolo aparece **gigante, cortado pela borda**, iluminando a tipografia de dentro. A luz segue o cursor de leve (desktop). |
| **A curva em S (horizonte)** | Divisor proprietário entre seções, no lugar de linhas retas. Também é o indicador de progresso do formulário (um traço que "preenche" o horizonte). |
| **O corte diagonal da haste (~25°)** | Ângulo único do sistema: cantos cortados em botões e tags, setas dos CTAs, máscaras de imagem, inclinação de transições. |
| **O bojo inteiro** | **Máscara** para imagens e vídeos (Audiovisual, Drone, cases). O vídeo aparece "dentro do b". |
| **"ba/cke" empilhado** | Grid editorial: títulos grandes quebrados em duas linhas desalinhadas, como no wordmark. |
| **Animação** | Loader curto (<1s, só na 1ª visita): a haste desce, o bojo se fecha e o horizonte "amanhece" com o degradê. Sem deformar a marca: só revelação por máscara e preenchimento. |

**Limites:** a logo nunca é redesenhada, distorcida nem recolorida. Formas derivadas são citações (o disco, o S, o ângulo), não versões alternativas do símbolo.
**Requisito:** preciso da **logo em vetor (SVG/AI/PDF)**. O PNG de 1080px não permite máscaras e animações com qualidade, e vetorizar por conta própria arrisca alterar a forma.

---

## 4. Cor, degradê e luz

**Ponto de decisão:** o guia indica laranja **#FF6A00**, mas a logo real é um degradê **#F18D34 → #EA6832 → #FD434D**, e o site atual usa #f07020 → #ff404f. Os três são laranjas diferentes.

**Proposta:**
- **#FF6A00** é o laranja de ação: CTAs, foco, links, um destaque por tela.
- O **degradê da logo (dourado → laranja → coral)** é a luz: glows radiais, tipografia de destaque e o "sol". Não se recolore a logo.
- **Base:** preto #000 (hero e conversão final), grafite #171717 / #0E0E0E (seções de conteúdo), branco para texto e cinzas #8A8A8A / #2A2A2A para o secundário.
- **Luz:** degradês radiais com origem fora da tela (como um sol abaixo do horizonte), em 3 a 4 paradas, terminando em preto puro. Ruído/grão sutil (~3%) por cima, para evitar banding e dar textura de fotografia.
- **Transições de cor entre seções:** a página "amanhece" e "anoitece". O hero é noite com o sol nascendo; o meio fica em grafite neutro; a conversão final é o pico de luz (a seção mais quente do site).
- **Proibido:** roxo, azul, ciano, gradientes multicoloridos, glow em tudo. Um ponto de luz por seção.

---

## 5. Tipografia

- **Display:** uma grotesca expressiva com contraste, para conversar com o wordmark (terminais em gota, alto contraste). Candidatas licenciadas para web gratuitamente, a validar em teste: *Clash Display* / *General Sans* (Fontshare), ou *Instrument Sans* + *Instrument Serif* itálico para palavras de ênfase.
- **Texto:** uma sans neutra muito legível (*Inter* / *Geist*).
- Títulos enormes (até ~11vw no desktop), entrelinha apertada, quebra editorial "ba/cke".
- Fontes self-hosted, com subset latino e `font-display: swap`.

---

## 6. Nova arquitetura de informação + estratégia de conversão

Cada CTA tem uma função. O formulário é **"Diagnóstico estratégico"**, nunca "cadastro".

| # | Seção | Objetivo | CTA |
|---|---|---|---|
| 0 | **Header fixo** (some ao rolar para baixo, volta ao subir) | Navegação mínima | "Diagnóstico gratuito" → formulário |
| 1 | **Hero** — símbolo gigante iluminado + título editorial + subtítulo com o que a Backe faz e para quem + faixa de logos de clientes | Quem é, o que faz e por que é diferente, em 5 segundos | Primário: "Quero meu diagnóstico estratégico". Secundário: "Ver como pensamos" |
| 2 | **O custo do improviso** — texto revelado no scroll: verba queimada, post sem estratégia, marca que ninguém lembra, time comercial sem processo | Criar tensão / dor | — (sem CTA: deixar a dor respirar) |
| 3 | **Estratégia × Criatividade** — duas metades (o corte reto e a curva) que se encontram e formam o símbolo no scroll | Posicionamento: "não escolhemos entre os dois" | — |
| 4 | **Serviços como sistema**: 9 serviços agrupados em 4 frentes. **Estratégia** (Estratégia & Performance, Capacitação de Vendas) · **Demanda** (Tráfego Pago, Gestão de Redes) · **Marca** (Branding, Design & Motion, Sites & LPs) · **Imagem** (Audiovisual, Drone). Lista editorial numerada; o hover revela o impacto e uma imagem mascarada no bojo; o clique abre um painel com "o que entregamos / impacto no negócio / ideal para". | Desejo + "preciso de uma equipe que estruture tudo" | Em cada painel: "Começar por aqui" → formulário com o serviço já marcado (usa o campo `serviceInterest` existente) |
| 5 | **Diferenciais** — "Agência convencional vs Backe", em 6 contrastes: estratégia antes da execução, personalização, criatividade com objetivo, visão de negócio, frentes integradas, responsabilidade | Diferenciação | "Quero esse tipo de parceiro" |
| 6 | **Prova** — números (só os confirmados), logos de clientes, **cases e depoimentos reais** (preciso de material) | Confiança | "Quero resultados assim" |
| 7 | **Processo** — 4 etapas; no desktop, scroll horizontal fixado com o sol subindo a cada etapa | Clareza e redução de risco ("a 1ª etapa é gratuita") | "Começar pela etapa 01" |
| 8 | **FAQ** — as 6 atuais + objeções novas (a aprovar): "Já tive agência e não funcionou", "Preciso contratar tudo?", "Vocês atendem meu nicho?", "Quem cuida da minha conta?" | Remover objeções | "Falar no WhatsApp" (para quem ainda não está pronto) |
| 9 | **Conversão final** — seção mais iluminada do site. Formulário em destaque + "O que acontece depois que você envia" (3 passos: análise → contato em até 24h úteis → diagnóstico) + garantias + depoimento | Fechar | Enviar |
| — | **Barra fixa no mobile** após o hero: "Diagnóstico gratuito" + ícone do WhatsApp | Conversão em qualquer ponto | — |

### Formulário (mesma integração, experiência nova)
- **Etapa 1 — "Vamos começar"**: Nome e WhatsApp (máscara, teclado numérico). Micro-compromisso.
- **Etapa 2 — "Sobre o seu negócio"**: Empresa/Instagram e E-mail. Nicho e Faturamento viram **chips tocáveis** em vez de `<select>` (bem mais rápidos no celular).
- **Etapa 3 (opcional) — "Por onde quer começar?"**: chips das 4 frentes, mapeados para o campo `serviceInterest` que já existe. Já vem preenchido se o visitante veio de um serviço.
- Barra de progresso desenhada como a curva do horizonte, transições suaves e validação inline com mensagens claras.
- Turnstile carregado já na etapa 1, em segundo plano, para não travar o envio.
- Rascunho salvo na sessão: se fechar sem querer, os dados não se perdem.
- **Estado de sucesso de verdade** (tela própria, não só um toast): "Recebemos. Próximos passos…" + botão "Adiantar pelo WhatsApp" com mensagem pré-preenchida + evento `Lead` no Pixel.
- **Estado de erro:** "Tentar de novo" + WhatsApp, como hoje.
- **Payload 100% idêntico ao atual** — nenhuma mudança necessária no worker.

---

## 7. Plano técnico

### Auditoria (o que já sei)
- **Hospedagem:** GitHub Pages (`server: GitHub.com`), atrás de Varnish/Fastly.
- **Front atual:** Vite + React + Tailwind (shadcn), SPA, build em `/assets/site.js`.
- **Leads:** `POST https://backe-lead-proxy.backeco.workers.dev/api/leads`. O worker valida o Turnstile no servidor. **CORS só aceita `https://backe.com.br`.**
- **Turnstile:** sitekey `0x4AAAAAAD2AsXg5qWTuVN53` (a lista de hostnames permitidos é configurada no painel Cloudflare).
- **Meta Pixel** `1581141176961983`: com consentimento, eventos `PageView`, `Lead` e customizados.
- **Cloudflare Web Analytics** permitido na CSP.
- `/privacidade.html` existe.

### Stack proposta
**Astro (estático) + TypeScript + GSAP/ScrollTrigger + CSS próprio com design tokens.**
- HTML pré-renderizado: conteúdo indexável, LCP rápido e JS só nas "ilhas" (formulário, serviços, FAQ).
- Continua no GitHub Pages, sem custo novo de hospedagem.
- Animações com `prefers-reduced-motion` respeitado. No celular, versões leves (sem efeitos de cursor e sem pin pesado).
- Metas: Lighthouse 95+ em mobile, LCP < 2,0s, CLS ≈ 0, JS inicial < 60 KB.

### Fase 02 — Back-end primeiro
1. Módulo `lead-client` tipado e testado: validação, normalização do telefone (regra atual dos 55), UTMs, honeypot, montagem do payload **idêntico** ao de produção, timeout e tratamento de erro.
2. Testes automatizados do contrato (payload byte a byte igual ao atual), da validação e dos estados de erro e sucesso.
3. Consentimento + Pixel + eventos portados sem regressão; CSP revisada.
4. **Teste ponta a ponta real:** exige (a) uma origem permitida no CORS do worker e no Turnstile e (b) **sua autorização**, porque o teste cria um lead real no destino de vocês.

---

## 8. Riscos e pontos de atenção
- Sem acesso ao **código do worker**, não consigo ver o destino final dos leads (CRM? planilha? e-mail?). Mantenho o contrato atual e não altero o worker.
- Ambiente de **preview** (antes de ir ao ar) não consegue enviar leads enquanto o CORS e o Turnstile só aceitarem backe.com.br.
- Os números do hero **não serão publicados sem confirmação**.

---

## 9. Exploração visual — ideias ousadas (com fundamento)
1. **"Amanhecer" no scroll:** a página inteira é um ciclo de luz. O sol do símbolo sobe do hero até a conversão final, que é o meio-dia (a seção mais clara e quente). A narrativa de cor acompanha a narrativa comercial (dor → solução → ação).
2. **Serviços dentro do "b":** cada serviço revela sua imagem ou vídeo mascarado pelo bojo da logo. O símbolo vira uma "janela" para o trabalho.
3. **Cursor-luz:** no desktop, o glow radial acompanha o cursor com atraso suave, como se o visitante segurasse uma lanterna num ambiente escuro.
4. **Corte de 25° como assinatura:** botões com canto cortado no ângulo da haste. Pequeno, mas reconhecível sem a logo.
5. **Título-horizonte:** no hero, a curva em S passa por trás do título. Metade das letras fica iluminada por baixo e metade em sombra.

---

## 10. O que preciso de vocês
1. **Referências do Behance:** prints/exports das 6 páginas completas (ou PDFs com "salvar como PDF"). Sem isso, a análise das referências fica pendente.
2. **Logo em vetor** (SVG/AI/PDF), versões símbolo e wordmark, e o nome da fonte do "creative .co", se souberem.
3. **Confirmação da cor:** #FF6A00 como cor de ação e o degradê da logo como luz (§4). Ok?
4. **Números:** os 4 indicadores (+200 marcas, 3.8x ROI, +R$5M, 98%) são comprováveis? Quais mantenho?
5. **Prova social:** cases (antes/depois, números, prints), depoimentos (com nome, cargo e autorização), fotos e vídeos de trabalhos (audiovisual e drone principalmente). Autorização para exibir os 15 logos de clientes.
6. **Código:** onde está o repositório do site atual e o do worker `backe-lead-proxy`? Posso adicioná-los à sessão.
7. **Domínio principal:** backe.com.br ou backe.co?
8. **Preview e teste:** posso pedir para incluírem o domínio de preview no CORS do worker e no Turnstile? E autorizam um lead de teste real?
9. **Copy do hero:** escolher uma direção (abaixo) ou pedir outras.

### Direções de headline (hero)
- **A)** "Criatividade sem estratégia é barulho. / Estratégia sem criatividade é invisível." → "A Backe faz as duas coisas — pela sua empresa."
- **B)** "A gente pensa o seu negócio / antes de pensar no post."
- **C)** "Marcas fortes não são sorte. / São método com coragem."

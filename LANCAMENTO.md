# Lançamento do site novo em backe.com.br

Roteiro para trocar o site atual pelo novo. Situação conferida em 23/11/2026.

## Como está hoje

| Item | Situação |
|---|---|
| Domínio | `backe.com.br`, DNS na **GoDaddy** (ns27/ns28.domaincontrol.com) |
| Registros A | 185.199.108.153, .109.153, .110.153, .111.153 (GitHub Pages) — **não mudam** |
| `www` | CNAME para **`ahbreu.github.io`** (o site atual é publicado pela conta do GitHub **ahbreu**) |
| Site novo | `gabrielfelixback/sitebacke`, publicado pelo fluxo `.github/workflows/deploy-preview.yml` |
| Formulário | o site atual e o novo mandam para o mesmo Worker (`backe-lead-proxy`), que hoje **não entrega os leads em lugar nenhum** |

## 1. Antes da troca (bloqueios)

1. **Leads.** Publicar o Worker novo pelo painel da Cloudflare, seguindo `worker/README.md`, e mandar um lead
   "TESTE – pode apagar" pelo site atual. Só seguir quando a linha aparecer na planilha.
2. **E-mail de contato.** O site usa `contato@backe.co`, mas o domínio **backe.co não existe mais**: todo e-mail
   para esse endereço volta. Definir um e-mail que funcione (por exemplo, criar `contato@backe.com.br` no
   Google Workspace ou na GoDaddy) e trocar em `src/data/content.ts` (`CONTACT.email`) e em
   `public/privacidade.html`.
3. **Acesso à conta ahbreu.** Quem controla o repositório que hoje publica o site precisa participar da troca
   (passo 2 abaixo): o mesmo domínio não pode estar em dois repositórios do GitHub ao mesmo tempo.

## 2. Troca (cerca de 30 minutos, num horário de pouco movimento)

1. **Conta ahbreu** → repositório do site atual → Settings → Pages → Custom domain → **Remove**.
2. **gabrielfelixback/sitebacke** → Settings → Secrets and variables → Actions → aba Variables →
   **New repository variable**: `PRODUCTION` = `true`.
3. **gabrielfelixback/sitebacke** → Settings → Pages → Custom domain: `backe.com.br` → Save.
   O GitHub confere o DNS. Quando liberar, marcar **Enforce HTTPS** (o certificado sai em minutos, às vezes em algumas horas).
4. **GoDaddy** → DNS de backe.com.br → registro `www` (CNAME): trocar `ahbreu.github.io` por
   **`gabrielfelixback.github.io`**. Os registros A ficam como estão.
5. **gabrielfelixback/sitebacke** → Actions → "Deploy (GitHub Pages)" → **Run workflow**.
   Com `PRODUCTION = true`, o build sai para backe.com.br e uma trava impede publicar com `noindex` ou endereço errado.

## 3. Conferência logo depois

- [ ] `https://backe.com.br` abre o site novo (testar no celular, em aba anônima).
- [ ] `https://www.backe.com.br` e `http://backe.com.br` redirecionam para `https://backe.com.br`.
- [ ] Ver o código da página: **sem** `noindex`, `canonical` = `https://backe.com.br/`.
- [ ] Enviar um lead "TESTE – pode apagar": tela de sucesso, linha na planilha, e-mail de cópia.
- [ ] Meta Events Manager → Testar eventos: `PageView` ao abrir e `Lead` no envio.
- [ ] `https://backe.com.br/privacidade.html` abre e `https://backe.com.br/qualquer-coisa` mostra a página 404 da Backe.
- [ ] Google Search Console: adicionar a propriedade `backe.com.br` e enviar `https://backe.com.br/sitemap.xml`
      (o site atual dizia ao Google que o endereço oficial era `backe.co`, que não existe mais).

## 4. Se precisar voltar atrás

1. gabrielfelixback/sitebacke → Settings → Pages → remover o domínio; apagar a variável `PRODUCTION`.
2. Conta ahbreu → Settings → Pages → colocar `backe.com.br` de volta.
3. GoDaddy → `www` de volta para `ahbreu.github.io`.

## 5. Depois do lançamento (não bloqueiam)

- O link de prévia `gabrielfelixback.github.io/sitebacke` passa a redirecionar para backe.com.br.
  As prévias seguem pelo link do Claude.
- Atualizar o Astro da versão 5 para a 7. O `npm audit` aponta falhas no Astro, mas elas são de recursos que o
  site não usa (`define:vars`, server islands, imagens otimizadas) e de ferramentas que só rodam no build.
  Fazer com calma, com o teste completo depois.
- Cache: o GitHub Pages guarda os arquivos por só 10 minutos e isso não pode ser mudado. Para cache longo
  (vídeos e fontes), colocar a Cloudflare na frente do domínio.
- Opcional, segurança: verificar o domínio na conta do GitHub (Settings → Pages → Verified domains), para
  ninguém mais conseguir usar `backe.com.br` em outro repositório.

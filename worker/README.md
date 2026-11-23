> **NÃO PUBLICAR.** Decisão de 23/11/2026 (documento "Backe: infraestrutura, perguntas e configuração do
> WhatsApp"): a Backe mantém o sistema de leads que já está no ar no Worker `backe-lead-proxy`
> (leads gravados no banco D1 da Cloudflare, reenvio automático, API oficial do WhatsApp da Meta).
> Esta pasta é só uma proposta antiga, guardada como referência. Publicá-la **apagaria** o sistema atual.

# backe-lead-proxy (proposta: planilha + WhatsApp)

Código do Worker que recebe o formulário do site (`POST /api/leads`) e entrega cada lead, em paralelo, na
Google Planilha (Apps Script) e no WhatsApp (CallMeBot). Foi escrito **sem acesso ao Worker que está no ar**:
antes de publicar, quem tem acesso à Cloudflare precisa juntar com o código atual.

## Publicar pelo painel da Cloudflare (sem wrangler)

O Bruno confirmou em 19/11 que os leads do site atual não caíam em lugar nenhum, então este Worker substitui o atual inteiro.

1. Cloudflare → **Workers & Pages → backe-lead-proxy → Edit code**. Antes de apagar, copie o código atual para um arquivo à parte (backup).
2. Apague tudo e cole o conteúdo de `worker/dist/backe-lead-proxy.js` (gerado por `node worker/build-paste.cjs`). Clique em **Deploy**.
3. **Settings → Variables and Secrets**:
   - Secret `SHEETS_WEBHOOK_URL`: a URL `/exec` do Apps Script.
   - Secret `SHEETS_SECRET`: a mesma senha do `SECRET` do Apps Script (digitar direto aqui, sem passar por chat).
   - Variable `SHEET_URL`: o link da planilha.
   - Secret `WA_PROVIDER`: `callmebot` (os números e apikeys entram depois).
   - Confira se já existe o segredo do Turnstile. O código aceita os nomes `TURNSTILE_SECRET`, `TURNSTILE_SECRET_KEY`,
     `TURNSTILE_SECRETKEY`, `CF_TURNSTILE_SECRET` ou `TURNSTILE_KEY`. Se não existir, crie `TURNSTILE_SECRET` com a
     Secret Key do widget (Cloudflare → Turnstile → o widget do site → Settings).
4. Opcional (limite de 5 envios a cada 10 min por IP): Storage & Databases → KV → criar `RATE_KV` e, em
   Settings → Bindings do Worker, ligar como **KV namespace** com o nome `RATE_KV`.
5. Abrir **Logs → Begin log stream** (é o `wrangler tail` do painel) e fazer o envio de teste pelo celular com o nome
   **TESTE – pode apagar**. A linha esperada é `{"leadId":"…","test":true,"sheetOk":true,"waOk":false,"currentOk":null}`.
   Se aparecer `turnstile_secret_missing`, o segredo do Turnstile está com outro nome (passo 3).

## Testes automáticos

`npm test` na raiz roda `worker/test/worker.test.js` (fetch simulado, nada sai para a internet):
entrega dupla, planilha falhando com 1 nova tentativa, WhatsApp com apikey errada, as duas falhas (502),
honeypot, Turnstile inválido, sem token, CORS e limite por IP.

## Testes depois de publicar (seção 4 do pedido)

```bash
# 1. senha errada no Apps Script: deve responder {"ok":false,"error":"unauthorized"} e não criar linha.
#    Sem "-X POST": o /exec responde 302 e o curl precisa seguir com GET (como o fetch do Worker faz).
curl -sL "$SHEETS_WEBHOOK_URL" -H 'Content-Type: application/json' -d '{"secret":"errada","lead":{"id":"teste-senha"}}'
```

2. Envio real pelo celular em https://backe.com.br com nome **TESTE – pode apagar**: linha no topo da planilha,
   mensagem no WhatsApp marcada 🧪 TESTE e e-mail com [TESTE] no assunto.
3. Falha da planilha: num Worker de teste, `SHEETS_WEBHOOK_URL` errada → o WhatsApp chega e o visitante vê sucesso.
4. As duas falhas → o visitante vê a mensagem de erro do formulário.
5. Honeypot / Turnstile inválido → nada chega em lugar nenhum.
6. Tempo entre "Enviar" e a tela de sucesso (meta < 3 s): ver nos Logs a linha `{"leadId":…,"sheetOk":…,"waOk":…}`.

Acompanhar ao vivo: `npx wrangler tail backe-lead-proxy`.

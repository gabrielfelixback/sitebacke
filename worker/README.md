# backe-lead-proxy (proposta: planilha + WhatsApp)

Código do Worker que recebe o formulário do site (`POST /api/leads`) e entrega cada lead, em paralelo, na
Google Planilha (Apps Script) e no WhatsApp (CallMeBot). Foi escrito **sem acesso ao Worker que está no ar**:
antes de publicar, quem tem acesso à Cloudflare precisa juntar com o código atual.

## Antes de publicar (obrigatório)

1. Abrir o Worker atual (painel da Cloudflare → Workers → `backe-lead-proxy` → Edit code, ou o repositório dele) e
   anotar **para onde os leads vão hoje**. Colar essa entrega em `sendToCurrentDestination()` (em `src/index.js`),
   para ela continuar funcionando junto com os dois destinos novos.
2. Conferir o nome do segredo do Turnstile no Worker atual. Aqui ele se chama `TURNSTILE_SECRET`.
3. Cadastrar os segredos (lista no `wrangler.toml`). Nada disso vai para o front-end nem para o repositório.

## Testes automáticos

`npm test` na raiz roda `worker/test/worker.test.js` (fetch simulado, nada sai para a internet):
entrega dupla, planilha falhando com 1 nova tentativa, WhatsApp com apikey errada, as duas falhas (502),
honeypot, Turnstile inválido, sem token, CORS e limite por IP.

## Testes depois de publicar (seção 4 do pedido)

```bash
# 1. senha errada no Apps Script: deve responder {"ok":false,"error":"unauthorized"} e não criar linha
curl -sL -X POST "$SHEETS_WEBHOOK_URL" -H 'Content-Type: application/json' -d '{"secret":"errada","lead":{"id":"teste-senha"}}'
```

2. Envio real pelo celular em https://backe.com.br com nome **TESTE – pode apagar**: linha no topo da planilha,
   mensagem no WhatsApp marcada 🧪 TESTE e e-mail com [TESTE] no assunto.
3. Falha da planilha: num Worker de teste, `SHEETS_WEBHOOK_URL` errada → o WhatsApp chega e o visitante vê sucesso.
4. As duas falhas → o visitante vê a mensagem de erro do formulário.
5. Honeypot / Turnstile inválido → nada chega em lugar nenhum.
6. Tempo entre "Enviar" e a tela de sucesso (meta < 3 s): ver nos Logs a linha `{"leadId":…,"sheetOk":…,"waOk":…}`.

Acompanhar ao vivo: `npx wrangler tail backe-lead-proxy`.

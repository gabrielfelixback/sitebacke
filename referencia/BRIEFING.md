# Briefing — BACKE.co (análise do site atual backe.com.br)

## Quem é a Backe
- **BACKE.co** — "Agência de Marketing Estratégico & Criativo", Brasília/DF, atende Brasil e mundo (remoto).
- Posicionamento: **"Estratégia que conecta. Criatividade que converte."** Não escolher entre criativo e estratégico — fazer os dois.
- Visão: "Marketing sem alma não vende. Criatividade sem estratégia não escala." Decisões começam em dados e terminam em execução criativa. "Não terceirizamos o pensamento." Time sênior, sem terceirização do atendimento.
- Tom de voz: direto, confiante, sem enrolação ("Chega de queimar verba", "Sem metodologia com nome bonito que não entrega nada", "Pronto para parar de deixar dinheiro na mesa?").
- Contato: WhatsApp/telefone +55 61 9224-0234 · contato@backe.co · Instagram @backe.co
- Horário: seg–sex 9h–18h, sáb 9h–13h. Pagamento: PIX, cartão, boleto, transferência.

## Números (hero)
+200 marcas atendidas · 3.8x ROI médio · +R$5M investidos em mídia · 98% clientes satisfeitos

## Clientes (logos em `logos-clientes/`)
5uinta, Açaí, Assim, Fazendinho, Funn, Globo, Nossa, Panela, PL4NO, Pueblito, Quituarte, Rede dos Cosméticos, Sexta, Trust, World Gym

## Serviços (9) — categoria · descrição · impacto
| Serviço | Categoria | O que é | Impacto no negócio |
|---|---|---|---|
| Tráfego Pago | Marketing Digital | Meta Ads e Google Ads com foco em performance; público certo, momento certo, criativo certo | Investimento vira demanda previsível; mostra quais campanhas trazem oportunidades |
| Gestão de Redes Sociais | Marketing Digital | Calendário editorial, produção de conteúdo, gestão de comunidade | Marca presente na rotina, confiança antes da compra, mais entradas comerciais |
| Estratégia & Performance | Estratégia | Planejamento, metas, análise de dados, relatórios, otimização | Conecta marketing a metas comerciais, orçamento no que tem retorno |
| Treinamento & Capacitação de Vendas | Estratégia | Metodologias, scripts, técnicas de fechamento, inteligência de mercado | Melhor atendimento, menos oportunidades perdidas, processo replicável |
| Branding & Identidade Visual | Criação & Design | Logo, paleta, tipografia, brandbook | Mais valor percebido, diferenciação, confiança |
| Design Gráfico & Motions | Criação & Design | Peças digital/impresso, motion graphics, vídeos animados | Comunicação percebida mais rápido, retenção, consistência |
| Criação de Sites & Landing Pages | Criação & Design | Sites e LPs para conversão, responsivo, copy, integração CRM/automação | Visitas viram oportunidades 24h |
| Captação Audiovisual | Audiovisual | Vídeos para campanhas, redes, institucional; direção, gravação, edição | Mais atenção, confiança e convencimento |
| Captação com Drone | Audiovisual | Aéreas em alta resolução: imóveis, eventos, campanhas | Perspectiva marcante, oferta se destaca |

Faixa animada: Tráfego Pago · Gestão de Redes · Branding · Captação Audiovisual · Design Gráfico · Drone · Sites & Landing Pages · Motion Graphics · Capacitação de Vendas · Performance

## Processo (4 passos)
1. **Diagnóstico gratuito** — mapeia negócio, mercado e oportunidades. Sem compromisso.
2. **Plano personalizado** — do zero, nada de pacote padrão.
3. **Execução com responsabilidade** — prazo cumprido, transparência em tempo real.
4. **Crescimento sustentável** — otimização contínua, motor de crescimento.

## FAQ
- **Tempo para resultados?** Tráfego: dados nos primeiros dias; consolida entre 60–90 dias.
- **Atendem fora de Brasília?** Sim, Brasil e mundo remoto; audiovisual/drone com logística no escopo.
- **Contrato?** Mensal renovável; gestão contínua recomenda mínimo de 3 meses.
- **Investimento mínimo?** Proposta personalizada após diagnóstico, valores claros.
- **Acompanhamento?** Relatórios mensais, indicadores, reuniões; acesso às plataformas quando aplicável.
- **Criativos?** Depende do escopo: em criação/design/audiovisual a Backe produz; em gestão pura entrega roteiros, briefings e direção criativa.

## Seção de contato
"Pronto para parar de deixar dinheiro na mesa?" — especialista retorna em até 24h com diagnóstico real.
Bullets: Diagnóstico 100% gratuito · Resposta em até 24h úteis · Estratégia personalizada para o seu nicho · Time sênior, sem terceirização · Sem contrato de fidelidade forçada.

## FORMULÁRIO (obrigatório manter — integração em produção)
Formulário em 2 etapas ("Solicite seu diagnóstico gratuito" → "Quase lá!").
- **Etapa 1:** Nome completo* · Telefone/WhatsApp* (máscara `(00) 90000-0000`) → "Continuar"
- **Etapa 2:** E-mail* · Empresa/Instagram* (`@suamarca`) · Nicho* (select) · Faturamento médio mensal* (select) · Turnstile → "Enviar e garantir meu diagnóstico" (+ botão voltar)
- Honeypot oculto: campo `website` (se preenchido, rejeita).
- Nichos: E-commerce, Serviços / Consultoria, Saúde e Bem-estar, Educação / Infoprodutos, Alimentação / Food, Imobiliário, Moda & Beleza, Tecnologia / SaaS, Varejo Físico, Jurídico / Contábil, Outro
- Faturamento: Ainda estou começando (pré-faturamento) · Até R$ 10.000/mês · R$ 10.000 - R$ 50.000/mês · R$ 50.000 - R$ 150.000/mês · R$ 150.000 - R$ 500.000/mês · Acima de R$ 500.000/mês
- Campo `interesse` (serviceInterest) — preenchido pelos botões "Quero aplicar isso" dos serviços.
- Validação: WhatsApp normalizado só dígitos, 10–15 dígitos, prefixa `55` se 10/11 dígitos.
- UTMs (source, medium, campaign, term, content) capturados da URL e guardados em sessionStorage.

**Envio:** `POST https://backe-lead-proxy.backeco.workers.dev/api/leads` (JSON)
```json
{
  "company": "BACKE.co", "environment": "production", "source": "website",
  "formId": "website-contact-form", "pageUrl": "...", "pageTitle": "...",
  "utm": {"source":null,"medium":null,"campaign":null,"term":null,"content":null},
  "lead": {"name":"", "email":"(lowercase|null)", "phone":"55...", 
           "message":"Nicho da empresa: X\nFaturamento mensal: Y",
           "serviceInterest":"(|null)", "companyName":"(|null)"},
  "seller": {"name":null,"phone":null},
  "metadata": {"userAgent":"...","submittedAt":"ISO"},
  "website": "(honeypot)", "turnstileToken": "..."
}
```
Resposta: erro se `!ok` ou `json.ok === false` (usa `json.message`). Sucesso: toast "Recebemos sua solicitação. Um especialista da BACKE.co vai entrar em contato em breve." Em erro: "Tentar novamente" + "Falar no WhatsApp".
- **Cloudflare Turnstile** sitekey `0x4AAAAAAD2AsXg5qWTuVN53`, action `lead_form`, theme dark.
- **Meta Pixel** ID `1581141176961983` — só carrega após consentimento (banner "Recusar/Aceitar marketing"); `track Lead` no sucesso; eventos custom (cta_click, form_submit_attempt, contact_whatsapp…).
- CSP restritiva no `<head>` (permitir worker, challenges.cloudflare.com, connect.facebook.net, cloudflareinsights).
- Página `/privacidade.html` existente.

## Identidade visual atual
- Fundo quase preto (#0b0b0b / #131313), bordas #2a2a2a.
- Gradiente laranja → coral: #f07020 → #ff404f (também #ea6972 rosa). WhatsApp #25d366.
- Fontes: Montserrat (principal), Poppins, Inter, display "Acworth".
- Hero centralizado, headline enorme com palavras em gradiente, botões pill.
- Logo: `logo-backe.png`. Screenshot completo: `site-atual-full.png`.

## SEO/metadados atuais
Title: "BACKE.co — Agência de Marketing Estratégico & Criativo". Schema.org LocalBusiness + Service. Canonical backe.co (site responde em backe.com.br).

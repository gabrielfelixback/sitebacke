/**
 * NÃO PUBLICAR (decisão de 23/11/2026): a Backe mantém o sistema de leads que já está no ar
 * (D1 + API oficial do WhatsApp). Este arquivo é só uma proposta antiga, guardada como referência.
 *
 * backe-lead-proxy — POST /api/leads
 *
 * Destino atual: nenhum. O Bruno confirmou em 19/11 que os leads do site atual não caíam em lugar
 * nenhum; por isso `sendToCurrentDestination` devolve null. Se um dia houver outro destino, ele entra lá.
 * Para publicar pelo painel: colar worker/dist/backe-lead-proxy.js em Workers & Pages → backe-lead-proxy → Edit code.
 *
 * Fluxo: CORS → limite por IP → JSON → honeypot → Turnstile (siteverify, no servidor)
 *        → normaliza e corta os campos → entrega em paralelo (planilha + WhatsApp + destino atual)
 *        → 200 se pelo menos um destino recebeu; 502 se todos falharam.
 *
 * Segredos (wrangler secret put): TURNSTILE_SECRET (aceita também os nomes TURNSTILE_SECRET_KEY,
 *   TURNSTILE_SECRETKEY, CF_TURNSTILE_SECRET e TURNSTILE_KEY, para servir com o segredo que já existe), SHEETS_WEBHOOK_URL, SHEETS_SECRET,
 *   WA_PROVIDER, CALLMEBOT_PHONES, CALLMEBOT_APIKEYS.
 * Variáveis comuns (wrangler.toml): SHEET_URL, EXTRA_ORIGINS (opcional, ex.: domínio de preview).
 * KV opcional: RATE_KV (limite de 5 envios a cada 10 min por IP).
 */

const ORIGINS = ['https://backe.com.br', 'https://www.backe.com.br'];
const TURNSTILE_ACTION = 'lead_form';
const RATE_LIMIT = 5;
const RATE_WINDOW_S = 600;
const DELIVERY_TIMEOUT_MS = 9000;
const MAX = { name: 120, email: 160, companyName: 160, phone: 20, niche: 120, revenue: 120, serviceInterest: 120, pageUrl: 500, userAgent: 300, utm: 200 };
const MSG_INVALID = 'Não foi possível validar o envio. Atualize a página e tente novamente.';
const MSG_RATE = 'Muitos envios em pouco tempo. Aguarde alguns minutos ou fale conosco pelo WhatsApp.';

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
};

export async function handle(request, env, ctx = { waitUntil() {} }) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const allowed = allowedOrigins(env);
  const cors = allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : null;
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...(cors || {}) } });

  if (url.pathname !== '/api/leads') return json({ ok: false, message: 'Not found' }, 404);
  if (!cors) return new Response(null, { status: 403 });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await underRateLimit(env, ip))) return json({ ok: false, message: MSG_RATE }, 429);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: MSG_INVALID }, 400);
  }

  // honeypot: robô preencheu o campo escondido → descarta sem entregar nada (resposta neutra)
  if (payload && typeof payload.website === 'string' && payload.website.trim() !== '') {
    console.log(JSON.stringify({ event: 'honeypot_drop' }));
    return json({ ok: true });
  }

  // Turnstile validado NO SERVIDOR antes de qualquer entrega
  if (!(await verifyTurnstile(env, payload?.turnstileToken, ip))) return json({ ok: false, message: MSG_INVALID }, 400);

  const lead = normalizeLead(payload);
  if (!lead.name || !lead.phone) return json({ ok: false, message: MSG_INVALID }, 400);

  const tasks = [withTimeout(sendToSheet(env, lead), DELIVERY_TIMEOUT_MS), withTimeout(sendWhatsApp(env, lead), DELIVERY_TIMEOUT_MS)];
  const current = sendToCurrentDestination(env, payload, lead);
  if (current) tasks.push(withTimeout(current, DELIVERY_TIMEOUT_MS));
  const results = await Promise.allSettled(tasks);
  const okAt = (i) => results[i]?.status === 'fulfilled' && results[i].value === true;
  const sheetOk = okAt(0);
  const waOk = okAt(1);
  const currentOk = current ? okAt(2) : null;
  console.log(JSON.stringify({ leadId: lead.id, test: lead.test, sheetOk, waOk, currentOk }));

  if (!sheetOk && !waOk && currentOk !== true) return json({ ok: false }, 502);
  return json({ ok: true });
}

/* ───────────────── destino que existia antes ─────────────────
   Nenhum (confirmado pelo Bruno em 19/11). Se um dia houver outro destino, devolver aqui uma Promise<boolean>. */
export function sendToCurrentDestination(env, payload, lead) {
  return null;
}

/* ───────────────── normalização ───────────────── */
const cut = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, n);

export function normalizeLead(p) {
  const msg = String(p?.lead?.message || '');
  const pick = (label) => (msg.match(new RegExp(label + ':\\s*(.+)')) || [])[1]?.trim() || '';
  const utm = p?.utm || {};
  const name = cut(p?.lead?.name, MAX.name);
  return {
    id: crypto.randomUUID(),
    submittedAt: cut(p?.metadata?.submittedAt, 40) || new Date().toISOString(),
    name,
    phone: cut(String(p?.lead?.phone || '').replace(/\D/g, ''), MAX.phone), // já vem com 55
    email: cut(p?.lead?.email, MAX.email),
    companyName: cut(p?.lead?.companyName, MAX.companyName),
    niche: cut(pick('Nicho da empresa'), MAX.niche),
    revenue: cut(pick('Faturamento mensal'), MAX.revenue),
    serviceInterest: cut(p?.lead?.serviceInterest, MAX.serviceInterest),
    pageUrl: cut(p?.pageUrl, MAX.pageUrl),
    userAgent: cut(p?.metadata?.userAgent, MAX.userAgent),
    utm: {
      source: cut(utm.source, MAX.utm) || null,
      medium: cut(utm.medium, MAX.utm) || null,
      campaign: cut(utm.campaign, MAX.utm) || null,
      term: cut(utm.term, MAX.utm) || null,
      content: cut(utm.content, MAX.utm) || null,
    },
    test: /^TESTE/i.test(name),
  };
}

/* ───────────────── planilha (Apps Script) ───────────────── */
export async function sendToSheet(env, lead) {
  if (!env.SHEETS_WEBHOOK_URL) return false;
  const body = JSON.stringify({ secret: env.SHEETS_SECRET, lead });
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        redirect: 'follow', // o /exec responde 302 → seguir
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) return true;
      console.error('sheet_error', r.status, j.error);
    } catch (e) {
      console.error('sheet_fetch', String(e));
    }
  }
  return false;
}

/* ───────────────── WhatsApp ───────────────── */
export function waText(env, l) {
  const origem = [l.utm.source, l.utm.medium, l.utm.campaign].filter(Boolean).join(' / ') || 'direto';
  const fone = l.phone.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '+55 $1 $2-$3');
  return [
    (l.test ? '🧪 *TESTE* ' : '🟠 ') + '*Novo lead pelo site*',
    '',
    `*Nome:* ${l.name}`,
    `*WhatsApp:* ${fone}`,
    `*E-mail:* ${l.email || '—'}`,
    `*Empresa / Instagram:* ${l.companyName || '—'}`,
    `*Nicho:* ${l.niche || '—'}`,
    `*Faturamento:* ${l.revenue || '—'}`,
    `*Interesse:* ${l.serviceInterest || '—'}`,
    `*Origem:* ${origem}`,
    '',
    `👉 Chamar agora: https://wa.me/${l.phone}`,
    env.SHEET_URL ? `📊 Planilha: ${env.SHEET_URL}` : '',
  ]
    .filter((x, i, a) => x !== '' || a[i - 1] !== '')
    .join('\n')
    .replace(/\n+$/, '');
}

export async function sendWhatsApp(env, lead) {
  if (env.WA_PROVIDER === 'cloudapi') return sendWhatsAppCloud(env, lead);
  const phones = (env.CALLMEBOT_PHONES || '').split(',').map((s) => s.trim()).filter(Boolean);
  const keys = (env.CALLMEBOT_APIKEYS || '').split(',').map((s) => s.trim());
  if (!phones.length) return false;
  const text = waText(env, lead);
  const sends = phones.map(async (phone, i) => {
    const u = new URL('https://api.callmebot.com/whatsapp.php');
    u.searchParams.set('phone', phone);
    u.searchParams.set('apikey', keys[i] || '');
    u.searchParams.set('text', text);
    const r = await fetch(u);
    const t = await r.text();
    // CONFERIR na primeira resposta real qual texto o CallMeBot devolve no sucesso e ajustar esta checagem
    if (!r.ok || /error|invalid/i.test(t.slice(0, 300))) throw new Error(`callmebot ${r.status}: ${t.slice(0, 120)}`);
    return true;
  });
  const res = await Promise.allSettled(sends);
  res.forEach((x) => x.status === 'rejected' && console.error('wa_error', String(x.reason)));
  return res.some((x) => x.status === 'fulfilled');
}

// Seção 5 do pedido (depois): WhatsApp Cloud API oficial. Ainda não implementado de propósito.
async function sendWhatsAppCloud(env, lead) {
  console.error('wa_cloudapi_not_configured');
  return false;
}

/* ───────────────── Turnstile, limite, utilidades ───────────────── */
// o segredo do Turnstile pode ter sido cadastrado com outro nome no Worker que já existe
const turnstileSecret = (env) => env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRETKEY || env.CF_TURNSTILE_SECRET || env.TURNSTILE_KEY || '';

export async function verifyTurnstile(env, token, ip) {
  const secret = turnstileSecret(env);
  if (!token || typeof token !== 'string' || token.length > 2048 || !secret) {
    if (!secret) console.error('turnstile_secret_missing');
    return false;
  }
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const d = await r.json();
    if (!d.success) return false;
    if (d.action && d.action !== TURNSTILE_ACTION) return false;
    const hosts = allowedOrigins(env).map((o) => new URL(o).hostname);
    if (d.hostname && !hosts.includes(d.hostname)) return false;
    return true;
  } catch (e) {
    console.error('turnstile_fetch', String(e));
    return false;
  }
}

// 5 envios a cada 10 min por IP, num KV (aproximado: o KV é eventualmente consistente, suficiente contra lixo em massa)
export async function underRateLimit(env, ip) {
  if (!env.RATE_KV || !ip) return true;
  const key = `rl:${ip}:${Math.floor(Date.now() / 1000 / RATE_WINDOW_S)}`;
  const n = Number((await env.RATE_KV.get(key)) || 0);
  if (n >= RATE_LIMIT) return false;
  await env.RATE_KV.put(key, String(n + 1), { expirationTtl: RATE_WINDOW_S + 60 });
  return true;
}

function allowedOrigins(env) {
  const extra = (env.EXTRA_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return [...ORIGINS, ...extra];
}

export function withTimeout(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => (t = setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms)))]).finally(() => clearTimeout(t));
}

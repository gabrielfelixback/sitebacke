// Testes do Worker com fetch simulado: nada sai para a internet.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handle, normalizeLead, waText } from '../src/index.js';

const PAYLOAD = {
  company: 'BACKE.co',
  pageUrl: 'https://backe.com.br/',
  utm: { source: 'instagram', medium: 'bio', campaign: 'novembro', term: null, content: null },
  lead: {
    name: 'TESTE – pode apagar',
    email: 'contato@backe.co',
    phone: '5561982640887',
    message: 'Nicho da empresa: E-commerce\nFaturamento mensal: De R$ 50 mil a R$ 100 mil',
    serviceInterest: 'Tráfego Pago',
    companyName: '@backe.co',
  },
  metadata: { userAgent: 'iPhone', submittedAt: '2026-11-18T12:00:00.000Z' },
  website: '',
  turnstileToken: 'token-ok',
};
const ENV = {
  TURNSTILE_SECRET: 'ts-secret',
  SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/X/exec',
  SHEETS_SECRET: 'senha',
  WA_PROVIDER: 'callmebot',
  CALLMEBOT_PHONES: '+5561900000001,+5561900000002',
  CALLMEBOT_APIKEYS: 'k1,k2',
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/abc',
};

let calls;
let behave;
function mockFetch() {
  calls = { turnstile: 0, sheet: [], wa: [] };
  globalThis.fetch = vi.fn(async (input, init = {}) => {
    const u = String(input);
    if (u.includes('turnstile/v0/siteverify')) {
      calls.turnstile++;
      const tok = init.body.get('response');
      return Response.json(tok === 'token-ok' ? { success: true, action: 'lead_form', hostname: 'backe.com.br' } : { success: false });
    }
    if (u.startsWith('https://script.google.com')) {
      calls.sheet.push(JSON.parse(init.body));
      if (behave.sheet === 'fail') return Response.json({ ok: false, error: 'boom' }, { status: 500 });
      if (behave.sheet === 'throw') throw new Error('network');
      return Response.json({ ok: true });
    }
    if (u.startsWith('https://api.callmebot.com')) {
      calls.wa.push(new URL(u));
      if (behave.wa === 'fail') return new Response('APIKey is invalid. Error', { status: 200 });
      return new Response('Message queued. You will receive it in a few seconds.', { status: 200 });
    }
    throw new Error('fetch inesperado: ' + u);
  });
}
const req = (body, origin = 'https://backe.com.br', method = 'POST') =>
  new Request('https://backe-lead-proxy.backeco.workers.dev/api/leads', {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  behave = {};
  mockFetch();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('normalizeLead', () => {
  it('separa nicho e faturamento e marca TESTE', () => {
    const l = normalizeLead(PAYLOAD);
    expect(l.niche).toBe('E-commerce');
    expect(l.revenue).toBe('De R$ 50 mil a R$ 100 mil');
    expect(l.phone).toBe('5561982640887');
    expect(l.test).toBe(true);
    expect(l.id).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('corta campos longos', () => {
    const l = normalizeLead({ ...PAYLOAD, lead: { ...PAYLOAD.lead, name: 'x'.repeat(500), email: 'e'.repeat(500), companyName: 'c'.repeat(500) } });
    expect([l.name.length, l.email.length, l.companyName.length]).toEqual([120, 160, 160]);
  });
});

describe('mensagem do WhatsApp', () => {
  it('tem todos os campos, telefone formatado e links', () => {
    const t = waText(ENV, normalizeLead(PAYLOAD));
    expect(t).toContain('🧪 *TESTE* *Novo lead pelo site*');
    expect(t).toContain('*WhatsApp:* +55 61 98264-0887');
    expect(t).toContain('*Nicho:* E-commerce');
    expect(t).toContain('*Origem:* instagram / bio / novembro');
    expect(t).toContain('https://wa.me/5561982640887');
    expect(t).toContain('📊 Planilha: https://docs.google.com/spreadsheets/d/abc');
  });
});

describe('/api/leads', () => {
  it('entrega na planilha e nos dois WhatsApp → 200', async () => {
    const r = await handle(req(PAYLOAD), ENV);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(calls.sheet).toHaveLength(1);
    expect(calls.sheet[0].secret).toBe('senha');
    expect(calls.sheet[0].lead.niche).toBe('E-commerce');
    expect(calls.wa.map((u) => u.searchParams.get('phone'))).toEqual(['+5561900000001', '+5561900000002']);
    expect(calls.wa.map((u) => u.searchParams.get('apikey'))).toEqual(['k1', 'k2']);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('https://backe.com.br');
  });
  it('planilha falha (com 1 nova tentativa) mas WhatsApp chega → visitante vê sucesso', async () => {
    behave.sheet = 'fail';
    const r = await handle(req(PAYLOAD), ENV);
    expect(r.status).toBe(200);
    expect(calls.sheet).toHaveLength(2);
  });
  it('WhatsApp falha (apikey errada) mas a planilha chega → sucesso, sem marcar o WhatsApp como ok', async () => {
    behave.wa = 'fail';
    const r = await handle(req(PAYLOAD), ENV);
    expect(r.status).toBe(200);
    const log = console.log.mock.calls.map((c) => c[0]).find((s) => s.includes('leadId'));
    expect(JSON.parse(log)).toMatchObject({ sheetOk: true, waOk: false });
  });
  it('os dois falham → 502 (o front mostra o erro que já existe)', async () => {
    behave.sheet = 'throw';
    behave.wa = 'fail';
    const r = await handle(req(PAYLOAD), ENV);
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ok: false });
  });
  it('honeypot preenchido → nada é entregue (nem Turnstile é chamado)', async () => {
    const r = await handle(req({ ...PAYLOAD, website: 'http://spam' }), ENV);
    expect(r.status).toBe(200);
    expect(calls.turnstile + calls.sheet.length + calls.wa.length).toBe(0);
  });
  it('Turnstile inválido → 400 e nada é entregue', async () => {
    const r = await handle(req({ ...PAYLOAD, turnstileToken: 'falso' }), ENV);
    expect(r.status).toBe(400);
    expect(calls.sheet.length + calls.wa.length).toBe(0);
  });
  it('sem token → 400 sem chamar a Cloudflare', async () => {
    const r = await handle(req({ ...PAYLOAD, turnstileToken: '' }), ENV);
    expect(r.status).toBe(400);
    expect(calls.turnstile).toBe(0);
  });
  it('CORS: só backe.com.br e www', async () => {
    expect((await handle(req(PAYLOAD, 'https://evil.example'), ENV)).status).toBe(403);
    const pre = await handle(req(null, 'https://www.backe.com.br', 'OPTIONS'), ENV);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('https://www.backe.com.br');
  });
  it('limite por IP: o 6º envio em 10 min recebe 429', async () => {
    const store = new Map();
    const env = { ...ENV, RATE_KV: { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) } };
    const st = [];
    for (let i = 0; i < 6; i++) st.push((await handle(req(PAYLOAD), env)).status);
    expect(st).toEqual([200, 200, 200, 200, 200, 429]);
  });
});

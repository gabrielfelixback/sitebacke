/**
 * Meta Pixel com consentimento — mesmo comportamento e mesma chave
 * de armazenamento do site atual (`backe_marketing_consent`), para
 * preservar a escolha de quem já visitou.
 */

export const PIXEL_ID = '1581141176961983';
export const CONSENT_KEY = 'backe_marketing_consent';
export type Consent = 'accepted' | 'rejected' | null;

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...a: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(v: Exclude<Consent, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* sem storage: a escolha vale só para esta visita */
  }
  if (v === 'accepted') loadPixel();
  else window.fbq?.('consent', 'revoke');
}

let loaded = false;
export function loadPixel(): boolean {
  if (!PIXEL_ID || typeof window === 'undefined') return false;
  if (loaded) return true;
  if (!window.fbq) {
    const fbq: Fbq = (...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = fbq;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  loaded = true;
  return true;
}

/** Eventos customizados — mesmos nomes do site atual. Só disparam com consentimento. */
export function track(event: string, params: Record<string, unknown> = {}) {
  window.fbq?.('trackCustom', event, params);
}

export function trackLead() {
  window.fbq?.('track', 'Lead', { content_name: 'Diagnóstico estratégico' });
}

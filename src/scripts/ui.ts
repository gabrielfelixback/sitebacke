import { readConsent, saveConsent, loadPixel, track } from '../lib/tracking';
import { asset } from '../lib/url';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

/* ───── Cabeçalho: fundo após rolar, esconde ao descer, volta ao subir ───── */
const header = $('[data-header]');
let lastY = window.scrollY;
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  const menuOpen = header?.classList.contains('menu-open');
  if (!menuOpen) header?.classList.toggle('is-hidden', y > lastY && y > 400);
  lastY = y;
  ticking = false;
}
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  },
  { passive: true },
);
onScroll();

/* nav ativa conforme a seção visível */
const navLinks = $$<HTMLAnchorElement>('.hdr__nav a');
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
navLinks.forEach((a) => {
  const el = document.querySelector(a.getAttribute('href')!);
  if (el) spy.observe(el);
});

/* ───── Menu mobile ───── */
const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
const menu = $('[data-menu]');
function setMenu(open: boolean) {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.sr-only')!.textContent = open ? 'Fechar menu' : 'Abrir menu';
  menu.hidden = !open;
  header?.classList.toggle('menu-open', open);
  if (open) header?.classList.add('is-scrolled');
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

/* ───── Acordeão de serviços (um aberto por vez) ───── */
$$<HTMLButtonElement>('.front__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.front')!;
    const willOpen = !item.classList.contains('is-open');
    $$('.front.is-open').forEach((o) => {
      o.classList.remove('is-open');
      o.querySelector('.front__btn')!.setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      track('service_open', { front: btn.dataset.front });
    }
  });
});

/* ───── FAQ ───── */
$$<HTMLButtonElement>('.qa__q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const qa = btn.closest('.qa')!;
    const open = !qa.classList.contains('is-open');
    qa.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) track('faq_open', { question: btn.textContent?.trim().slice(0, 80) });
  });
});

/* ───── Luz que acompanha o cursor no hero (só ponteiro fino) ───── */
const hero = $('[data-hero]');
const light = $('[data-cursor-light]');
if (hero && light && matchMedia('(pointer: fine)').matches) {
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    light.style.setProperty('--mx', `${e.clientX - r.left}px`);
    light.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

/* ───── Rastreamento de CTAs (só dispara com consentimento) ───── */
document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-cta]');
  if (!el) return;
  const src = el.dataset.cta!;
  if (src.includes('whatsapp')) track('contact_whatsapp', { source: src });
  else if (src.includes('instagram')) track('contact_instagram', { source: src });
  else track('cta_click', { source: src, destination: el.getAttribute('href') });
});

/* ───── Consentimento ───── */
const banner = $('[data-consent]');
function showBanner(show: boolean) {
  if (banner) banner.hidden = !show;
}
const consent = readConsent();
if (consent === 'accepted') loadPixel();
if (consent === null) setTimeout(() => showBanner(true), 1200);
$$<HTMLButtonElement>('[data-consent-choice]').forEach((b) =>
  b.addEventListener('click', () => {
    saveConsent(b.dataset.consentChoice as 'accepted' | 'rejected');
    showBanner(false);
  }),
);
$('[data-consent-open]')?.addEventListener('click', () => showBanner(true));

/* ───── CTA fixo no mobile: aparece depois do hero, some perto do formulário ───── */
const mcta = $('[data-mobile-cta]');
if (mcta && hero) {
  const contact = $('[data-contact]');
  const footer = $('footer');
  let pastHero = false;
  const near = new Set<Element>();
  const update = () => {
    const visible = pastHero && near.size === 0 && !(banner && !banner.hidden);
    mcta.classList.toggle('is-visible', visible);
    mcta.setAttribute('aria-hidden', String(!visible));
    mcta.querySelectorAll('a').forEach((a) => (a.tabIndex = visible ? 0 : -1));
  };
  new IntersectionObserver(([e]) => {
    pastHero = !e.isIntersecting;
    update();
  }).observe(hero);
  const formObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target)));
      update();
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  if (contact) formObs.observe(contact);
  if (footer) formObs.observe(footer);
  if (banner) new MutationObserver(update).observe(banner, { attributes: true, attributeFilter: ['hidden'] });
}

/* ───── Prints dos cases: ampliar ao clicar ───── */
const lb = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
const lbImg = lb?.querySelector<HTMLImageElement>('[data-lightbox-img]');
if (lb && lbImg) {
  document.querySelectorAll<HTMLButtonElement>('[data-lightbox]').forEach((b) =>
    b.addEventListener('click', () => {
      lbImg.src = b.dataset.lightbox!;
      lbImg.alt = b.dataset.lightboxAlt || '';
      lb.showModal();
      track('case_print_open', { src: b.dataset.lightbox });
    }),
  );
  lb.addEventListener('click', (e) => {
    if (e.target === lb) lb.close();
  });
}

/* ───── Máscara do hero com URL absoluta (vale em qualquer hospedagem/subpasta) ───── */
const heroEl = document.querySelector<HTMLElement>('[data-hero]');
heroEl?.style.setProperty('--mask', `url("${new URL(asset('backe-symbol.svg'), location.href).href}")`);

/* ───── Sempre abrir no topo (o navegador restauraria o meio de uma cena de scroll) ───── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) scrollTo(0, 0);

/* ───── Vídeo do hero: pôster certo no celular e play garantido (iOS bloqueia autoplay às vezes) ───── */
const heroVideo = document.querySelector<HTMLVideoElement>('[data-hero-video]');
if (heroVideo && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if (matchMedia('(max-width: 900px)').matches) heroVideo.poster = asset('video/reel-vertical-poster.jpg');
  heroVideo.muted = true;
  heroVideo.setAttribute('webkit-playsinline', '');
  const kick = () => heroVideo.play().catch(() => {});
  kick();
  heroVideo.addEventListener('canplay', kick, { once: true });
  // iOS (ex.: modo de pouca energia) só libera vídeo após um gesto real: “soltar o dedo” ou clique.
  // No primeiro gesto, dá play em todos os vídeos visíveis da página.
  const unlock = () => {
    kick();
    document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach((v) => {
      const r = v.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {});
    });
  };
  ['touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, unlock, { once: true, passive: true }));
  addEventListener('scroll', kick, { once: true, passive: true });
  // se o vídeo travar sem tocar, tenta de novo quando a página volta a ficar visível
  document.addEventListener('visibilitychange', () => !document.hidden && kick());
}

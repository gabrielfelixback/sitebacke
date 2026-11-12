import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { asset } from '../lib/url';

const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Cenas guiadas pelo scroll. Carregado sob demanda por motion.ts (nunca com movimento reduzido). */
export default function scenes() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const tallFrame = document.documentElement.classList.contains('frame-tall');
  const fine = matchMedia('(pointer: fine)').matches;

  /* ───── Rolagem suave (só mouse/trackpad; toque mantém o nativo) ───── */
  if (fine) {
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!;
      const el = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -72 });
      history.replaceState(null, '', id);
    });
  }

  /* ───── Manifesto: as palavras acendem conforme a leitura ───── */
  const ws = $$('[data-words] .w');
  if (ws.length) {
    ScrollTrigger.create({
      trigger: '[data-words]',
      start: 'top 80%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (st) => {
        const n = Math.round(st.progress * ws.length);
        ws.forEach((w, i) => w.classList.toggle('on', i < n));
      },
    });
  }

  /* ───── Hero: a câmera mergulha no disco do “b” até o vídeo tomar a tela ───── */
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero && !tallFrame) {
    const copy = hero.querySelector<HTMLElement>('[data-hero-copy]')!;
    const after = hero.querySelector<HTMLElement>('[data-hero-after]')!;
    const video = hero.querySelector<HTMLVideoElement>('[data-hero-video]');
    const tint = hero.querySelector<HTMLElement>('.hero__tint');
    // miolo (onde está a frase) → ponto sólido do disco inferior
    const A0 = { x: 0.476, y: 0.613 };
    const A1 = { x: 232 / 504, y: 440 / 506 };
    const apply = (p: number) => {
      const vw = innerWidth;
      const vh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) * 100 || innerHeight;
      const mobile = vw <= 900;
      const s0 = mobile ? vw * 1.24 : Math.max(vw * 1.04, vh * 1.68);
      const s1 = Math.max(vw, vh) * 9;
      const k = clamp(p / 0.62);
      const size = lerp(s0, s1, k * k * k);
      const m = clamp(k * 1.8);
      hero.style.setProperty('--S', `${size}px`);
      hero.style.setProperty('--axz', String(lerp(A0.x, A1.x, m)));
      hero.style.setProperty('--ayz', String(lerp(A0.y, A1.y, m)));
      hero.classList.toggle('is-open', k > 0.99);
      const c = 1 - clamp(p / 0.22);
      copy.style.opacity = String(c);
      copy.style.transform = `translateY(${(1 - c) * -40}px) scale(${1 - (1 - c) * 0.06})`;
      const a = clamp((p - 0.62) / 0.2);
      after.style.opacity = String(a);
      after.style.transform = `translateY(${(1 - a) * 40}px)`;
      tint?.style.setProperty('--tint', String(lerp(1, 1.6, a)));
    };
    apply(0);
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (st) => apply(st.progress) });
    addEventListener('resize', () => apply(0));
    if (video) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(hero);
    }
  }

  /* ───── Frentes: cada card empilha sobre o anterior, que recua ───── */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const cards = $$('[data-fcard]');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.94,
        filter: 'brightness(0.6)',
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 55%', end: 'top 15%', scrub: true },
      });
    });
  });

  /* ───── Método: o sol sobe a cada etapa ───── */
  const proc = document.querySelector<HTMLElement>('[data-process]');
  if (proc) {
    const sun = proc.querySelector<HTMLElement>('[data-proc-sun]');
    ScrollTrigger.create({
      trigger: proc.querySelector('.proc__steps'),
      start: 'top 60%',
      end: 'bottom 60%',
      onUpdate: (st) => sun?.style.setProperty('--p', String(0.25 + st.progress * 0.75)),
    });
    $$('[data-step]', proc).forEach((s) =>
      ScrollTrigger.create({
        trigger: s,
        start: 'top 62%',
        end: 'bottom 38%',
        onToggle: (st) => s.classList.toggle('is-active', st.isActive),
      }),
    );
  }

  /* ───── Botões magnéticos (só mouse) ───── */
  if (fine) {
    $$('.btn--primary, [data-magnetic]').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.18);
        qy((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('pointerleave', () => {
        qx(0);
        qy(0);
      });
    });
  }


  /* ───── Títulos entram palavra por palavra ao aparecer na tela ───── */
  document.fonts?.ready.then(() => {
    $$('main h2, .case__title, .fcard__promise').forEach((el) => {
      if (getComputedStyle(el).backgroundClip === 'text' || el.closest('[data-hero]')) return; // texto com degradê não se divide bem
      const split = SplitText.create(el, { type: 'words,lines', mask: 'lines', linesClass: 'split-line' });
      gsap.from(split.words, {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.035,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
    ScrollTrigger.refresh();
  });

  /* ───── Celular: cards das frentes e dos cases entram crescendo ───── */
  mm.add('(max-width: 900px)', () => {
    $$('[data-fcard], .case').forEach((card) => {
      gsap.from(card, {
        y: 70,
        scale: 0.92,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 94%', once: true },
      });
    });
  });

  /* ───── Faixas de palavras andam com a rolagem ───── */
  $$('[data-band]').forEach((band) => {
    const track = band.querySelector<HTMLElement>('[data-band-track]')!;
    const dir = Number(band.dataset.dir || 1);
    gsap.fromTo(
      track,
      { xPercent: dir > 0 ? 0 : -33.333 },
      { xPercent: dir > 0 ? -33.333 : 0, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.4 } },
    );
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

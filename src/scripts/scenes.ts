import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { asset } from '../lib/url';

const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Cenas guiadas pelo scroll. Carregado sob demanda por motion.ts (nunca com movimento reduzido). */
export default function scenes() {
  gsap.registerPlugin(ScrollTrigger);
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

  /* ───── Reel: o vídeo dentro do símbolo, que se abre até tomar a tela ───── */
  const reel = document.querySelector<HTMLElement>('[data-reel]');
  if (reel) {
    const media = reel.querySelector<HTMLElement>('[data-reel-media]')!;
    const video = reel.querySelector<HTMLVideoElement>('[data-reel-video]')!;
    const l = reel.querySelector<HTMLElement>('[data-reel-l]')!;
    const r = reel.querySelector<HTMLElement>('[data-reel-r]')!;
    const end = reel.querySelector<HTMLElement>('[data-reel-end]')!;
    const shade = reel.querySelector<HTMLElement>('[data-reel-shade]')!;
    media.style.setProperty('--mask', `url("${asset('backe-symbol.svg')}")`);
    media.classList.add('is-masked');
    // ponto sólido do disco inferior do símbolo: o zoom termina “dentro” dele
    const AX = 232 / 504;
    const AY = 432 / 506;
    const apply = (p: number) => {
      const vw = innerWidth;
      const vh = innerHeight;
      const s0 = Math.min(vw, vh) * (vw < 900 ? 0.62 : 0.42);
      const s1 = Math.max(vw, vh) * 7;
      const k = clamp(p / 0.7);
      const e = k * k * k; // acelera no fim, como uma lente
      const size = lerp(s0, s1, e);
      const ax = lerp(0.5, AX, clamp(k * 1.6));
      const ay = lerp(0.5, AY, clamp(k * 1.6));
      media.style.setProperty('--ms', `${size}px`);
      media.style.setProperty('--mx', `${vw / 2 - ax * size}px`);
      media.style.setProperty('--my', `${vh / 2 - ay * size * (506 / 504)}px`);
      media.classList.toggle('is-masked', k < 0.995);
      const sides = 1 - clamp(p / 0.35);
      l.style.opacity = r.style.opacity = String(sides);
      l.style.transform = `translateX(${(1 - sides) * -60}px)`;
      r.style.transform = `translateX(${(1 - sides) * 60}px)`;
      const fin = clamp((p - 0.72) / 0.18);
      end.style.opacity = String(fin);
      end.style.transform = `translateY(${(1 - fin) * 40}px)`;
      shade.style.setProperty('--shade', String(lerp(0.25, 1, fin)));
    };
    apply(0);
    ScrollTrigger.create({ trigger: reel, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (st) => apply(st.progress) });
    addEventListener('resize', () => ScrollTrigger.refresh());

    // o vídeo só carrega/toca perto da tela
    let userPaused = false;
    new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !userPaused) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '200px 0px' },
    ).observe(reel);
    const btn = reel.querySelector<HTMLButtonElement>('[data-reel-toggle]')!;
    btn.addEventListener('click', () => {
      userPaused = !video.paused;
      if (userPaused) video.pause();
      else video.play().catch(() => {});
      btn.setAttribute('aria-pressed', String(userPaused));
      btn.querySelector('[data-reel-toggle-label]')!.textContent = userPaused ? 'Tocar vídeo' : 'Pausar vídeo';
    });
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
        filter: 'brightness(0.55)',
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true },
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

  /* ───── Vídeos de cards: tocam só quando visíveis ───── */
  $$<HTMLVideoElement>('video[data-autoplay]').forEach((v) =>
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      rootMargin: '100px 0px',
    }).observe(v),
  );

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

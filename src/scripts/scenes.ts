import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

/** Cenas guiadas pelo scroll. Carregado sob demanda por motion.ts. */
export default function scenes() {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  /* hero: o símbolo desce devagar, como o sol se pondo, ao rolar */
  gsap.to('[data-hero-mark]', {
    yPercent: 14,
    rotate: -4,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* manifesto: as palavras acendem conforme a leitura */
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

  /* Estratégia × Criatividade: as duas metades do símbolo se encontram */
  const duo = document.querySelector('[data-duo]');
  if (duo) {
    mm.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, (ctx) => {
      const d = ctx.conditions!.desktop;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: duo, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.fromTo('[data-duo-stem]', { xPercent: d ? -150 : -90, rotate: -10, opacity: 0.4 }, { xPercent: 0, rotate: 0, opacity: 1, duration: 0.55 }, 0)
        .fromTo('[data-duo-bowl]', { xPercent: d ? 150 : 90, rotate: 14, opacity: 0.4 }, { xPercent: 0, rotate: 0, opacity: 1, duration: 0.55 }, 0)
        .fromTo('[data-duo-l]', { opacity: 0, x: d ? -40 : 0, y: d ? 0 : 20 }, { opacity: 1, x: 0, y: 0, duration: 0.2 }, 0.05)
        .fromTo('[data-duo-r]', { opacity: 0, x: d ? 40 : 0, y: d ? 0 : 20 }, { opacity: 1, x: 0, y: 0, duration: 0.2 }, 0.12)
        .to('[data-duo-glow]', { opacity: 1, scale: 1.25, duration: 0.25, ease: 'power2.out' }, 0.5)
        .to(['[data-duo-l]', '[data-duo-r]'], { opacity: 0, duration: 0.12 }, 0.6)
        .to('.duo__stage', { y: d ? '-10vh' : '-6vh', scale: 0.86, duration: 0.2, ease: 'power1.inOut' }, 0.6)
        .fromTo('[data-duo-end]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2 }, 0.66)
        .to({}, { duration: 0.16 });
    });
  }

  /* Método: o sol sobe a cada etapa */
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

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/**
 * Movimento leve que roda de imediato. As cenas guiadas pelo scroll (GSAP)
 * são carregadas sob demanda em `scenes.ts`, fora do caminho crítico.
 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

/* ───── Revelação ao entrar na tela ───── */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
);
$$('[data-reveal]').forEach((el) => io.observe(el));

/* ───── Manifesto palavra a palavra (o texto completo fica no aria-label) ───── */
const words = document.querySelector<HTMLElement>('[data-words]');
if (words) {
  const text = words.textContent!.trim().replace(/\s+/g, ' ');
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  words.innerHTML = text
    .split(' ')
    .map((w) => `<span class="w" aria-hidden="true">${w}</span>`)
    .join(' ');
  words.prepend(sr);
}

/* ───── Contadores (sem biblioteca) ───── */
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const dec = Number(el.dataset.decimals || 0);
  const t0 = performance.now();
  const dur = 1800;
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 4);
    const v = target * eased;
    el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('pt-BR');
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const cio = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        countUp(e.target as HTMLElement);
        cio.unobserve(e.target);
      }
    }
  },
  { threshold: 0.6 },
);

if (reduce) {
  $$('[data-words] .w').forEach((w) => w.classList.add('on'));
  $$('.proc [data-step]').forEach((s) => s.classList.add('is-active'));
  // sem autoplay: os vídeos ficam no pôster
  $$<HTMLVideoElement>('video').forEach((v) => {
    v.removeAttribute('autoplay');
    v.pause();
  });
} else {
  // vídeos de cards e do showreel tocam só quando visíveis
  $$<HTMLVideoElement>('video[data-autoplay]').forEach((v) =>
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      rootMargin: '100px 0px',
    }).observe(v),
  );
  $$('[data-count]').forEach((el) => cio.observe(el));
  const loadScenes = () => import('./scenes').then((m) => m.default());
  if ('requestIdleCallback' in window) requestIdleCallback(loadScenes, { timeout: 1500 });
  else setTimeout(loadScenes, 600);
}

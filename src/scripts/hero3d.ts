/**
 * Símbolo 3D ao vivo no hero. Começa como pôster (imagem renderizada, boa para LCP)
 * e troca para WebGL quando o navegador está livre. Responde ao cursor/inclinação,
 * “nasce” na entrada e “se põe” conforme o hero sai da tela.
 */
export async function mountHero3D(stage: HTMLElement) {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
  const poster = stage.querySelector<HTMLElement>('[data-poster]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // 3D ao vivo só onde roda liso: desktop com GPU de verdade e sem economia de dados.
  // Nos demais, o render estático (mesma pose) continua flutuando via CSS.
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (!matchMedia('(pointer: fine) and (min-width: 901px)').matches) return;
  if (nav.connection?.saveData) return;
  if ((nav.hardwareConcurrency || 8) < 4 || (nav.deviceMemory || 8) < 4) return;
  const probe = document.createElement('canvas');
  const gl = (probe.getContext('webgl2') || probe.getContext('webgl')) as WebGLRenderingContext | null;
  if (!gl) return;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) return;
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  const { createSymbolScene } = await import('../lib/symbol3d');
  const s = createSymbolScene(canvas, { dpr: Math.min(devicePixelRatio, 2) });

  // pose final = a do pôster, para a troca ser invisível
  const BASE = { rx: 0.1, ry: -0.42, rz: 0.02, z: 6.2 };
  s.camera.position.z = BASE.z;

  const size = () => {
    const r = stage.getBoundingClientRect();
    s.resize(r.width, r.height);
  };
  size();
  new ResizeObserver(size).observe(stage);

  let tx = 0, ty = 0, px = 0, py = 0;
  addEventListener(
    'pointermove',
    (e) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
    },
    { passive: true },
  );

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(stage);

  const hero = stage.closest('section')!;
  const t0 = performance.now();
  const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 4);

  canvas.style.opacity = '0';
  let shown = false;

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000;
    const live = ease(t / 1.6); // o movimento cresce aos poucos a partir da pose do pôster
    // saída: conforme o hero rola para fora, o sol se põe
    const r = hero.getBoundingClientRect();
    const out = Math.min(1, Math.max(0, -r.top / r.height));

    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;

    s.pivot.rotation.y = BASE.ry + live * (Math.sin(t * 0.45) * 0.12 + px * 0.32) + out * 0.9;
    s.pivot.rotation.x = BASE.rx + live * (Math.sin(t * 0.6) * 0.04 + py * 0.16) - out * 0.25;
    s.pivot.rotation.z = BASE.rz;
    s.pivot.position.y = live * Math.sin(t * 0.8) * 0.05 - out * 1.4;
    s.lights.under.intensity = 45 + Math.sin(t * 1.1) * 8 + out * 40;
    s.lights.rim.position.x = 3.5 + px * 1.5;
    s.render();

    if (!shown) {
      shown = true;
      canvas.style.transition = 'opacity .6s';
      canvas.style.opacity = '1';
      if (poster) {
        poster.style.transition = 'opacity .6s';
        poster.style.opacity = '0';
      }
    }
  };
  requestAnimationFrame(loop);
}

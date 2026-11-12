/**
 * Vídeos do site: um módulo só para todos os [data-vbox].
 *
 * - A capa (<picture>) fica sempre por baixo; o vídeo só aparece (fade de 400 ms) quando dispara `playing`.
 * - A fonte é escolhida por JS (data-src-mobile / data-src-desktop), o que funciona em qualquer Android.
 * - Autoplay bloqueado (Modo de Pouca Energia, alguns WebViews): play() rejeita ou o vídeo continua pausado
 *   1,5 s depois → o wrapper ganha .needs-tap e aparece o botão laranja de play.
 * - Erro de carregamento → .is-error: o vídeo some e a capa continua.
 * - "Reduzir movimento" NÃO pausa vídeo (só desliga as animações de rolagem).
 *
 * Modos: data-vbox="hero" recebe a fonte depois do evento load; data-vbox="auto" recebe a fonte
 * quando está a uma tela de distância e toca/pausa conforme entra e sai da tela.
 */

const MOBILE = '(max-width: 900px)';

interface Box {
  el: HTMLElement;
  video: HTMLVideoElement;
  btn: HTMLButtonElement | null;
  visible: boolean;
  wantsPlay: boolean;
}

const boxes: Box[] = [];

function prepare(v: HTMLVideoElement) {
  // atributos E propriedades: o iOS olha os dois
  v.muted = true;
  v.defaultMuted = true;
  v.loop = true;
  v.playsInline = true;
  v.setAttribute('muted', '');
  v.setAttribute('loop', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
}

function setSource(b: Box) {
  const v = b.video;
  if (v.getAttribute('src')) return;
  const src = matchMedia(MOBILE).matches ? v.dataset.srcMobile : v.dataset.srcDesktop;
  if (!src) return;
  v.src = src;
  v.load();
}

function needTap(b: Box, on: boolean) {
  b.el.classList.toggle('needs-tap', on);
  if (b.btn) b.btn.hidden = !on;
}

function tryPlay(b: Box) {
  b.wantsPlay = true;
  if (b.el.classList.contains('is-error')) return;
  setSource(b);
  const v = b.video;
  let p: Promise<void> | undefined;
  try {
    p = v.play();
  } catch {
    needTap(b, true);
    return;
  }
  p?.catch((err: DOMException) => {
    // NotSupportedError = arquivo não carregou: fica a capa, sem botão
    if (err?.name === 'NotSupportedError' || b.el.classList.contains('is-error')) {
      b.el.classList.add('is-error');
      needTap(b, false);
      return;
    }
    // AbortError = a fonte mudou ou o vídeo foi pausado no meio: não é bloqueio
    if (err?.name !== 'AbortError' && b.wantsPlay) needTap(b, true);
  });
  // o Modo de Pouca Energia às vezes não rejeita: confere depois de 1,5 s
  window.setTimeout(() => {
    if (b.wantsPlay && b.visible && v.paused && !b.el.classList.contains('is-error')) needTap(b, true);
  }, 1500);
}

function pause(b: Box) {
  b.wantsPlay = false;
  if (!b.video.paused) b.video.pause();
}

function init(el: HTMLElement) {
  const video = el.querySelector<HTMLVideoElement>('video');
  if (!video) return;
  prepare(video);
  const btn =
    el.querySelector<HTMLButtonElement>('.vbox__play') ||
    (el.id ? document.querySelector<HTMLButtonElement>(`[data-play-for="${el.id}"]`) : null);
  const b: Box = { el, video, btn, visible: false, wantsPlay: false };
  boxes.push(b);

  video.addEventListener('playing', () => {
    el.classList.add('is-playing');
    needTap(b, false);
  });
  const fail = () => {
    el.classList.add('is-error');
    needTap(b, false);
  };
  video.addEventListener('error', fail);
  video.querySelectorAll('source').forEach((s) => s.addEventListener('error', fail));

  btn?.addEventListener('click', () => {
    setSource(b);
    b.wantsPlay = true;
    video.play().then(
      () => needTap(b, false),
      () => needTap(b, true),
    );
  });

  if (el.dataset.vbox === 'hero') {
    // o texto e a capa aparecem primeiro; o vídeo entra depois do load (dois rAF)
    const start = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (b.visible || el.getBoundingClientRect().top < innerHeight) tryPlay(b);
        }),
      );
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
  }

  // fonte quando estiver a uma tela de distância (o hero recebe a dele no load)
  if (el.dataset.vbox !== 'hero') {
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near.disconnect();
        setSource(b);
      },
      { rootMargin: '100% 0px' },
    );
    near.observe(el);
  }

  // toca ao entrar na tela, pausa ao sair
  new IntersectionObserver(
    ([e]) => {
      b.visible = e.isIntersecting;
      if (e.isIntersecting) {
        if (el.dataset.vbox !== 'hero' || video.getAttribute('src')) tryPlay(b);
      } else pause(b);
    },
    { threshold: 0.12 },
  ).observe(el);
}

document.querySelectorAll<HTMLElement>('[data-vbox]').forEach(init);

// primeiro gesto na página: tenta de novo os vídeos visíveis que pediram toque
const retry = () =>
  boxes.forEach((b) => {
    if (b.visible && b.el.classList.contains('needs-tap')) tryPlay(b);
  });
['pointerdown', 'touchstart', 'touchend', 'click'].forEach((ev) =>
  addEventListener(ev, retry, { once: true, passive: true, capture: true }),
);
addEventListener('scroll', retry, { once: true, passive: true });
// ao voltar para a aba, retoma o que estava tocando
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) boxes.forEach((b) => b.visible && b.wantsPlay && b.video.paused && tryPlay(b));
});

export {};

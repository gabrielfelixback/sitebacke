/*
 * Efeitos guiados pela rolagem que não dependem de biblioteca (script sem build, carregado com defer):
 * - manifesto do Custo do improviso: cada linha liga (.on) quando o topo passa da fração da tela em data-mani;
 * - cards das frentes acendem a borda (.is-lit) quando o topo passa de 62% da tela.
 * Com "reduzir movimento", o manifesto já aparece no estado final.
 * (O sol agora é o public/sol3d.js.)
 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-fcard]'));
  var mani = Array.prototype.slice.call(document.querySelectorAll('[data-mani]'));

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('is-lit', cards[i].getBoundingClientRect().top < vh * 0.62);
    }
    for (var m = 0; m < mani.length; m++) {
      var at = parseFloat(mani[m].getAttribute('data-mani')) || 0.7;
      mani[m].classList.toggle('on', reduce || mani[m].getBoundingClientRect().top < vh * at);
    }
  }

  var ticking = false;
  function request() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  update();
})();

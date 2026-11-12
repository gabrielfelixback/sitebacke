/*
 * sol3d.js — pôr do sol cinematográfico em WebGL puro (sem bibliotecas).
 *
 * Uso:  <canvas data-sol3d data-mode="full"></canvas>     sol inteiro
 *       <canvas data-sol3d data-mode="horizon"></canvas>  sol achatado nascendo atrás da terra escura;
 *                                                          sobe conforme o canvas entra na tela
 *
 * - Só desenha enquanto o canvas está visível e a aba está ativa.
 * - Resolução limitada (1,5x no celular, 2x no desktop).
 * - Sem WebGL, contexto perdido ou "reduzir movimento": adiciona .sol3d--static no canvas
 *   (o CSS do site desenha um degradê estático no lugar).
 */
(function () {
  'use strict';

  var canvases = Array.prototype.slice.call(document.querySelectorAll('canvas[data-sol3d]'));
  if (!canvases.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  // uv: 0..1 da esquerda/baixo; tudo em unidades da menor dimensão para o disco ficar redondo
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uMode;uniform float uRise;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'void main(){',
    ' vec2 frag=gl_FragCoord.xy;float m=min(uRes.x,uRes.y);',
    ' vec2 q=(frag-.5*uRes)/m;', // centro = 0
    ' float px=1.5/m;',
    ' bool hz=uMode>.5;',
    // geometria
    ' float horizon=hz?(-.5*uRes.y/m+.30*uRes.y/m):-10.;', // terra ocupa os 30% de baixo
    ' float r=hz?.30:.34;',
    ' vec2 c=hz?vec2(0.,horizon+mix(-.42,.08,uRise)):vec2(0.);', // no horizonte o sol sobe com uRise
    ' vec2 d=q-c; d.y/= hz?.93:1.;', // levemente achatado perto do horizonte
    ' float dist=length(d);',
    ' float disc=1.-smoothstep(r-px,r+px,dist);',
    // cor do disco: vermelho no topo esquentando para laranja embaixo
    ' float t=clamp((d.y/r)*.5+.5,0.,1.);',
    ' vec3 top=vec3(.78,.09,.13),mid=vec3(.91,.25,.18),bot=vec3(.97,.55,.23);',
    ' vec3 col=mix(bot,mid,smoothstep(.0,.55,t));col=mix(col,top,smoothstep(.55,1.,t));',
    // brilho do centro
    ' col+=vec3(.10,.05,.0)*(1.-smoothstep(0.,r,dist));',
    // faixas finas de atmosfera passando devagar
    ' float yy=(q.y-c.y)*34.+uTime*.18;',
    ' float wob=(noise(vec2(q.x*1.2+uTime*.04,floor(yy)))-.5)*.5;',
    ' float bands=smoothstep(.93,.995,sin(yy+wob));',
    ' float bands2=smoothstep(.96,1.,sin((q.y-c.y)*71.-uTime*.1+wob*2.));',
    ' float lowB=smoothstep(.15,-.35,(q.y-c.y)/r);', // faixas mais marcadas na metade de baixo
    ' col*=1.-(.10+.16*lowB)*bands-(.06+.08*lowB)*bands2;',
    // névoa vermelha larga e baixa em volta
    ' vec2 h=q-c; h.x*=.38; h.y=(h.y+r*.35)*1.15;',
    ' float haze=exp(-dot(h,h)*4.2);',
    ' float glow=exp(-max(dist-r,0.)*7.);',
    ' float flick=.92+.08*noise(vec2(uTime*.3,q.y*3.));',
    ' vec3 hazeCol=vec3(.80,.10,.12)*haze*.7*flick+vec3(.96,.38,.17)*glow*.42;',
    // a névoa some antes da borda do canvas (sem retângulo aparente)
    ' vec2 uv=frag/uRes;',
    ' float edge=hz?smoothstep(0.,.16,uv.x)*smoothstep(1.,.84,uv.x)*smoothstep(1.,.80,uv.y):smoothstep(.5,.3,length(uv-.5));',
    ' hazeCol*=edge;',
    ' float a=max(disc, clamp((haze*.7*flick+glow*.42)*edge,0.,1.));',
    ' vec3 outc=mix(hazeCol,col,disc);',
    // terra escura engolindo a base (com um fio de luz no horizonte)
    ' if(hz){',
    '  float ground=smoothstep(horizon+px,horizon-px,q.y+.012*sin(q.x*3.+.6));',
    '  float rim=exp(-abs(q.y-horizon)*140.)*smoothstep(.9,.0,abs(q.x-c.x))*(.35+.65*uRise);',
    '  outc=mix(outc,vec3(0.),ground);a=mix(a,1.,ground);',
    '  outc+=vec3(.95,.42,.18)*rim*(1.-ground*.5);a=max(a,rim);',
    '  float under=exp(-max(horizon-q.y,0.)*14.)*ground*haze;', // reflexo quente logo abaixo do horizonte
    '  outc+=vec3(.35,.06,.05)*under;',
    ' }',
    ' gl_FragColor=vec4(outc*a,a);', // alfa pré-multiplicado
    '}',
  ].join('\n');

  var mobile = window.matchMedia('(max-width: 900px)').matches;
  var maxDpr = mobile ? 1.5 : 2;
  var items = [];

  function makeStatic(cv) {
    cv.classList.add('sol3d--static');
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }

  function setup(cv) {
    if (reduce) return makeStatic(cv);
    var gl = null;
    try {
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    } catch (e) {
      gl = null;
    }
    if (!gl) return makeStatic(cv);
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) {
      return makeStatic(cv);
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    var it = {
      cv: cv,
      gl: gl,
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uMode: gl.getUniformLocation(prog, 'uMode'),
      uRise: gl.getUniformLocation(prog, 'uRise'),
      mode: cv.getAttribute('data-mode') === 'horizon' ? 1 : 0,
      visible: false,
      rise: 0,
      w: 0,
      h: 0,
    };
    cv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      it.dead = true;
      makeStatic(cv);
    });
    items.push(it);
    io.observe(cv);
  }

  function size(it) {
    var r = it.cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (w !== it.w || h !== it.h) {
      it.w = it.cv.width = w;
      it.h = it.cv.height = h;
      it.gl.viewport(0, 0, w, h);
    }
    return r;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        for (var i = 0; i < items.length; i++) if (items[i].cv === e.target) items[i].visible = e.isIntersecting;
      });
      kick();
    },
    { rootMargin: '80px 0px' },
  );

  var t0 = performance.now();
  var running = false;
  function frame(now) {
    running = false;
    if (document.hidden) return;
    var any = false;
    var vh = window.innerHeight;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.visible || it.dead) continue;
      any = true;
      var r = size(it);
      if (it.mode === 1) {
        // sobe conforme entra: 0 com o topo no pé da tela → 1 com o canvas quase todo visível
        var target = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.35)));
        it.rise += (target - it.rise) * 0.08;
      }
      var gl = it.gl;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(it.uRes, it.w, it.h);
      gl.uniform1f(it.uTime, (now - t0) / 1000);
      gl.uniform1f(it.uMode, it.mode);
      gl.uniform1f(it.uRise, 1 - Math.pow(1 - it.rise, 3));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (any) kick();
  }
  function kick() {
    if (!running && !document.hidden) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('resize', kick);

  canvases.forEach(setup);
})();

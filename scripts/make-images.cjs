// Gera og-image.png e ícones PNG a partir dos SVGs da marca. Uso: node scripts/make-images.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const sym = fs.readFileSync(path.join(root, 'public/backe-symbol.svg'), 'utf8');
const symData = 'data:image/svg+xml;base64,' + Buffer.from(sym).toString('base64');
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'node_modules', f)).toString('base64');
const bric = font('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2');
const serif = font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2');

const og = `<html><head><style>
@font-face{font-family:B;src:url(${bric})}@font-face{font-family:S;src:url(${serif})}
*{margin:0}body{width:1200px;height:630px;background:#000;overflow:hidden;position:relative;font-family:B;color:#f4f2ef}
.sun{position:absolute;width:1400px;height:1400px;right:-620px;bottom:-1050px;border-radius:50%;background:radial-gradient(closest-side,rgba(254,67,77,.6),rgba(234,104,50,.35) 40%,rgba(241,143,52,.12) 65%,transparent)}
img{position:absolute;right:-200px;bottom:-170px;width:600px;filter:drop-shadow(0 0 60px rgba(254,67,77,.35))}
.fade{position:absolute;inset:auto 0 0;height:160px;background:linear-gradient(transparent,#0b0807)}
.t{position:absolute;left:72px;top:150px;font-size:108px;line-height:.9;letter-spacing:-.045em;font-weight:600;font-variation-settings:'opsz' 96}
em{font-family:S;font-weight:400;font-style:italic;letter-spacing:-.02em;background:linear-gradient(#F18F34,#EA6832 50%,#FE434D);-webkit-background-clip:text;color:transparent;padding-right:.08em}
.k{position:absolute;left:72px;top:84px;font:600 18px system-ui;letter-spacing:.16em;color:#a3a09c;text-transform:uppercase}
.u{position:absolute;left:72px;bottom:72px;font:500 26px system-ui;color:#c9c5c0;z-index:2}
</style></head><body><div class="sun"></div><img src="${symData}"><div class="fade"></div>
<p class="k">BACKE.co, agência de marketing</p>
<p class="t">Estratégia<br>com <em>criatividade.</em></p><p class="u">Diagnóstico estratégico gratuito em backe.com.br</p></body></html>`;

const icon = (size, pad, bg) => `<html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center"><img src="${symData}" style="width:${size - pad * 2}px"></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(og);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(root, 'public/og-image.png') });
  for (const [name, size, pad, bg] of [
    ['favicon-32.png', 32, 2, 'transparent'],
    ['apple-touch-icon.png', 180, 30, '#000'],
    ['icon-512.png', 512, 80, '#000'],
  ]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(icon(size, pad, bg));
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(root, 'public', name), omitBackground: bg === 'transparent' });
  }
  await b.close();
  console.log('ok');
})();

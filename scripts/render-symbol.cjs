// Renderiza o símbolo 3D em imagens estáticas (pôster do hero e imagens das frentes).
// Uso: node scripts/render-symbol.cjs   (precisa de esbuild e do Chromium do Playwright)
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'b3d-'));
execSync(`npx esbuild ${path.join(__dirname, 'render/entry.ts')} --bundle --format=esm --outfile=${tmp}/entry.js --log-level=warning`, { cwd: root });

const jobs = [
  // nome, largura, altura, parâmetros
  ['hero', 1400, 1400, 'ry=-0.42&rx=0.1&rz=0.02&z=6.2'],
  ['frente-estrategia', 1200, 1200, 'ry=1.05&rx=0.12&z=6.0&rim=1.4'],
  ['frente-demanda', 1200, 1200, 'ry=-0.18&rx=0.06&count=3&dx=1.05&dz=1.6&px=-0.9&z=9.5'],
  ['frente-marca', 1200, 1200, 'ry=-0.12&rx=0.05&z=4.4&py=-0.25&key=1.3'],
  ['frente-imagem', 1200, 1200, 'ry=0.35&rx=-0.95&z=6.2&under=1.8'],
  ['contato', 1400, 1400, 'ry=0.3&rx=0.18&rz=-0.06&z=6.4&under=1.6'],
];

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/entry.js') { res.setHeader('content-type', 'text/javascript'); return res.end(fs.readFileSync(`${tmp}/entry.js`)); }
  res.setHeader('content-type', 'text/html');
  const [w, h] = (new URL(req.url, 'http://x').searchParams.get('size') || '1200x1200').split('x');
  res.end(`<!doctype html><body style="margin:0;background:transparent"><canvas style="width:${w}px;height:${h}px;display:block"></canvas><script type="module" src="/entry.js"></script></body>`);
}).listen(0, async () => {
  const port = server.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  fs.mkdirSync(path.join(root, 'public/render'), { recursive: true });
  for (const [name, w, h, q] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${port}/?size=${w}x${h}&${q}`);
    await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await p.screenshot({ path: `${tmp}/${name}.png`, omitBackground: true });
    await p.close();
    console.log('render', name);
  }
  await b.close();
  server.close();
  execSync(`python3 -I -c "
import sys
from PIL import Image
for n in sys.argv[2:]:
    im=Image.open(sys.argv[1]+'/'+n+'.png').convert('RGBA')
    im=im.crop(im.getbbox()) if n.startswith('frente') else im
    im.save('${root}/public/render/'+n+'.webp','WEBP',quality=88,method=6)
" ${tmp} ${jobs.map((j) => j[0]).join(' ')}`);
  console.log('ok');
});

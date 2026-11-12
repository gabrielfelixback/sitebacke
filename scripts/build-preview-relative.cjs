// Build de prévia com caminhos relativos (para hospedar em qualquer subpasta, ex.: prévia no claude.ai).
// Uso: node scripts/build-preview-relative.cjs  → gera dist-artifact/
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist-artifact');

execSync('npx astro build --outDir dist-artifact', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: 'https://backe.com.br', BASE_PATH: './', PUBLIC_PREVIEW: 'true' },
});

const rw = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));
for (const f of fs.readdirSync(out).filter((f) => f.endsWith('.html'))) {
  rw(path.join(out, f), (s) =>
    s.replaceAll('"/./', '"./').replaceAll('"/_astro/', '"./_astro/').replaceAll('url(/_astro/', 'url(./_astro/'),
  );
}
const astro = path.join(out, '_astro');
for (const f of fs.readdirSync(astro)) {
  const p = path.join(astro, f);
  if (f.endsWith('.css')) rw(p, (s) => s.replaceAll('url(/_astro/', 'url(./').replaceAll('url(/./_astro/', 'url(./'));
  if (f.endsWith('.js'))
    rw(p, (s) => {
      let n = s.replaceAll('"/./"', '"./"');
      if (f.startsWith('preload-helper')) n = n.replace('return"/"+', 'return"./"+');
      return n;
    });
}
// a hospedagem de prévia reserva nomes iniciados por “_”: _astro → astro
fs.renameSync(astro, path.join(out, 'astro'));
for (const f of fs.readdirSync(out).filter((f) => f.endsWith('.html'))) {
  rw(path.join(out, f), (s) => s.replaceAll('./_astro/', './astro/'));
}
console.log('prévia relativa pronta em dist-artifact/');

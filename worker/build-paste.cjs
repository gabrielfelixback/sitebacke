// Gera worker/dist/backe-lead-proxy.js: o mesmo código, só com a exportação principal (export default),
// pronto para colar no editor do painel da Cloudflare. Uso: node worker/build-paste.cjs
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'src/index.js'), 'utf8');
const out = src.replace(/^export (async function|function|const) /gm, '$1 ');
if (/^export (?!default)/m.test(out)) throw new Error('sobrou export nomeado');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/backe-lead-proxy.js'), '// GERADO por worker/build-paste.cjs a partir de worker/src/index.js. Não edite aqui.\n' + out);
console.log('worker/dist/backe-lead-proxy.js pronto');

// Traça as máscaras do logo (PNG oficial) em SVG, sem alterar a forma.
const potrace = require('potrace');
const fs = require('fs');
const [,, input, out] = process.argv;
potrace.trace(input, { turdSize: 20, optTolerance: 0.2, alphaMax: 1, threshold: 128 }, (err, svg) => {
  if (err) throw err;
  fs.writeFileSync(out, svg);
  const d = svg.match(/ d="([^"]+)"/)[1];
  fs.writeFileSync(out + '.d.txt', d);
  console.log(out, d.length);
});

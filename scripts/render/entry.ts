// Gera renders estáticos do símbolo 3D (usado por scripts/render-symbol.cjs).
import * as THREE from 'three';
import { createSymbolScene, buildSymbolMesh } from '../../src/lib/symbol3d';
const c = document.querySelector('canvas')!;
const p = new URLSearchParams(location.search);
const n = (k: string, d = 0) => (p.has(k) ? +p.get(k)! : d);
const s = createSymbolScene(c, { dpr: 1 });
s.resize(c.clientWidth, c.clientHeight);
s.camera.position.z = n('z', 7.2);
s.camera.position.y = n('cy', 0);
s.camera.lookAt(0, 0, 0);
s.pivot.rotation.set(n('rx'), n('ry'), n('rz'));
s.pivot.position.set(n('px'), n('py'), 0);
const count = n('count', 1);
for (let i = 1; i < count; i++) {
  const m = buildSymbolMesh();
  m.position.set(i * n('dx', 1.4), i * n('dy', 0), -i * n('dz', 1.6));
  s.pivot.add(m);
}
s.lights.rim.intensity *= n('rim', 1);
s.lights.under.intensity *= n('under', 1);
s.lights.key.intensity *= n('key', 1);
s.render();
(window as any).__ready = true;

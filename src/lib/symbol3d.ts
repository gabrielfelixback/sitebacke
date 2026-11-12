/**
 * O símbolo da Backe como objeto 3D: o vetor oficial extrudado, com verniz (clearcoat)
 * e o degradê “nascer do sol” da marca. A forma não é alterada — só ganha volume e luz.
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SYMBOL_PATH } from './logo-paths';

export interface SymbolScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  lights: { key: THREE.PointLight; rim: THREE.PointLight; under: THREE.PointLight };
  render: () => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
}

function gradientTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#F28A2C');
  grd.addColorStop(0.45, '#E8551F');
  grd.addColorStop(1, '#FF2440');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function buildSymbolMesh(depth = 70): THREE.Mesh {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504 506"><path fill="#000" fill-rule="evenodd" d="${SYMBOL_PATH}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth,
    curveSegments: 3,
    bevelEnabled: true,
    bevelThickness: 9,
    bevelSize: 3,
    bevelSegments: 6,
  });
  // UV = posição: o degradê segue a vertical da forma (topo dourado → base coral), como na logo.
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = 0.5;
    uv[i * 2 + 1] = 1 - pos.getY(i) / 506;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.deleteAttribute('normal');
  const smooth = mergeVertices(geo, 0.5);
  smooth.computeVertexNormals();
  smooth.center();
  const mat = new THREE.MeshPhysicalMaterial({
    map: gradientTexture(),
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.25,
    sheenColor: new THREE.Color('#ffb070'),
    emissive: new THREE.Color('#ff4a2a'),
    emissiveIntensity: 0.02,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(smooth, mat);
  mesh.scale.setScalar(1 / 260);
  mesh.rotation.x = Math.PI; // SVG tem y para baixo: girar (não espelhar) preserva as normais
  return mesh;
}

export function createSymbolScene(canvas: HTMLCanvasElement, opts: { dpr?: number } = {}): SymbolScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(opts.dpr ?? Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const pivot = new THREE.Group();
  pivot.add(buildSymbolMesh());
  scene.add(pivot);

  // luz quente principal, recorte coral por trás e o “sol” por baixo
  const key = new THREE.PointLight('#ffd9b8', 26, 30, 1.6);
  key.position.set(-4.5, 4, 3);
  const rim = new THREE.PointLight('#ff4a2e', 120, 30, 1.6);
  rim.position.set(3.5, 0.5, -3);
  const under = new THREE.PointLight('#ff6a00', 45, 20, 1.8);
  under.position.set(0, -3.2, 2);
  scene.add(key, rim, under, new THREE.AmbientLight('#1a0c08', 0.4));

  const render = () => renderer.render(scene, camera);
  const resize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const dispose = () => {
    renderer.dispose();
    pmrem.dispose();
  };
  return { renderer, scene, camera, pivot, lights: { key, rim, under }, render, resize, dispose };
}

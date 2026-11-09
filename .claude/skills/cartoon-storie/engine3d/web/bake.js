// "Impostori" (references/migliora-frame.md §5): ogni modello del kit viene fotografato da 3 lati con la stessa
// direzione del sole della scena, su sfondo trasparente. Nella scena diventano cartoncini rivolti alla camera:
// aspetto del modello vero, costo di un quadrato. Servono per alberi e oggetti pesanti ripetuti molte volte.
// Avvio: node bake.mjs nome1,nome2  (KIT=<asset kit>, SOLE=x,y,z)
import * as THREE from 'three';
import { GLTFLoader } from '../lib/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../lib/jsm/loaders/RGBELoader.js';
const Q = new URLSearchParams(location.search), S = 512, VIEWS = 3;
const MODELS = (Q.get('m') || '').split(','), SUN = (Q.get('sole') || '1,0.9,-0.32').split(',').map(Number), HDR = Q.get('hdri') || 'kloofendal_48d_partly_cloudy_puresky';
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(S, S); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const hdr = await new RGBELoader().loadAsync(`/kit/hdri/${HDR}.hdr`);
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
scene.add(new THREE.HemisphereLight(0xd6e4ff, 0x4a4a3a, .6));
const sun = new THREE.DirectionalLight(0xfff6ea, 2.6); scene.add(sun);
window.OUT = {};
for (const name of MODELS) {
  const g = await new GLTFLoader().loadAsync(`/kit/modelli/${name}/${name}.gltf`);
  const root = g.scene;
  root.traverse(o => { if (o.isMesh) { const m = o.material; m.transparent = false; m.alphaTest = .5; m.depthWrite = true; m.side = THREE.DoubleSide; m.envMapIntensity = .5; } });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  root.position.sub(new THREE.Vector3(c.x, box.min.y, c.z)); scene.add(root);
  const half = Math.max(size.x, size.z, size.y) / 2 * 1.02;
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, .1, 100);
  for (let v = 0; v < VIEWS; v++) {
    const a = v / VIEWS * Math.PI * 2;
    cam.position.set(Math.sin(a) * 30, half, Math.cos(a) * 30); cam.lookAt(0, half, 0);
    sun.position.set(...SUN).applyAxisAngle(new THREE.Vector3(0, 1, 0), a).multiplyScalar(50);   // il sole resta nella stessa posizione rispetto alla vista
    renderer.render(scene, cam);
    window.OUT[`${name}_${v}`] = { png: renderer.domElement.toDataURL('image/png'), lato_m: half * 2, altezza_m: size.y };
  }
  scene.remove(root);
}
window.DONE = true;

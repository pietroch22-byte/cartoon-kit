// "Impostori": ogni modello vero del kit viene fotografato da più lati con la stessa luce della scena,
// su sfondo trasparente. La scena poi usa queste foto come cartoncini: aspetto reale, costo minimo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
const S = 512, VIEWS = 3;
const MODELS = (new URLSearchParams(location.search).get('m') || '').split(',');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(S, S); renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const hdr = await new RGBELoader().loadAsync('./assets/hdri/kloofendal_48d_partly_cloudy_puresky.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
scene.add(new THREE.HemisphereLight(0xd6e4ff, 0x4a4a3a, .6));
const sun = new THREE.DirectionalLight(0xfff6ea, 2.6); sun.position.set(1, .9, -.32).multiplyScalar(50); scene.add(sun); // stessa direzione del sole della scena
window.OUT = {};
for (const name of MODELS) {
  const g = await new GLTFLoader().loadAsync(`./assets/modelli/${name}/${name}.gltf`);
  const root = g.scene;
  root.traverse(o => { if (o.isMesh) { const m = o.material; m.transparent = false; m.alphaTest = .5; m.depthWrite = true; m.side = THREE.DoubleSide; m.envMapIntensity = .5; } });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  root.position.sub(new THREE.Vector3(c.x, box.min.y, c.z)); scene.add(root);
  const half = Math.max(size.x, size.z, size.y) / 2 * 1.02;
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, .1, 100);
  for (let v = 0; v < VIEWS; v++) {
    const a = v / VIEWS * Math.PI * 2;
    cam.position.set(Math.sin(a) * 30, half, Math.cos(a) * 30); cam.lookAt(0, half, 0);
    sun.position.set(1, .9, -.32).applyAxisAngle(new THREE.Vector3(0, 1, 0), a).multiplyScalar(50); // il sole resta "a destra" della vista
    renderer.render(scene, cam);
    window.OUT[`${name}_${v}`] = { png: renderer.domElement.toDataURL('image/png'), w: half * 2, h: half * 2 };
  }
  scene.remove(root);
}
window.DONE = true;

// Camera dal punto di fuga + riproiezione dei pixel nel mondo 3D.
// Uso: node kit/tools/misura.mjs punti.json   (usa il three.js del motore, engine3d/lib)
// punti.json: {"fov":62,"altezza":1.8,"W":1080,"H":1920,"fuga":[452,515],
//   "suolo":{"linea gialla a":[165,840],...},            -> punto a terra (y=0)
//   "altezza_nota":{"paraurti":[497,785,0.32]},           -> punto a quota nota
//   "sopra":{"testa":[[422,797],[422,543]]},              -> altezza di un punto sopra un punto a terra
//   "profondita":{"portale":[215,440,-140]}}             -> punto su un piano z noto
// Controllo: più punti della stessa linea retta devono dare la stessa x; se no, cambia "altezza".
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const three = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../engine3d/lib/three.module.js');
const THREE = await import(pathToFileURL(three).href);
const P = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), W = P.W || 1080, H = P.H || 1920, CH = P.altezza || 1.8;
const cam = new THREE.PerspectiveCamera(P.fov || 62, W / H, .05, 5000); cam.rotation.order = 'YXZ'; cam.position.set(0, CH, 0);
const toPx = v => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
for (let i = 0; i < 300; i++) { cam.updateMatrixWorld(); const [x, y] = toPx(new THREE.Vector3(0, CH, -4000)); cam.rotation.y -= (x - P.fuga[0]) * .0004; cam.rotation.x -= (y - P.fuga[1]) * .0004; }
cam.updateMatrixWorld();
const ray = (px, py) => new THREE.Vector3(px / W * 2 - 1, 1 - py / H * 2, .5).unproject(cam).sub(cam.position).normalize();
const atH = (px, py, h = 0) => { const d = ray(px, py); return cam.position.clone().addScaledVector(d, (h - CH) / d.y); };
const atZ = (px, py, z) => { const d = ray(px, py); return cam.position.clone().addScaledVector(d, z / d.z); };
const f = v => `x=${v.x.toFixed(2)} y=${v.y.toFixed(2)} z=${v.z.toFixed(2)}`;
console.log(`camera: altezza ${CH} m, beccheggio ${(cam.rotation.x * 57.2958).toFixed(2)}°, imbardata ${(cam.rotation.y * 57.2958).toFixed(2)}° (rotation.order YXZ)`);
for (const [n, [x, y]] of Object.entries(P.suolo || {})) console.log('suolo      ', n.padEnd(22), f(atH(x, y)));
for (const [n, [x, y, h]] of Object.entries(P.altezza_nota || {})) console.log('quota      ', n.padEnd(22), f(atH(x, y, h)));
for (const [n, [[fx, fy], [x, y]]] of Object.entries(P.sopra || {})) { const g = atH(fx, fy), d = ray(x, y); const t = Math.hypot(g.x, g.z) / Math.hypot(d.x, d.z); console.log('sopra      ', n.padEnd(22), f(cam.position.clone().addScaledVector(d, t))); }
for (const [n, [x, y, z]] of Object.entries(P.profondita || {})) console.log('profondità ', n.padEnd(22), f(atZ(x, y, z)));

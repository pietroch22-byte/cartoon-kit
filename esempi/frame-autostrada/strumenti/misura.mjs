// Ricava la camera dal punto di fuga misurato e riproietta i pixel del riferimento nel mondo 3D.
// Uso: node strumenti/misura.mjs [fov=62] [altezza camera=1.8]
import * as THREE from '../node_modules/three/build/three.module.js';
const W = 1080, H = 1920, FOV = +process.argv[2] || 62, CAM_H = +process.argv[3] || 1.8;
const camera = new THREE.PerspectiveCamera(FOV, W / H, .05, 4000);
camera.rotation.order = 'YXZ'; camera.position.set(0, CAM_H, 0);
const VP = [452, 515];
const toPx = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
for (let i = 0; i < 200; i++) {
  camera.updateMatrixWorld();
  const [x, y] = toPx(new THREE.Vector3(0, CAM_H, -3000));
  camera.rotation.y -= (x - VP[0]) * .0004; camera.rotation.x -= (y - VP[1]) * .0004;
}
camera.updateMatrixWorld();
const ray = (px, py) => new THREE.Vector3(px / W * 2 - 1, 1 - py / H * 2, .5).unproject(camera).sub(camera.position).normalize();
const atH = (px, py, h = 0) => { const d = ray(px, py); return camera.position.clone().addScaledVector(d, (h - CAM_H) / d.y); };
const atZ = (px, py, z) => { const d = ray(px, py); return camera.position.clone().addScaledVector(d, z / d.z); };
const above = (fx, fy, px, py) => { const g = atH(fx, fy); const d = ray(px, py); return camera.position.clone().addScaledVector(d, Math.hypot(g.x, g.z) / Math.hypot(d.x, d.z)); };
const f = v => `x=${v.x.toFixed(2)} y=${v.y.toFixed(2)} z=${v.z.toFixed(2)}`;
console.log(`camera: fov ${FOV}°, altezza ${CAM_H} m, beccheggio ${THREE.MathUtils.radToDeg(camera.rotation.x).toFixed(2)}°, imbardata ${THREE.MathUtils.radToDeg(camera.rotation.y).toFixed(2)}°`);
console.log('\nlinea gialla (deve dare la stessa x in tutti e tre i punti):');
for (const p of [[60, 950], [165, 840], [340, 640]]) console.log(' ', p, f(atH(...p)));
console.log('\nstrada:');
for (const [n, px, py] of [['base spartitraffico', 60, 765], ['bande sonore (a)', 60, 800], ['bande sonore (b)', 60, 875], ['tratteggio destro', 1020, 620], ['linea bianca destra', 1040, 608], ['guardrail', 1040, 585]]) console.log(' ', n.padEnd(20), f(atH(px, py)));
console.log('\noggetti:');
console.log('  piedi personaggio     ', f(atH(422, 797)), '| cima testa', f(above(422, 797, 422, 543)));
console.log('  paraurti auto sx/dx   ', f(atH(497, 785, .32)), '|', f(atH(858, 785, .32)));
console.log('  altezze retro auto (z=-9):', [530, 545, 610, 650, 698, 728, 790].map(py => `${py}px→${atZ(680, py, -9).y.toFixed(2)}m`).join('  '));
console.log('  cima spartitraffico   ', f(above(60, 765, 60, 622)));
console.log('  portale a z=-140      ', f(atZ(215, 440, -140)), '→', f(atZ(665, 440, -140)));

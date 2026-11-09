// Frame "autostrada" v2 — ricostruzione misurata sul frame di riferimento.
// Mondo 3D (three.js) + abitacolo dipinto a pixel esatti + volante 3D + personaggio 2D.
// Nessuna AI, nessun asset esterno: tutto procedurale e deterministico.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920;

// ---------- utilità deterministiche ----------
let seed = 12345;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + (b - a) * rnd();
function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;   // colori prevedibili: si confrontano 1:1 con il riferimento
document.getElementById('wrap').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(new THREE.Color(0xd2e2f0), 0.0017);   // ~50% di foschia a 500 m, come gli alberi lontani del riferimento

// ---------- camera: risolta dal punto di fuga misurato ----------
// Altezza 1,8 m (SUV/pickup): è l'unica che rende la linea gialla misurata dritta e l'auto larga ~1,95 m.
const FOV = 62, ASP = W / H, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const camera = new THREE.PerspectiveCamera(FOV, ASP, .05, 4000);
camera.rotation.order = 'YXZ'; camera.position.set(0, 1.8, 0);
const VP = [452, 515];                       // punto di fuga della strada nel riferimento (px)
const toPx = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
for (let i = 0; i < 200; i++) {
  camera.updateMatrixWorld();
  const [x, y] = toPx(new THREE.Vector3(0, camera.position.y, -3000));
  camera.rotation.y -= (x - VP[0]) * .0004; camera.rotation.x -= (y - VP[1]) * .0004;
}
camera.updateMatrixWorld(); scene.add(camera);
const ray = (px, py) => new THREE.Vector3(px / W * 2 - 1, 1 - py / H * 2, .5).unproject(camera).sub(camera.position).normalize();
const atH = (px, py, h = 0) => { const d = ray(px, py); return camera.position.clone().addScaledVector(d, (h - camera.position.y) / d.y); };
const atZ = (px, py, z) => { const d = ray(px, py); return camera.position.clone().addScaledVector(d, (z - camera.position.z) / d.z); };

// ---------- cielo (gradiente ripido: nel frame si vedono solo ~7° sopra l'orizzonte) ----------
const SUN_DIR = new THREE.Vector3(1, .9, -.32).normalize();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }`,
  fragmentShader: `varying vec3 vd;
    vec3 s2l(vec3 c){ return pow(c, vec3(2.2)); }
    void main(){ float h = vd.y;
      vec3 hor = s2l(vec3(.86,.91,.95)), mid = s2l(vec3(.73,.86,.96)), top = s2l(vec3(.58,.79,.96)), zen = s2l(vec3(.45,.70,.95));
      vec3 c = mix(hor, mid, smoothstep(.0,.02,h)); c = mix(c, top, smoothstep(.02,.07,h)); c = mix(c, zen, smoothstep(.12,.5,h));
      gl_FragColor = vec4(c,1.); }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat));

// nuvole cartoon a fondo piatto, posizionate a pixel come nel riferimento
function cloudTex(seedN) {
  seed = seedN;
  return canvas(512, 200, (g, w, h) => {
    const base = 150;
    const puffs = []; let x = 40;
    while (x < w - 40) { const r = R(28, 62); puffs.push([x, base - r * R(.55, .9), r]); x += r * R(.7, 1.1); }
    puffs.forEach(([x, y, r]) => { g.fillStyle = rad(g, x, y, r * .55, r, [[0, 'rgba(255,255,255,.96)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, base, w, h); // fondo piatto
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lin(g, 0, 40, 0, base, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(190,215,245,.4)'], [1, 'rgba(150,190,235,.8)']]);
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  });
}
[[60, 345, 200], [300, 385, 260], [470, 358, 250], [640, 350, 230], [860, 330, 160], [960, 318, 200], [210, 425, 180], [720, 405, 160], [420, 440, 160], [120, 470, 160], [830, 455, 140]]
  .forEach(([px, py, wpx], i) => {
    const p = atZ(px, py, -1100), p2 = atZ(px + wpx, py, -1100);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(100 + i * 31), fog: false, depthWrite: false, opacity: .9 }));
    const wm = p.distanceTo(p2); sp.scale.set(wm, wm * 200 / 512, 1); sp.position.copy(p); scene.add(sp);
  });

// ---------- luci: sole da destra-dietro, ombre blu sature come nel riferimento ----------
scene.add(new THREE.HemisphereLight(0xd6e4ff, 0x6f6a5c, .8));
const sun = new THREE.DirectionalLight(0xfff6ea, 3.1);
sun.target.position.set(0, 0, -14); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 60);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 160 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; sun.shadow.radius = 2.5;
scene.add(sun, sun.target);
{
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
    vertexShader: `varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vd; void main(){ float h = vd.y;
      vec3 c = h > 0. ? mix(vec3(.16,.2,.27), vec3(.55,.75,1.), smoothstep(.0,.35,h)) : mix(vec3(.12,.12,.13), vec3(.02,.02,.025), smoothstep(0.,.1,-h));
      gl_FragColor = vec4(c,1.); }` })));
  scene.environment = pm.fromScene(es, 0.02).texture;
}

// ---------- terreno e strada ----------
// Ombre blu sature come nel riferimento: si tinge solo la luce indiretta dei materiali a terra,
// così l'auto e il personaggio non diventano blu.
const SHADOW_TINT = new THREE.Vector3(.08, .29, 1.08);
function blueShadows(mat) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTint = { value: SHADOW_TINT };
    sh.fragmentShader = 'uniform vec3 uTint;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.indirectDiffuse *= uTint;');
  };
  mat.customProgramCacheKey = () => 'blueShadows';
  mat.envMapIntensity = .12;
  return mat;
}
const grassTex = canvas(512, 512, (g, w, h) => {
  g.fillStyle = '#86b04e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${R(70, 105)},${R(40, 60)}%,${R(32, 52)}%)`; g.fillRect(R(0, w), R(0, h), R(1, 3), R(2, 6)); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `hsl(${R(48, 58)},90%,${R(55, 70)}%)`; g.fillRect(R(0, w), R(0, h), 2, 2); } // fiori gialli
});
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(140, 280);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 2800), blueShadows(new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.03, -1200); ground.receiveShadow = true; scene.add(ground);

const asphaltTex = canvas(512, 512, (g, w, h) => {
  g.fillStyle = '#b4b5b9'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const v = R(160, 195) | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(R(0, w), R(0, h), 1.5, 1.5); }
});
asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;
function road(x0, x1) {
  const t = asphaltTex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 4, 2400 / 4);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2400), blueShadows(new THREE.MeshStandardMaterial({ map: t, roughness: .95 })));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, -1195); m.receiveShadow = true; scene.add(m);
}
road(-2.95, 13.2);   // nostra carreggiata (dalla base dello spartitraffico alla corsia d'emergenza destra)
road(-40, -3.75);    // carreggiata opposta (4 corsie + emergenza)

const lineMat = c => blueShadows(new THREE.MeshStandardMaterial({ color: c, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2 }));
function solid(x, w, c, z0 = 5, z1 = -2400) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, z0 - z1), lineMat(c));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .006, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m);
}
function dashed(x, c, len = 3, gap = 9, n = 200) {
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.15, len), lineMat(c), n);
  const o = new THREE.Object3D(); o.rotation.x = -Math.PI / 2;
  for (let i = 0; i < n; i++) { o.position.set(x, .006, -6 - i * (len + gap)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.receiveShadow = true; scene.add(im);
}
solid(-1.7, .2, 0xf1d22a);                    // linea gialla misurata a x=-1,70
dashed(2.05, 0xf6f6f6); dashed(5.8, 0xf6f6f6); dashed(9.85, 0xf6f6f6);
solid(11.75, .2, 0xf6f6f6, 5, -30);           // bordo destro, poi si apre la rampa d'uscita
{
  const s = new THREE.Shape(); s.moveTo(-.1, 0); s.lineTo(.1, 0); s.lineTo(.1 + 3.2, 400); s.lineTo(-.1 + 3.2, 400); s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), lineMat(0xf6f6f6)); m.rotation.x = -Math.PI / 2; m.position.set(11.75, .006, -30); m.receiveShadow = true; scene.add(m);
}
for (const x of [-20.5, -24.2, -27.9, -31.6]) dashed(x, 0xf0f0f0);
solid(-4.1, .15, 0xf1d22a); solid(-16.8, .15, 0xf1d22a); solid(-35.3, .15, 0xf6f6f6);
for (const x of [-7.8, -11.5]) dashed(x, 0xf0f0f0);
// bande sonore (rumble strip) tra x -2,59 e -2,06, come misurato
{
  const n = 2600, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.5, .14), lineMat(0x7b7f88), n);
  const o = new THREE.Object3D(); o.rotation.x = -Math.PI / 2;
  for (let i = 0; i < n; i++) { o.position.set(-2.33, .005, -3 - i * .34); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.receiveShadow = true; scene.add(im);
}
// spartitraffico in cemento: base a x=-2,95, alto 1,05 m (misurati)
{
  const pr = [[0, 0], [.9, 0], [.75, .3], [.62, 1.05], [.24, 1.05], [.1, .3]];
  const s = new THREE.Shape(pr.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 2400, bevelEnabled: false });
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xf0eee8, roughness: .95 }));
  m.rotation.y = Math.PI; m.position.set(-2.95, 0, 5); // la faccia interna guarda verso la nostra corsia (+x)
  m.castShadow = m.receiveShadow = true; scene.add(m);
}
// guardrail a destra (x=15,6)
{
  const steel = new THREE.MeshStandardMaterial({ color: 0x8ea3c4, metalness: .6, roughness: .35 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.08, .34, 2400), steel); rail.position.set(15.6, .65, -1195); rail.castShadow = true; scene.add(rail);
  const n = 700, im = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, .8, .12), new THREE.MeshStandardMaterial({ color: 0x4f6fa8, metalness: .4, roughness: .5 }), n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.position.set(15.72, .4, -2 - i * 2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; scene.add(im);
}
// pali della luce sul lato sinistro
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a919c, metalness: .5, roughness: .4 });
  for (const z of [-62, -102, -142, -182, -222, -262]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, 13, 8), mat); p.position.set(-15.2, 6.5, z); p.castShadow = true; scene.add(p);
    const a = new THREE.Mesh(new THREE.BoxGeometry(2.2, .1, .1), mat); a.position.set(-14.2, 12.9, z); scene.add(a);
  }
}

// ---------- alberi: chiome a grappoli, istanziate ----------
{
  const trunks = [], crowns = [];
  const zone = (xa, xb, za, zb, n, h0, h1) => { for (let i = 0; i < n; i++) trunks.push([R(xa, xb), -R(za, zb), R(h0, h1)]); };
  zone(24, 85, 48, 700, 700, 6, 11); zone(30, 60, 28, 48, 25, 6, 9);       // destra, oltre l'erba fiorita
  zone(-80, -42, 30, 700, 800, 15, 23); zone(-140, -80, 30, 700, 300, 14, 20);   // sinistra, oltre la carreggiata opposta
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .3, 1, 6), new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 1 }), trunks.length);
  const o = new THREE.Object3D(), col = new THREE.Color();
  trunks.forEach(([x, z, h], i) => {
    o.position.set(x, h * .4, z); o.scale.set(1, h * .8, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
    const cr = R(2.2, 3.8), k = R(16, 26) | 0, hue = R(.27, .37);
    for (let j = 0; j < k; j++) {
      const a = R(0, 6.28), rr2 = R(0, 1) * cr;
      const y = h * R(.35, .95);
      crowns.push([x + Math.cos(a) * rr2, y, z + Math.sin(a) * rr2, cr * R(.4, .66), hue, (y - h * .35) / (h * .6)]);
    }
  });
  tr.castShadow = true; scene.add(tr);
  const leafTex = canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = R(120, 255) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(R(0, w), R(0, h), R(2, 6), R(1.5, 4), R(0, 3), 0, 7); g.fill(); }
  });
  leafTex.colorSpace = THREE.NoColorSpace;
  const cm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ roughness: .9, map: leafTex }), crowns.length);
  crowns.forEach(([x, y, z, s, hue, t], i) => {
    o.position.set(x, y, z); o.scale.set(s, s * .8, s); o.rotation.set(R(0, 3), R(0, 3), 0); o.updateMatrix(); cm.setMatrixAt(i, o.matrix);
    cm.setColorAt(i, col.setHSL(hue, R(.38, .55), .32 + t * .2 + R(-.05, .05)));
  });
  cm.castShadow = true; scene.add(cm);
}

{
  const n = 1800, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 1 }), n);
  const o = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const s = R(.3, .8); o.position.set(R(16.5, 26), s * .4, -R(8, 500)); o.scale.set(s * 1.4, s * .7, s * 1.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, rnd() < .45 ? col.setHSL(R(.13, .16), .75, R(.5, .6)) : col.setHSL(R(.2, .28), .5, R(.35, .45)));
  }
  scene.add(im);
}
// ---------- portale con cartelli (z=-140, misurato dai pixel) ----------
function signTex(w, h, draw) { return canvas(w, h, (g) => { g.fillStyle = '#137a4e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2f2f2'; g.lineWidth = 7; rr(g, 9, 9, w - 18, h - 18, 14); g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; draw(g); }); }
{
  const Z = -140, steel = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: .3, roughness: .45 });
  const add = (geo, p, mat = steel) => { const m = new THREE.Mesh(geo, mat); m.position.copy(p); scene.add(m); return m; };
  const L = atZ(215, 440, Z), Rr = atZ(665, 440, Z);
  for (const P of [L, Rr]) add(new THREE.CylinderGeometry(.3, .35, P.y + .2, 10), new THREE.Vector3(P.x, (P.y + .2) / 2, Z));
  const span = Rr.x - L.x, cx = (L.x + Rr.x) / 2;
  for (const dy of [-.6, .6]) for (const dz of [-.5, .5]) add(new THREE.BoxGeometry(span, .22, .22), new THREE.Vector3(cx, L.y + dy, Z + dz));
  for (let i = 0; i < 30; i++) for (const dz of [-.5, .5]) { const b = add(new THREE.BoxGeometry(.12, 1.7, .12), new THREE.Vector3(L.x + (i + .5) * span / 30, L.y, Z + dz)); b.rotation.z = i % 2 ? .62 : -.62; }
  const board = (tl, br, tex) => {
    const a = atZ(tl[0], tl[1], Z + .4), b = atZ(br[0], br[1], Z + .4);
    const m = add(new THREE.BoxGeometry(b.x - a.x, a.y - b.y, .15), new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, Z + .4),
      [steel, steel, steel, steel, new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .6 }), steel]);
    return m;
  };
  board([447, 417], [513, 462], signTex(300, 205, g => {
    g.fillStyle = '#c8202a'; rr(g, 40, 22, 60, 30, 6); g.fill(); g.fillStyle = '#2d4fb0'; rr(g, 40, 50, 60, 52, 8); g.fill();
    g.fillStyle = '#fff'; g.font = '800 34px Inter'; g.fillText('58', 70, 88); g.font = '700 26px Inter'; g.fillText('EAST', 175, 80);
    g.font = '700 30px Inter'; g.fillText('Cobbleridge', 150, 160);
  }));
  board([517, 412], [605, 462], signTex(400, 230, g => {
    g.font = '700 44px Inter'; g.fillText('Ambervale', 200, 78); g.fillText('Quietbrook', 200, 130); g.font = '700 30px Inter'; g.fillText('1 MILE', 200, 195);
  }));
  board([560, 402], [605, 413], signTex(200, 50, g => { g.font = '800 30px Inter'; g.fillText('EXIT 9', 100, 38); }));
}

// ---------- veicoli ----------
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x17171a, roughness: .9 });
function softBox(w, h, d, seg = 8, round = .12) { // scatola con spigoli smussati
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3();
  const inner = new THREE.Vector3(w / 2 - round, h / 2 - round, d / 2 - round);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = new THREE.Vector3(THREE.MathUtils.clamp(v.x, -inner.x, inner.x), THREE.MathUtils.clamp(v.y, -inner.y, inner.y), THREE.MathUtils.clamp(v.z, -inner.z, inner.z));
    const dl = v.clone().sub(c); if (dl.length() > 0) v.copy(c.add(dl.normalize().multiplyScalar(round)));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function wheels(grp, w, zs, r = .34) {
  for (const sx of [-1, 1]) for (const z of zs) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .26, 24), tyreMat);
    t.rotation.z = Math.PI / 2; t.position.set(sx * (w / 2 - .14), r, z); t.castShadow = true; grp.add(t);
  }
}
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a2a9a, metalness: 0, roughness: .1, clearcoat: 1, envMapIntensity: .35 });
function simpleCar(color, x, z) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: .35, clearcoat: .8 });
  const b = new THREE.Mesh(softBox(1.85, .7, 4.4, 4, .15), paint); b.position.set(0, .62, -2.2); g.add(b);
  const c = new THREE.Mesh(softBox(1.6, .5, 2.1, 4, .15), glassMat); c.position.set(0, 1.18, -2.3); g.add(c);
  wheels(g, 1.85, [-.8, -3.6]); g.traverse(m => m.castShadow = true);
  g.position.set(x, 0, z); scene.add(g);
}
simpleCar(0xf4f4f4, 8.7, -67); simpleCar(0x3c5c9a, 3.4, -95); simpleCar(0xdcdcdc, -.2, -130);
simpleCar(0x8a9098, 7.2, -170); simpleCar(0xf2f2f2, 3.8, -230); simpleCar(0x30343a, .3, -290);
simpleCar(0xe2e2e2, -9.3, -60); simpleCar(0x5a6b7a, -5.6, -120); simpleCar(0xf0f0f0, -12.6, -200);

// ---------- berlina rossa tamponata: retro a z=-9,0, centro x=1,27 (misurati) ----------
{
  const car = new THREE.Group(); // origine: centro del retro, a terra; la vettura si estende verso -z
  const red = new THREE.MeshPhysicalMaterial({ color: 0xff0626, roughness: .38, clearcoat: .3, clearcoatRoughness: .1, vertexColors: true, envMapIntensity: .9 });
  const redPlain = red.clone(); redPlain.vertexColors = false;   // per i pezzi senza attributo colore (altrimenti risultano neri)
  const dent = (v) => { // ammaccatura sul quarto posteriore destro, con pieghe
    const dx = (v.x - .62) / .5, dy = (v.y - .62) / .32, dz = (v.z - 0) / .7;
    const f = Math.exp(-(dx * dx * .8 + dy * dy + dz * dz) * 1.3) * (v.x > .1 ? 1 : 0.3);
    const crease = .5 + .5 * Math.sin(v.x * 9 + v.y * 13 + Math.sin(v.y * 7) * 2);
    return [f, crease];
  };
  // carrozzeria bassa (fino alla linea di cintura a 1,07 m)
  const bodyG = softBox(1.95, .86, 4.85, 44, .17);
  bodyG.translate(0, .64, -2.425);
  const p = bodyG.attributes.position, cols = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const [f, cr] = dent(v);
    v.z -= f * (.34 + .16 * cr); v.x += f * .16 * (v.x > .66 ? 1 : 0); v.y -= f * .06 * cr;
    // coda leggermente rastremata in alto (baule)
    if (v.y > .95 && v.z > -1.0) v.z -= (v.y - .95) * .6;
    if (v.y > 1.0) v.y += THREE.MathUtils.clamp(-v.z / .55, 0, 1) * .12;   // baule che sale verso il lunotto
    p.setXYZ(i, v.x, v.y, v.z);
    let k = (1 - f * (.9 * cr - .25)) * THREE.MathUtils.lerp(.45, 1, THREE.MathUtils.smoothstep(v.y, .3, .95));
    if (v.x < -.9) k *= .6;
    cols.set([k, k, k], i * 3);
  }
  bodyG.setAttribute('color', new THREE.BufferAttribute(cols, 3)); bodyG.computeVertexNormals();
  car.add(new THREE.Mesh(bodyG, red));
  // abitacolo rastremato: lunotto inclinato da (z -0,55; 1,08) a (z -1,35; 1,6)
  const cabG = softBox(1.74, .55, 2.9, 12, .2); cabG.translate(0, 1.36, -2.0);
  const cp = cabG.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const y = cp.getY(i), t = (y - 1.085) / .55;
    cp.setX(i, cp.getX(i) * (1 - .27 * t));
    let z = cp.getZ(i); z = z > -2.0 ? z - (z + 2.0) * .62 * t : z - (z + 2.0) * .4 * t; cp.setZ(i, z);
  }
  cabG.computeVertexNormals();
  const cab = new THREE.Mesh(cabG, redPlain); car.add(cab);
  // vetri: stessa forma dell'abitacolo, ma solo sopra la linea di cintura (1,22 m) e un filo più fuori sul lunotto
  const glG = cabG.clone(), gp = glG.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    gp.setY(i, THREE.MathUtils.clamp(gp.getY(i), 1.2, 1.535)); gp.setX(i, gp.getX(i) * .92);
    if (gp.getZ(i) > -2.0) gp.setZ(i, gp.getZ(i) + .045);
  }
  glG.computeVertexNormals(); car.add(new THREE.Mesh(glG, glassMat));
  // barra luci a tutta larghezza + fanali a sbalzo
  const lensDk = new THREE.MeshStandardMaterial({ color: 0x1a0306, roughness: .15, metalness: .3 });
  const lit = new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2a1a, emissiveIntensity: .75 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, .028, .04), lit); bar.position.set(-.05, 1.03, .015); car.add(bar);
  const barDk = new THREE.Mesh(new THREE.BoxGeometry(1.9, .1, .03), lensDk); barDk.position.set(0, 1.03, -.005); car.add(barDk);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(softBox(.16, .2, .26, 3, .04), lensDk); c.position.set(s * .885, .98, -.1); car.add(c); }
  // logo e targa (WHPLSH) su canvas
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(.32, .05), new THREE.MeshStandardMaterial({ transparent: true, roughness: .3, metalness: .8,
    map: canvas(256, 40, (g, w, h) => { g.fillStyle = '#d8d8dc'; g.font = '700 30px Inter'; g.textAlign = 'center'; g.letterSpacing = '6px'; g.fillText('TAVREN', w / 2, 31); }) }));
  logo.position.set(-.05, .93, .02); car.add(logo);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.38, .17), new THREE.MeshStandardMaterial({ roughness: .5,
    map: canvas(380, 170, (g, w, h) => {
      g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#f4a640'], [.22, '#f7f2e8'], [1, '#f2f2f2']]); rr(g, 0, 0, w, h, 14); g.fill();
      g.strokeStyle = '#333'; g.lineWidth = 4; rr(g, 3, 3, w - 6, h - 6, 12); g.stroke();
      g.fillStyle = '#1b1f2e'; g.font = '800 88px Inter'; g.textAlign = 'center'; g.fillText('WHPLSH', w / 2, 140);
    }) }));
  plate.position.set(.0, .72, .02); car.add(plate);
  // angolo del paraurti piegato verso l'esterno e fessura scura
  const flap = new THREE.Mesh(softBox(.4, .3, .06, 4, .025), redPlain); flap.position.set(.84, .52, -.06); flap.rotation.set(.05, .42, -.1); car.add(flap);
  const gap = new THREE.Mesh(new THREE.BoxGeometry(.3, .05, .05), new THREE.MeshStandardMaterial({ color: 0x050506 })); gap.position.set(.62, .42, -.08); gap.rotation.z = .25; car.add(gap);
  // pezzo nero penzolante e paraurti inferiore con scarichi
  const black = new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: .6 });
  const hang = new THREE.Mesh(new THREE.BoxGeometry(.2, .08, .06), black); hang.position.set(.36, .5, .0); hang.rotation.z = -.35; car.add(hang);
  const low = new THREE.Mesh(softBox(1.86, .16, .3, 4, .05), new THREE.MeshStandardMaterial({ color: 0x141418, roughness: .55 }));
  low.position.set(0, .28, -.1); car.add(low);
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: .2 });
  for (const x of [-.55, .6]) { const e = new THREE.Mesh(new THREE.TorusGeometry(.035, .012, 8, 20), chrome); e.position.set(x, .3, .02); car.add(e); }
  wheels(car, 1.95, [-.85, -3.75], .36);
  car.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  car.position.set(1.27, 0, -9.0); car.rotation.y = .1;   // muso girato a sinistra: si vede il fianco in ombra
  scene.add(car);
}

// ---------- personaggio 2D, ridisegnato sulle proporzioni del riferimento ----------
const charTex = canvas(512, 1024, (g, w, h) => {
  // proporzioni misurate sul riferimento: testa 0-38%, maglia 33-63%, gambe 63-100% dell'altezza
  const ink = '#1d1714'; g.lineCap = g.lineJoin = 'round';
  // gambe sottili chiare con contorno
  for (const [x0, x1, y1] of [[214, 218, 975], [296, 310, 992]]) {
    g.strokeStyle = ink; g.lineWidth = 26; g.beginPath(); g.moveTo(x0, 630); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = '#e9e4df'; g.lineWidth = 12; g.beginPath(); g.moveTo(x0, 630); g.lineTo(x1, y1); g.stroke();
  }
  g.fillStyle = '#3b2a22'; g.strokeStyle = ink; g.lineWidth = 6;
  for (const [x, y] of [[216, 990], [312, 1006]]) { g.beginPath(); g.ellipse(x, y, 20, 11, 0, 0, 7); g.fill(); g.stroke(); }
  // braccio sinistro in ombra (scuro) con mano
  g.fillStyle = '#4a3328'; g.strokeStyle = ink; g.lineWidth = 7;
  g.beginPath(); g.moveTo(160, 360); g.quadraticCurveTo(132, 500, 142, 640); g.lineTo(168, 640); g.quadraticCurveTo(164, 500, 184, 362); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(155, 655, 16, 0, 7); g.fill(); g.stroke();
  // maglia gialla
  const shirt = () => { g.beginPath(); g.moveTo(166, 345); g.quadraticCurveTo(256, 322, 348, 345);
    g.quadraticCurveTo(368, 490, 358, 640); g.quadraticCurveTo(256, 656, 156, 640); g.quadraticCurveTo(150, 490, 166, 345); g.closePath(); };
  g.fillStyle = '#f4c40c'; shirt(); g.fill();
  g.save(); shirt(); g.clip();
  g.fillStyle = 'rgba(190,120,0,.45)'; g.beginPath(); g.ellipse(362, 500, 36, 170, 0, 0, 7); g.fill();   // ombra laterale
  g.fillStyle = '#efe9e2'; g.fillRect(140, 612, 240, 50);                                               // orlo chiaro
  g.fillStyle = '#4a2f1e'; g.fillRect(140, 588, 240, 24);                                               // cintura
  g.fillStyle = '#c9a13a'; rr(g, 234, 584, 42, 32, 5); g.fill();
  g.restore(); g.strokeStyle = ink; g.lineWidth = 9; shirt(); g.stroke();
  g.fillStyle = '#f4c40c'; g.lineWidth = 5;
  for (const y of [400, 436]) { g.beginPath(); g.arc(246, y, 10, 0, 7); g.fill(); g.stroke(); }
  // testa bianca con ombreggiatura a destra
  const head = () => { g.beginPath(); g.ellipse(256, 198, 176, 188, 0, 0, 7); };
  g.fillStyle = '#fbf8f4'; head(); g.fill();
  g.save(); head(); g.clip();
  g.fillStyle = 'rgba(160,150,150,.28)'; g.beginPath(); g.ellipse(410, 230, 70, 200, 0, 0, 7); g.fill();
  // capelli castani a calotta (fino a ~1/3 della testa)
  g.fillStyle = '#5f4338';
  g.beginPath(); g.moveTo(70, 190); g.quadraticCurveTo(60, -10, 256, 8); g.quadraticCurveTo(452, -10, 446, 180);
  g.quadraticCurveTo(400, 118, 330, 128); g.quadraticCurveTo(262, 104, 196, 132); g.quadraticCurveTo(112, 128, 70, 190); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(230, 52, 100, 24, -.1, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = ink; g.lineWidth = 14; head(); g.stroke();
  // bernoccolo sulla fronte
  g.fillStyle = '#ece8e6'; g.lineWidth = 5; g.beginPath(); g.arc(150, 150, 19, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(150, 150, 9, .5, 4.5); g.stroke();
  // occhi tondi con pupille piccole
  for (const x of [208, 304]) {
    g.fillStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.arc(x, 204, 31, 0, 7); g.fill(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(x, 205, 9, 0, 7); g.fill();
  }
  // naso e bocca piccola aperta
  g.lineWidth = 5; g.beginPath(); g.moveTo(246, 240); g.quadraticCurveTo(252, 252, 262, 246); g.stroke();
  g.fillStyle = '#3a2422'; g.beginPath(); g.ellipse(256, 280, 13, 8, 0, 0, 7); g.fill();
});
{
  const feet = atH(422, 797), HGT = 1.67;   // misurati: piedi a (422,797) px, cima della testa a 543 px → 1,63 m
  const ph = HGT * 1024 / 1008;
  const mat = new THREE.MeshBasicMaterial({ map: charTex, alphaTest: .5, side: THREE.DoubleSide, color: 0xffffff });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(ph / 2, ph), mat);
  card.position.set(feet.x, ph / 2 - .02, feet.z);
  card.castShadow = true;
  card.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: charTex, alphaTest: .5 });
  card.lookAt(camera.position.x, card.position.y, camera.position.z);
  scene.add(card);
}

// ============ ABITACOLO: livello dipinto a pixel esatti + volante 3D ============
// L'abitacolo è solidale alla camera, quindi lo si può dipingere direttamente in coordinate schermo.
const cockpitTex = canvas(W, H, (g) => {
  // --- cielo dell'abitacolo (padiglione) e fascia serigrafata del parabrezza
  g.fillStyle = lin(g, 0, 0, 0, 268, [[0, '#3e3c38'], [.55, '#5d5a54'], [1, '#86827a']]); g.fillRect(0, 0, W, 268);
  g.fillStyle = '#3a3a3b'; poly(g, [[0, 262], [W, 262], [W, 304], [0, 342]]); g.fill();
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 262, W, 3);
  for (let x = 0; x < W; x += 9) { g.fillStyle = 'rgba(58,58,59,.55)'; g.beginPath(); g.arc(x, 304 + (W - x) / W * 38 + 4, 2.2, 0, 7); g.fill(); }

  // --- crepa sul parabrezza (centro 790,488)
  {
    seed = 777; const cx = 790, cy = 488; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 13; i++) {
      let a = i / 13 * 6.283 + R(-.2, .2), r = 4, x = cx, y = cy; g.lineWidth = R(1.6, 2.6); g.beginPath(); g.moveTo(x, y);
      const L = R(48, 96);
      while (r < L) { r += R(10, 22); a += R(-.18, .18); x = cx + Math.cos(a) * r * 1.25; y = cy + Math.sin(a) * r * .8; g.lineTo(x, y); }
      g.stroke();
    }
    for (const rd of [14, 30, 52]) {
      g.lineWidth = 1.6; g.beginPath();
      for (let i = 0; i <= 13; i++) { const a = i / 13 * 6.283, q = rd * R(.8, 1.2); const x = cx + Math.cos(a) * q * 1.25, y = cy + Math.sin(a) * q * .8; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.fillStyle = rad(g, cx, cy, 0, 18, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill();
  }

  // --- cofano bianco (contorno misurato)
  const hood = [[W, 836], [360, 840], [300, 845], [232, 858], [182, 884], [148, 930], [118, 985], [100, 1040], [W, 1040]];
  g.fillStyle = lin(g, 0, 836, 0, 1000, [[0, '#f7f7f9'], [.6, '#f2f2f6'], [1, '#e4e6ee']]); poly(g, hood); g.fill();
  g.save(); poly(g, hood); g.clip();
  g.fillStyle = rad(g, 150, 960, 10, 260, [[0, 'rgba(205,212,230,.75)'], [1, 'rgba(205,212,230,0)']]); g.fillRect(0, 830, 600, 220);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 836, W, 5);
  g.restore();
  g.strokeStyle = 'rgba(70,75,90,.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(180, 872); g.quadraticCurveTo(140, 910, 112, 962); g.stroke();
  // tergicristallo
  g.fillStyle = '#20232b'; poly(g, [[298, 941], [822, 918], [824, 931], [300, 956]]); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; poly(g, [[298, 941], [822, 918], [822, 921], [298, 944]]); g.fill();

  // --- plancia: bocchetta sbrinatore, piano superiore
  g.fillStyle = '#2b2f39'; poly(g, [[0, 985], [W, 968], [W, 1000], [0, 1012]]); g.fill();
  g.fillStyle = '#3f6fe0'; for (let x = 300; x < 800; x += 26) { const y = 1004 - (x - 300) / 500 * 10; g.fillRect(x, y, 12, 5); }
  g.fillStyle = lin(g, 0, 1000, 0, 1220, [[0, '#7a849e'], [.25, '#646d86'], [1, '#4b5367']]); poly(g, [[0, 1010], [W, 995], [W, 1920], [0, 1920]]); g.fill();
  // parte sinistra più chiara (illuminata)
  g.fillStyle = lin(g, 0, 1000, 220, 1200, [[0, '#c6cbd7'], [.6, '#aab1c2'], [1, 'rgba(150,158,176,0)']]);
  g.beginPath(); g.moveTo(0, 1008); g.lineTo(230, 1003); g.quadraticCurveTo(200, 1120, 196, 1210); g.lineTo(0, 1215); g.closePath(); g.fill();
  // parte destra
  g.fillStyle = lin(g, 0, 1075, 0, 1215, [[0, '#9aa2b5'], [1, '#7d859a']]);
  g.beginPath(); g.moveTo(745, 1078); g.lineTo(W, 1075); g.lineTo(W, 1212); g.lineTo(752, 1212); g.closePath(); g.fill();
  // strisce LED blu
  g.fillStyle = '#2f6cff'; g.shadowColor = '#3f8cff'; g.shadowBlur = 8;
  g.fillRect(62, 1212, 130, 5); g.fillRect(750, 1207, 330, 5); g.shadowBlur = 0;
  // pannello frontale sotto la linea LED (chiaro ai lati, scuro dietro il volante)
  g.fillStyle = lin(g, 0, 1218, 0, 1450, [[0, '#a9afbe'], [1, '#7f8699']]); g.fillRect(0, 1218, 196, 232); g.fillRect(748, 1214, 332, 236);
  g.fillStyle = lin(g, 0, 1335, 0, 1500, [[0, '#1d232c'], [1, '#161b22']]); g.fillRect(190, 1330, 560, 170);   // misurato: #181d23
  g.fillStyle = lin(g, 0, 1440, 0, 1760, [[0, '#1a2129'], [1, '#10151d']]); g.fillRect(0, 1440, W, 330);      // misurato: #172029 → #10121f
  g.fillStyle = lin(g, 0, 1450, 0, 1760, [[0, '#4a5163'], [1, '#2a3040']]); g.fillRect(860, 1440, 220, 320);
  // pannello basso chiaro (ginocchiera) e piantone a V
  g.fillStyle = lin(g, 0, 1755, 0, 1920, [[0, '#9a99a1'], [1, '#7a7982']]); poly(g, [[0, 1770], [W, 1755], [W, 1920], [0, 1920]]); g.fill();
  g.fillStyle = lin(g, 0, 1700, 0, 1920, [[0, '#3a3f4b'], [1, '#2a2e38']]); poly(g, [[392, 1700], [588, 1700], [560, 1920], [420, 1920]]); g.fill();
  g.fillStyle = '#b8bccb'; poly(g, [[430, 1780], [550, 1780], [500, 1920], [480, 1920]]); g.fill();

  // --- bocchette (cornice cromata, lamelle)
  const vent = (x, y, w, h) => {
    g.fillStyle = lin(g, 0, y - 4, 0, y + h + 4, [[0, '#e4e7ee'], [1, '#8e95a6']]); rr(g, x - 5, y - 5, w + 10, h + 10, 18); g.fill();
    g.fillStyle = '#0f131a'; rr(g, x, y, w, h, 14); g.fill();
    g.strokeStyle = '#3a4252'; g.lineWidth = 4; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + 8, y + i * h / 5); g.lineTo(x + w - 8, y + i * h / 5); g.stroke(); }
  };
  vent(103, 1252, 104, 56); vent(812, 1254, 186, 48); vent(1012, 1254, 90, 48);
  // pannello clima
  g.fillStyle = lin(g, 0, 1305, 0, 1440, [[0, '#2a303c'], [1, '#141820']]); rr(g, 822, 1306, 290, 132, 24); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(830, 1308, 260, 2);
  g.fillStyle = '#c4cad6'; g.font = '700 15px Inter'; g.textAlign = 'center';
  [['A/C', 875], ['MAX', 935], ['FRONT', 995], ['REAR', 1055]].forEach(([t, x]) => g.fillText(t, x, 1340));
  g.font = '700 19px Inter'; g.fillText('72', 878, 1385); g.fillText('72', 1060, 1385);
  for (const x of [872, 966, 1058]) {
    g.fillStyle = rad(g, x - 6, 1398, 2, 30, [[0, '#f4f6fa'], [.5, '#a4abba'], [1, '#3a4150']]); g.beginPath(); g.ellipse(x, 1408, 24, 20, 0, 0, 7); g.fill();
    g.fillStyle = '#20252f'; g.beginPath(); g.ellipse(x, 1424, 24, 9, 0, 0, Math.PI); g.fill();
  }

  // --- schermo infotainment (815..1080 × 893..1075)
  g.fillStyle = '#232c3d'; rr(g, 814, 892, 300, 184, 16); g.fill();
  g.fillStyle = lin(g, 0, 900, 0, 1068, [[0, '#13254a'], [1, '#0b1730']]); rr(g, 822, 900, 290, 168, 10); g.fill();
  g.fillStyle = '#e8eef8'; g.font = '800 17px Inter'; g.textAlign = 'center'; g.fillText('FM 101.3', 966, 922);
  g.fillStyle = lin(g, 838, 935, 912, 1005, [[0, '#68c4ff'], [1, '#3b8ff0']]); g.fillRect(838, 935, 74, 72);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '800 24px Inter'; g.fillText('Morning Drive', 922, 962);
  g.fillStyle = '#d6def0'; g.font = '700 15px Inter'; g.fillText('101.3 The Road', 922, 985);
  g.fillStyle = '#41557e'; g.fillRect(922, 996, 160, 3); g.fillStyle = '#7fc0ff'; g.fillRect(922, 996, 60, 3);
  g.fillStyle = '#e8eef8'; g.font = '800 13px Inter'; g.textAlign = 'center';
  [['HOME', 856], ['AUDIO', 910], ['MAP', 963], ['PHONE', 1016]].forEach(([t, x]) => g.fillText(t, x, 1056));

  // --- quadro strumenti
  g.fillStyle = lin(g, 0, 1040, 0, 1338, [[0, '#8e95a6'], [.07, '#4a5060'], [.5, '#333845'], [1, '#2a2e39']]); rr(g, 190, 1040, 558, 296, 62); g.fill();
  g.strokeStyle = 'rgba(200,206,220,.35)'; g.lineWidth = 3; rr(g, 192, 1042, 554, 292, 60); g.stroke();
  g.fillStyle = lin(g, 0, 1080, 0, 1302, [[0, '#0e1424'], [1, '#141a2c']]); rr(g, 218, 1080, 502, 222, 44); g.fill();
  const gauge = (cx, cy, r, ticks, labels, val, red) => {
    g.fillStyle = rad(g, cx, cy, 8, r, [[0, '#1a2440'], [.85, '#0c1222'], [1, '#0a0f1c']]); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = '#3c9dff'; g.lineWidth = 6; g.shadowColor = '#4aa8ff'; g.shadowBlur = 16; g.beginPath(); g.arc(cx, cy, r - 3, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(190,225,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r - 3, 0, 7); g.stroke(); g.shadowBlur = 0;
    const a0 = Math.PI * .72, a1 = Math.PI * 2.28, ang = t => a0 + (a1 - a0) * t;
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks, a = ang(t), big = i % 2 === 0;
      g.strokeStyle = red && t > red ? '#ff3b3b' : '#f4f6ff'; g.lineWidth = big ? 4 : 2;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9)); g.lineTo(cx + Math.cos(a) * (r - (big ? 22 : 16)), cy + Math.sin(a) * (r - (big ? 22 : 16))); g.stroke();
    }
    g.font = '800 21px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    labels.forEach((l, i) => { const a = ang(i / (labels.length - 1)); g.fillStyle = red && i / (labels.length - 1) > red ? '#ff4b4b' : '#fff'; g.fillText(l, cx + Math.cos(a) * (r - 38), cy + Math.sin(a) * (r - 38)); });
    g.textBaseline = 'alphabetic';
    g.strokeStyle = '#cfd8ea'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy + 58, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.moveTo(cx, cy + 58); g.lineTo(cx + 4, cy + 42); g.stroke();
    const a = ang(val);
    g.strokeStyle = '#ff8a1c'; g.lineWidth = 6; g.shadowColor = '#ff7a00'; g.shadowBlur = 12;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10); g.lineTo(cx + Math.cos(a) * (r - 20), cy + Math.sin(a) * (r - 20)); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = rad(g, cx - 3, cy - 3, 1, 15, [[0, '#9aa4ba'], [1, '#2c3344']]); g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill();
  };
  gauge(316, 1190, 92, 16, ['0', '1', '2', '3', '4', '5', '6', '7', '8'], .09, .86);
  g.fillStyle = '#9fb2cc'; g.font = '700 9px Inter'; g.fillText('x1000r/min', 316, 1165);
  gauge(630, 1186, 92, 14, ['0', '20', '40', '60', '80', '100', '120', '140'], .135, 0);
  g.fillStyle = '#d0dcef'; g.font = '800 12px Inter'; g.fillText('MPH', 630, 1162);
  // display centrale
  g.fillStyle = '#05080f'; rr(g, 412, 1122, 124, 128, 12); g.fill(); g.strokeStyle = '#3d4658'; g.lineWidth = 2; rr(g, 412, 1122, 124, 128, 12); g.stroke();
  g.fillStyle = '#d8e0ee'; g.font = '800 15px Inter'; g.textAlign = 'center'; g.fillText('P  R  N  D', 474, 1146);
  g.fillStyle = '#fff'; g.fillRect(498, 1150, 12, 2);
  g.fillStyle = '#c3182a'; g.shadowColor = '#ff2a3a'; g.shadowBlur = 14; rr(g, 420, 1160, 108, 48, 4); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = '#ff8a8a'; g.lineWidth = 1.5; rr(g, 420, 1160, 108, 48, 4); g.stroke();
  g.fillStyle = '#ffd9d9'; g.beginPath(); g.arc(470, 1172, 5, 0, 7); g.fill(); g.fillRect(466, 1178, 8, 12); g.beginPath(); g.arc(484, 1184, 8, 0, 7); g.fill();
  g.font = '800 8.5px Inter'; g.fillText('CHECK AIRBAG SYSTEM', 474, 1202);
  g.fillStyle = '#e2e8f2'; g.font = '700 11px Inter'; g.fillText('74°F', 442, 1232); g.fillText('48,213 mi', 500, 1232);
  // spie
  g.fillStyle = '#ff2a2a'; g.font = '800 17px Inter'; g.fillText('▲', 457, 1113); g.fillText('◆', 486, 1113);
  g.fillStyle = '#5a6478'; g.fillText('◀', 428, 1113); g.fillText('▶', 517, 1113);
  g.fillStyle = '#ffc400'; g.shadowColor = '#ffb000'; g.shadowBlur = 8; g.beginPath(); g.ellipse(415, 1273, 9, 7, 0, 0, 7); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = '#7d889c'; g.lineWidth = 2; for (const x of [446, 472, 498, 526]) { rr(g, x - 7, 1266, 14, 13, 3); g.stroke(); }

  // --- razze e mozzo del volante (dietro la corona 3D)
  g.fillStyle = lin(g, 0, 1568, 0, 1596, [[0, '#3a4052'], [.4, '#1c2029'], [1, '#0e1016']]);
  rr(g, 206, 1568, 190, 26, 10); g.fill(); rr(g, 586, 1566, 214, 26, 10); g.fill();
  g.fillStyle = lin(g, 0, 1600, 0, 1920, [[0, '#1a1e28'], [1, '#10131a']]); poly(g, [[392, 1598], [592, 1598], [572, 1760], [412, 1760]]); g.fill();
  g.fillStyle = lin(g, 0, 1548, 0, 1622, [[0, '#7a8296'], [.35, '#4c5366'], [1, '#2a2f3c']]); rr(g, 388, 1548, 206, 74, 18); g.fill();
  g.fillStyle = lin(g, 0, 1436, 0, 1560, [[0, '#b7bdcb'], [.3, '#7d8598'], [1, '#4e5568']]); rr(g, 424, 1436, 136, 124, 16); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, 432, 1440, 120, 8, 4); g.fill();
  // pulsantiere sulle razze basse
  const pad = (x, y, w, h, lines) => {
    g.fillStyle = '#121721'; rr(g, x, y, w, h, 10); g.fill(); g.strokeStyle = '#4a83e8'; g.lineWidth = 3; rr(g, x, y, w, h, 10); g.stroke();
    g.fillStyle = '#c9d4ea'; g.font = '700 11px Inter'; g.textAlign = 'center'; lines.forEach(([t, dx, dy]) => g.fillText(t, x + dx, y + dy));
  };
  pad(252, 1655, 118, 66, [['☏', 28, 26], ['◂))', 86, 26], ['+', 28, 54], ['–', 86, 54]]);
  pad(615, 1650, 116, 62, [['CANCEL', 78, 20], ['RES+', 30, 40], ['SET–', 82, 40], ['▲', 30, 56], ['▼', 82, 56]]);
});
const ovScene = new THREE.Scene(), wheelScene = new THREE.Scene(), ovCam = new THREE.PerspectiveCamera(FOV, ASP, .05, 10);
{
  const d = 1, plane = new THREE.Mesh(new THREE.PlaneGeometry(2 * d * TAN * ASP, 2 * d * TAN),
    new THREE.MeshBasicMaterial({ map: cockpitTex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
  plane.position.z = -d; ovScene.add(plane);
}
// volante 3D: corona misurata (centro 505,1622 px; raggio esterno 355 px; cima a 1325 px)
{
  wheelScene.add(new THREE.HemisphereLight(0x8a9cc8, 0x202028, .7));
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(-.3, 1, .6); wheelScene.add(key);
  wheelScene.environment = scene.environment;
  const d = .85, cx = (505 / W * 2 - 1) * d * TAN * ASP, cy = (1 - 2 * 1622 / H) * d * TAN;
  const pxm = W / (2 * d * TAN * ASP);                          // pixel per metro a questa profondità
  const Rout = 355 / pxm, tube = 28 / pxm;
  const leather = new THREE.MeshStandardMaterial({ color: 0x1c2030, roughness: .36, metalness: .05, envMapIntensity: .7 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(Rout - tube, tube, 24, 120), leather);
  ring.position.set(cx, cy, -d); ring.rotation.x = -Math.acos((1622 - 1325) / 355);
  wheelScene.add(ring);
  // cuciture chiare sulla parte alta, a sinistra e a destra
  const st = new THREE.MeshBasicMaterial({ color: 0xb9c2d6 });
  for (let i = 0; i < 70; i++) {
    const a = Math.PI * (.2 + i / 70 * .6); if (Math.abs(a - Math.PI / 2) < .28) continue;
    const s = new THREE.Mesh(new THREE.BoxGeometry(.0042, .0011, .0011), st);
    const rr2 = Rout - tube * 1.55; s.position.set(Math.cos(a) * rr2, Math.sin(a) * rr2, tube * .55); s.rotation.z = a + Math.PI / 2;
    ring.add(s);
  }
}

// ---------- post e render ----------
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .3, .45, .95));
composer.addPass(new OutputPass());
document.fonts.ready.then(() => {
  composer.render();
  renderer.autoClear = false; renderer.clearDepth(); renderer.render(ovScene, ovCam); renderer.clearDepth(); renderer.render(wheelScene, ovCam); renderer.autoClear = true;
  window.DONE = true;
});

// Un singolo frame: POV dall'abitacolo in autostrada, auto rossa tamponata davanti,
// personaggio 2D disegnato in piedi sulla corsia d'emergenza. Tutto procedurale.
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

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.getElementById('wrap').prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG = new THREE.Color(0xcfdceb);
scene.fog = new THREE.FogExp2(FOG, 0.0026);

// ---------- cielo ----------
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sun: { value: new THREE.Vector3(0.35, 0.45, -0.82).normalize() } },
  vertexShader: `varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }`,
  fragmentShader: `varying vec3 vd; uniform vec3 sun;
    void main(){ float h = clamp(vd.y,0.,1.);
      vec3 top = vec3(.04,.20,.66), mid = vec3(.20,.47,.88), hor = vec3(.74,.84,.93);
      vec3 c = mix(hor, mid, smoothstep(0.,.05,h)); c = mix(c, top, smoothstep(.06,.4,h));
      float s = max(dot(normalize(vd), sun), 0.); c += vec3(1.,.95,.8)*(pow(s,8.)*.35 + pow(s,400.)*3.);
      gl_FragColor = vec4(c,1.); }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat);
scene.add(sky);

// nuvole: sprite morbidi
const cloudTex = canvas(512, 256, (g, w, h) => {
  for (let i = 0; i < 70; i++) {
    const x = R(70, w - 70), y = R(120, 175) - Math.sin((x / w) * Math.PI) * 70, r = R(22, 48);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.7, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const sh = g.createLinearGradient(0, 120, 0, 220); sh.addColorStop(0, 'rgba(180,200,225,0)'); sh.addColorStop(1, 'rgba(170,190,215,.55)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, w, h);
});
for (const [x, y, z, s] of [[-300, 150, -700, 230], [150, 240, -800, 260], [430, 120, -650, 200], [-60, 70, -900, 180], [330, 300, -600, 210], [-440, 270, -620, 210], [40, 45, -1000, 160], [-200, 40, -950, 140]]) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, opacity: .95 }));
  sp.position.set(x, y, z); sp.scale.set(s, s / 2, 1); scene.add(sp);
}

// ---------- luci ----------
scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x5d6b47, 1.1));
const sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
sun.position.set(22, 30, -48); sun.target.position.set(0, 0, -12);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(sun, sun.target);

// mappa d'ambiente dal cielo (per le vernici e i vetri)
{
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene(); es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
  const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x4c5a3a }));
  g.rotation.x = -Math.PI / 2; g.position.y = -2; es.add(g);
  scene.environment = pm.fromScene(es, 0.02).texture;
}

// ---------- terreno e strada ----------
const grassTex = canvas(512, 512, (g, w, h) => {
  g.fillStyle = '#6f9a3c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${R(70, 100)},${R(40, 60)}%,${R(28, 48)}%)`; g.fillRect(R(0, w), R(0, h), R(1, 3), R(2, 6)); }
});
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(120, 240);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 2400), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.03, -1000); ground.receiveShadow = true; scene.add(ground);

const asphaltTex = canvas(512, 512, (g, w, h) => {
  g.fillStyle = '#8a8d91'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30000; i++) { const v = R(95, 160) | 0; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(R(0, w), R(0, h), 1.5, 1.5); }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,62,66,.08)'; g.fillRect(R(0, w), 0, R(20, 60), h); } // tracce pneumatici
});
asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;
function road(x0, x1) {
  const t = asphaltTex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 4, 2000 / 4);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2000), new THREE.MeshStandardMaterial({ map: t, roughness: .92, color: 0xd8d8d8 }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, -990); m.receiveShadow = true; scene.add(m);
}
road(-5.2, 13.6);   // nostra carreggiata + corsia d'emergenza sinistra
road(-24, -7.0);    // carreggiata opposta

const lineMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2 });
function solid(x, w, c) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2000), lineMat(c));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.005, -990); m.receiveShadow = true; scene.add(m);
}
function dashed(x, c) {
  const n = 160, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.15, 3), lineMat(c), n);
  const o = new THREE.Object3D(); o.rotation.x = -Math.PI / 2;
  for (let i = 0; i < n; i++) { o.position.set(x, 0.005, -4 - i * 12); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.receiveShadow = true; scene.add(im);
}
solid(-1.95, 0.18, 0xf2c200);          // linea gialla a sinistra
dashed(1.8, 0xf4f4f4); dashed(5.4, 0xf4f4f4);
solid(9.1, 0.18, 0xf4f4f4);            // bordo destro
// bande sonore sulla corsia d'emergenza sinistra
{
  const n = 1400, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.12), lineMat(0x5b5e63), n);
  const o = new THREE.Object3D(); o.rotation.x = -Math.PI / 2;
  for (let i = 0; i < n; i++) { o.position.set(-3.3, 0.004, -3 - i * 0.45); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.receiveShadow = true; scene.add(im);
}
for (const x of [-10.5, -14.1, -17.7]) dashed(x, 0xf0f0f0);
solid(-7.4, 0.15, 0xf2c200);

// spartitraffico in cemento (profilo New Jersey)
{
  const s = new THREE.Shape([[-.3, 0], [.3, 0], [.12, .25], [.08, .85], [-.08, .85], [-.12, .25]].map(p => new THREE.Vector2(...p)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 1500, bevelEnabled: false });
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc9c6bf, roughness: .95 }));
  m.position.set(-6.2, 0, 2); m.rotation.y = Math.PI; m.rotation.y = 0; m.position.z = -1500 + 2;
  m.castShadow = m.receiveShadow = true; scene.add(m);
}
// guardrail a destra
{
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 1500), new THREE.MeshStandardMaterial({ color: 0x9aa7b5, metalness: .7, roughness: .35 }));
  rail.position.set(11, 0.62, -750); rail.castShadow = true; scene.add(rail);
  const n = 400, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), new THREE.MeshStandardMaterial({ color: 0x5c6c80, metalness: .5, roughness: .5 }), n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.position.set(11.12, 0.37, -2 - i * 2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = true; scene.add(im);
}

// ---------- alberi (istanziati) ----------
{
  const trunks = [], crowns = [];
  const zone = (xa, xb, n) => { for (let i = 0; i < n; i++) trunks.push([R(xa, xb), -R(14, 620)]); };
  zone(21, 85, 520); zone(-80, -28, 420);
  for (let i = 0; i < 40; i++) trunks.push([R(-24, -12), -R(260, 620)]); // macchie lontane oltre la carreggiata
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .28, 1, 6), new THREE.MeshStandardMaterial({ color: 0x5b4532, roughness: 1 }), trunks.length);
  const o = new THREE.Object3D(); const col = new THREE.Color();
  trunks.forEach(([x, z], i) => {
    const h = R(5, 11); o.position.set(x, h * .3, z); o.scale.set(1, h * .6, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
    const k = R(4, 7) | 0, cr = R(2.2, 3.6);
    for (let j = 0; j < k; j++) crowns.push([x + R(-1.4, 1.4) * cr * .6, h * .62 + R(-.4, 1.2) * cr * .7, z + R(-1.4, 1.4) * cr * .6, cr * R(.6, 1)]);
  });
  tr.castShadow = true; scene.add(tr);
  const cm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ roughness: .9 }), crowns.length);
  crowns.forEach(([x, y, z, s], i) => {
    o.position.set(x, y, z); o.scale.set(s, s * .85, s); o.rotation.set(R(0, 3), R(0, 3), 0); o.updateMatrix(); cm.setMatrixAt(i, o.matrix);
    cm.setColorAt(i, col.setHSL(R(.22, .30), R(.45, .65), R(.24, .38)));
  });
  cm.castShadow = true; scene.add(cm);
}

// ---------- portale con cartelli ----------
function signTex(lines) {
  return canvas(512, 320, (g, w, h) => {
    g.fillStyle = '#0f7a46'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 8; rr(g, 12, 12, w - 24, h - 24, 18); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center';
    lines.forEach(([t, s, y]) => { g.font = `700 ${s}px Inter`; g.fillText(t, w / 2, y); });
  });
}
{
  const Z = -78, steel = new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: .8, roughness: .35 });
  const add = (geo, x, y, z, mat = steel) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m; };
  add(new THREE.CylinderGeometry(.22, .25, 8.5, 10), -5.6, 4.25, Z);
  add(new THREE.CylinderGeometry(.22, .25, 8.5, 10), 12.2, 4.25, Z);
  for (const y of [7.4, 8.3]) add(new THREE.BoxGeometry(18.2, .14, .14), 3.3, y, Z);
  for (let i = 0; i < 18; i++) { const b = add(new THREE.BoxGeometry(.06, 1.2, .06), -5.4 + i * 1.03, 7.85, Z); b.rotation.z = i % 2 ? .75 : -.75; }
  const s1 = add(new THREE.BoxGeometry(3.6, 2.3, .12), 1.2, 6.2, Z + .3, [steel, steel, steel, steel, new THREE.MeshStandardMaterial({ map: signTex([['A58', 64, 110], ['EST', 44, 165], ['Borgoalto', 52, 250]]), roughness: .6 }), steel]);
  const s2 = add(new THREE.BoxGeometry(4.4, 2.8, .12), 5.6, 6.0, Z + .3, [steel, steel, steel, steel, new THREE.MeshStandardMaterial({ map: signTex([['USCITA 9', 40, 70], ['Valcerro', 62, 160], ['1 km', 50, 250]]), roughness: .6 }), steel]);
}

// ---------- veicoli ----------
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: .9 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2230, metalness: .3, roughness: .05, clearcoat: 1, envMapIntensity: 2.2 });
function softBox(w, h, d, seg = 8, round = .12) { // scatola con spigoli smussati
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3();
  const inner = new THREE.Vector3(w / 2 - round, h / 2 - round, d / 2 - round);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = new THREE.Vector3(THREE.MathUtils.clamp(v.x, -inner.x, inner.x), THREE.MathUtils.clamp(v.y, -inner.y, inner.y), THREE.MathUtils.clamp(v.z, -inner.z, inner.z));
    const dlt = v.clone().sub(c); if (dlt.length() > 0) v.copy(c.add(dlt.normalize().multiplyScalar(round)));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function wheels(grp, w, l, r = .34) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .26, 20), tyreMat);
    t.rotation.z = Math.PI / 2; t.position.set(sx * (w / 2 - .12), r, sz * l * .33); t.castShadow = true; grp.add(t);
  }
}
function simpleCar(color, x, z, s = 1) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: .35, clearcoat: .8 });
  const b = new THREE.Mesh(softBox(1.85, .7, 4.4, 4, .15), paint); b.position.y = .62; g.add(b);
  const c = new THREE.Mesh(softBox(1.6, .55, 2.1, 4, .15), glassMat); c.position.set(0, 1.18, .1); g.add(c);
  wheels(g, 1.85, 4.4); g.traverse(m => m.castShadow = true);
  g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
}
simpleCar(0xe9edf1, 4.6, -62); simpleCar(0x2c3e66, 0.2, -95); simpleCar(0x8a9098, 7.3, -140);
simpleCar(0xc9302c, 3.9, -190); simpleCar(0xf2f2f2, -0.4, -240); simpleCar(0x30343a, 5.8, -300);
simpleCar(0xdddddd, -11.5, -160); simpleCar(0x5a6b7a, -15.5, -230);

// auto rossa tamponata
{
  const car = new THREE.Group();
  const red = new THREE.MeshPhysicalMaterial({ color: 0xd8141f, roughness: .32, clearcoat: 1, clearcoatRoughness: .08, vertexColors: true });
  // carrozzeria: retro verso la camera (+z). Ammaccatura sul lato posteriore destro
  const bodyG = softBox(1.95, .78, 4.7, 24, .2);
  const p = bodyG.attributes.position, cols = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // ammaccatura centrata su (x=.55, y=-.05, z=+2.35)
    const dx = (v.x - .55) / .55, dy = (v.y + .05) / .45, dz = (v.z - 2.35) / .9;
    const f = Math.exp(-(dx * dx + dy * dy + dz * dz) * 1.6);
    const crease = .5 + .5 * Math.sin(v.x * 9 + v.y * 6);
    v.z -= f * (.26 + .05 * crease); v.x -= f * .06; v.y -= f * .05 * crease;
    p.setXYZ(i, v.x, v.y, v.z);
    const k = 1 - f * (.25 + .2 * crease); cols.set([k, k * (1 - f * .1), k * (1 - f * .1)], i * 3);
  }
  bodyG.setAttribute('color', new THREE.BufferAttribute(cols, 3)); bodyG.computeVertexNormals();
  const body = new THREE.Mesh(bodyG, red); body.position.y = .66; car.add(body);
  // abitacolo con lunotto scuro
  const cabG = softBox(1.66, .6, 2.3, 10, .22), cp = cabG.attributes.position;
  for (let i = 0; i < cp.count; i++) { const y = cp.getY(i); if (y > 0) { cp.setX(i, cp.getX(i) * .84); cp.setZ(i, cp.getZ(i) * .62 - .15); } }
  cabG.computeVertexNormals();
  const cab = new THREE.Mesh(cabG, red); cab.position.set(0, 1.3, -.15); car.add(cab);
  const glass = new THREE.Mesh(cabG, glassMat); glass.scale.set(.8, .82, 1.04); glass.position.set(0, 1.26, -.15); car.add(glass);
    // barra luci posteriore
  const lightMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 1.6, roughness: .3 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7, .07, .05), lightMat); bar.position.set(-.12, .9, 2.37); car.add(bar);
  const barDk = new THREE.Mesh(new THREE.BoxGeometry(1.86, .16, .04), new THREE.MeshStandardMaterial({ color: 0x150406, roughness: .2, metalness: .3 }));
  barDk.position.set(0, .9, 2.355); car.add(barDk);
  // fanale destro rotto (spento e inclinato)
  const broken = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .05), new THREE.MeshStandardMaterial({ color: 0x3a0c0c, roughness: .6 }));
  broken.position.set(.68, .86, 2.2); broken.rotation.set(.1, .35, -.12); car.add(broken);
  // paraurti nero, deformato
  const bump = new THREE.Mesh(softBox(1.9, .1, .2, 6, .04), new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: .7 }));
  bump.position.set(-.1, .3, 2.28); bump.rotation.y = .06; car.add(bump);
  // targa
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.52, .13), new THREE.MeshStandardMaterial({
    roughness: .5, map: canvas(512, 128, (g, w, h) => {
      g.fillStyle = '#f2f2ee'; rr(g, 0, 0, w, h, 12); g.fill();
      g.fillStyle = '#1f3c9c'; g.fillRect(0, 0, 50, h); g.fillRect(w - 50, 0, 50, h);
      g.fillStyle = '#111'; g.font = '800 92px Inter'; g.textAlign = 'center'; g.fillText('AHIA 22', w / 2, 98);
    })
  }));
  plate.position.set(-.18, .58, 2.37); plate.rotation.z = -.03; car.add(plate);
  wheels(car, 1.95, 4.7, .36);
  car.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  // ombra di contatto
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.4), new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, map: canvas(128, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .62);
      gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.setTransform(1, 0, 0, 2, 0, -h / 2); g.fillStyle = gr; g.fillRect(0, 0, w, h * 2);
    })
  }));
  ao.rotation.x = -Math.PI / 2; ao.position.y = .01; car.add(ao);
  car.position.set(0.55, 0, -12.5); car.rotation.y = -.035;
  scene.add(car);
}

// ---------- personaggio 2D (cartoncino disegnato) ----------
const charTex = canvas(512, 1024, (g, w, h) => {
  const ink = '#151515'; g.lineCap = g.lineJoin = 'round';
  // gambe
  g.strokeStyle = ink; g.lineWidth = 26;
  g.beginPath(); g.moveTo(222, 720); g.lineTo(210, 950); g.moveTo(292, 720); g.lineTo(305, 950); g.stroke();
  g.strokeStyle = '#5a4b3d'; g.lineWidth = 14;
  g.beginPath(); g.moveTo(222, 720); g.lineTo(210, 950); g.moveTo(292, 720); g.lineTo(305, 950); g.stroke();
  // scarpe
  g.fillStyle = '#2a2420'; g.strokeStyle = ink; g.lineWidth = 7;
  for (const [x, d] of [[208, -1], [307, 1]]) { g.beginPath(); g.ellipse(x + d * 14, 965, 34, 17, 0, 0, 7); g.fill(); g.stroke(); }
  // braccia (cadenti, spaesato)
  g.strokeStyle = ink; g.lineWidth = 22;
  g.beginPath(); g.moveTo(178, 500); g.quadraticCurveTo(140, 600, 150, 690); g.moveTo(334, 500); g.quadraticCurveTo(372, 600, 360, 690); g.stroke();
  g.strokeStyle = '#efc928'; g.lineWidth = 10; g.stroke();
  g.fillStyle = '#f4e6d4'; g.lineWidth = 7; g.strokeStyle = ink;
  for (const x of [150, 360]) { g.beginPath(); g.arc(x, 700, 19, 0, 7); g.fill(); g.stroke(); }
  // tunica gialla
  g.fillStyle = '#f2c62a'; g.strokeStyle = ink; g.lineWidth = 9;
  g.beginPath(); g.moveTo(190, 470); g.quadraticCurveTo(256, 450, 322, 470);
  g.quadraticCurveTo(340, 600, 336, 740); g.quadraticCurveTo(256, 756, 176, 740);
  g.quadraticCurveTo(172, 600, 190, 470); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(120,85,0,.5)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(256, 500); g.lineTo(256, 600); g.stroke();
  g.fillStyle = ink; for (const y of [530, 575]) { g.beginPath(); g.arc(256, y, 5, 0, 7); g.fill(); }
  // collare cervicale (colpo di frusta)
  g.fillStyle = '#f5f1e6'; g.strokeStyle = ink; g.lineWidth = 8;
  rr(g, 196, 410, 120, 66, 22); g.fill(); g.stroke();
  g.strokeStyle = '#c9c1ad'; g.lineWidth = 4; g.beginPath(); g.moveTo(210, 443); g.lineTo(302, 443); g.stroke();
  // testa
  g.fillStyle = '#f7f1e8'; g.strokeStyle = ink; g.lineWidth = 11;
  g.beginPath(); g.ellipse(256, 270, 150, 145, 0, 0, 7); g.fill(); g.stroke();
  // capelli spettinati
  g.fillStyle = '#5b3a22'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(140, 220);
  const tips = [[160, 150], [195, 175], [215, 118], [250, 160], [282, 112], [305, 165], [345, 135], [355, 205], [372, 230]];
  for (const [x, y] of tips) g.lineTo(x, y);
  g.quadraticCurveTo(256, 190, 140, 220); g.closePath(); g.fill(); g.stroke();
  // occhi
  for (const [x, d] of [[205, -1], [305, 1]]) {
    g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = 8;
    g.beginPath(); g.ellipse(x, 275, 36, 40, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(x + d * 4, 282, 11, 0, 7); g.fill();
    g.lineWidth = 9; g.beginPath(); g.moveTo(x - 32, 220 - d * 2 + (d < 0 ? 10 : -6)); g.lineTo(x + 32, 220 + (d < 0 ? -6 : 10)); g.stroke(); // sopracciglia preoccupate
  }
  // bocca
  g.lineWidth = 8; g.beginPath(); g.moveTo(232, 352); g.quadraticCurveTo(256, 342, 282, 354); g.stroke();
});
{
  const mat = new THREE.MeshBasicMaterial({ map: charTex, alphaTest: .5, side: THREE.DoubleSide, toneMapped: false, color: 0xf0f0f0 });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(.97, 1.94), mat);
  card.position.set(-1.55, .97, -11.4);
  card.castShadow = true;
  card.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: charTex, alphaTest: .5 });
  card.lookAt(0, .95, 0);
  scene.add(card);
}

// ---------- camera e abitacolo ----------
const FOV = 62, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), ASP = W / H;
const camera = new THREE.PerspectiveCamera(FOV, ASP, .05, 3000);
camera.position.set(0, 1.3, 0); camera.rotation.x = -.235; scene.add(camera);
// posizione nello spazio camera da frazioni di schermo (sx: 0 sinistra→1 destra, sy: 0 alto→1 basso)
const cs = (sx, sy, d) => new THREE.Vector3((2 * sx - 1) * d * TAN * ASP, (1 - 2 * sy) * d * TAN, -d);
const cam = (obj, sx, sy, d) => { obj.position.copy(cs(sx, sy, d)); camera.add(obj); return obj; };
const sizeAt = (fracW, d) => fracW * 2 * d * TAN * ASP; // larghezza in metri di una frazione di schermo

// cofano bianco (nel mondo, illuminato davvero)
{
  const g = new THREE.PlaneGeometry(2.6, 1.25, 40, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i); // y = lungo il cofano (+ verso la punta)
    const bulge = .07 * Math.cos(x * 1.1) + .02 * Math.max(0, 1 - Math.abs(Math.abs(x) - .6) / .08);
    p.setZ(i, bulge - .02 * (y + .62) * (y + .62));
  }
  g.computeVertexNormals();
  const hood = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: 0xc9ced6, roughness: .4, clearcoat: .6, clearcoatRoughness: .2 }));
  hood.rotation.x = -Math.PI / 2 - .02; hood.material.side = THREE.DoubleSide; hood.position.set(0, .92, -1.85); hood.receiveShadow = true; scene.add(hood);
}

// cruscotto: pannelli dipinti nello spazio camera
const dashTex = canvas(1080, 1100, (g, w, h) => {
  let gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#c9cfd6'); gr.addColorStop(.035, '#8d96a3'); gr.addColorStop(.06, '#3b4250'); gr.addColorStop(.25, '#2b313d'); gr.addColorStop(1, '#161a22');
  g.fillStyle = gr; rr(g, -40, 20, w + 80, h, 160); g.fill();
  // riflesso del cielo sul piano del cruscotto
  gr = g.createLinearGradient(0, 20, 0, 70); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 20, w, 50);
  // bocchette con LED blu
  const vent = (x, y, ww, hh) => {
    g.fillStyle = '#10131a'; rr(g, x, y, ww, hh, 24); g.fill();
    g.strokeStyle = '#2d3443'; g.lineWidth = 4; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + 10, y + i * hh / 5); g.lineTo(x + ww - 10, y + i * hh / 5); g.stroke(); }
    g.fillStyle = '#2f7cff'; g.fillRect(x - 10, y - 14, ww + 20, 6);
  };
  vent(-30, 200, 160, 60); vent(830, 200, 290, 60);
  // pannello clima
  g.fillStyle = '#1b1f28'; rr(g, 800, 290, 320, 150, 30); g.fill();
  g.fillStyle = '#8b94a6'; g.font = '600 20px Inter'; ['A/C', 'MAX', 'AUTO', 'REAR'].forEach((t, i) => g.fillText(t, 825 + i * 70, 325));
  g.fillStyle = '#d0d6e0'; g.font = '700 28px Inter'; g.fillText('22°', 825, 420);
  // console sotto il volante
  g.fillStyle = '#1e2430'; rr(g, 300, 860, 260, 120, 30); g.fill();
});
{
  const d = 1.0, pl = new THREE.Mesh(new THREE.PlaneGeometry(sizeAt(1.08, d), sizeAt(1.08, d) * 1100 / 1080), new THREE.MeshBasicMaterial({ map: dashTex, transparent: true, fog: false }));
  cam(pl, .5, .5 + (1100 / 1080) * (1.08 * ASP) / 2 * 1, d); // centrato in modo che il bordo alto stia a sy≈0.5
  pl.position.y = cs(.5, .505, d).y - pl.geometry.parameters.height / 2;
}

// quadro strumenti
const gaugeTex = canvas(1100, 520, (g, w, h) => {
  g.fillStyle = '#20252f'; rr(g, 0, 0, w, h, 120); g.fill();
  g.fillStyle = '#0b0f17'; rr(g, 30, 40, w - 60, h - 70, 100); g.fill();
  const gauge = (cx, cy, r, max, step, label, val) => {
    const gr = g.createRadialGradient(cx, cy, r * .2, cx, cy, r);
    gr.addColorStop(0, '#16233d'); gr.addColorStop(1, '#0a0f1a'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = '#3aa0ff'; g.lineWidth = 9; g.shadowColor = '#3aa0ff'; g.shadowBlur = 25; g.beginPath(); g.arc(cx, cy, r - 4, 0, 7); g.stroke(); g.shadowBlur = 0;
    const a0 = Math.PI * .75, a1 = Math.PI * 2.25;
    for (let v = 0; v <= max; v += step / 2) {
      const a = a0 + (a1 - a0) * v / max, big = v % step === 0;
      g.strokeStyle = big ? '#fff' : '#9fb3cc'; g.lineWidth = big ? 6 : 3;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18)); g.lineTo(cx + Math.cos(a) * (r - (big ? 46 : 34)), cy + Math.sin(a) * (r - (big ? 46 : 34))); g.stroke();
      if (big) { g.fillStyle = '#fff'; g.font = '700 30px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label(v), cx + Math.cos(a) * (r - 76), cy + Math.sin(a) * (r - 76)); }
    }
    const a = a0 + (a1 - a0) * val / max;
    g.strokeStyle = '#ff8a1c'; g.lineWidth = 9; g.shadowColor = '#ff6a00'; g.shadowBlur = 18;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * 20, cy - Math.sin(a) * 20); g.lineTo(cx + Math.cos(a) * (r - 30), cy + Math.sin(a) * (r - 30)); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#2b3240'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill();
  };
  gauge(230, 260, 200, 8, 1, v => v, 1.1);                 // contagiri
  gauge(870, 260, 200, 240, 40, v => v, 22);               // km/h
  g.fillStyle = '#9fb3cc'; g.font = '600 22px Inter'; g.textAlign = 'center'; g.fillText('x1000 rpm', 230, 340); g.fillText('km/h', 870, 340);
  // display centrale
  g.fillStyle = '#05070b'; rr(g, 445, 90, 210, 330, 20); g.fill();
  g.fillStyle = '#ccd6e6'; g.font = '700 34px Inter'; g.fillText('P  R  N  D', 550, 140);
  g.fillStyle = '#ffffff'; g.fillRect(560, 160, 26, 4);
  g.fillStyle = '#c4141c'; g.shadowColor = '#ff2020'; g.shadowBlur = 20; rr(g, 460, 190, 180, 120, 10); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#ffd7d7'; g.font = '800 18px Inter'; g.fillText('CONTROLLA', 550, 270); g.fillText('AIRBAG', 550, 292);
  g.font = '800 46px Inter'; g.fillStyle = '#fff'; g.fillText('!', 550, 235);
  g.fillStyle = '#ccd6e6'; g.font = '600 22px Inter'; g.fillText('24°C', 490, 370); g.fillText('77.912 km', 600, 370);
  // spie
  g.fillStyle = '#ffb000'; g.beginPath(); g.arc(380, 470, 11, 0, 7); g.fill();
  g.fillStyle = '#ff2a2a'; g.font = '800 30px Inter'; g.fillText('⚠', 520, 70); g.fillText('⚠', 580, 70);
  g.fillStyle = '#6e7a8c'; for (const x of [440, 500, 560, 620]) { rr(g, x, 458, 26, 24, 5); g.fill(); }
});
{
  const d = .9, wdt = sizeAt(.56, d);
  const cl = new THREE.Mesh(new THREE.PlaneGeometry(wdt, wdt * 520 / 1100), new THREE.MeshBasicMaterial({ map: gaugeTex, transparent: true, fog: false, toneMapped: false, color: 0xbcbcbc }));
  cam(cl, .43, .585, d);
}
// schermo infotainment
const radioTex = canvas(560, 340, (g, w, h) => {
  g.fillStyle = '#1b2029'; rr(g, 0, 0, w, h, 26); g.fill();
  g.fillStyle = '#0a1426'; rr(g, 16, 16, w - 32, h - 32, 16); g.fill();
  g.fillStyle = '#cfd8e6'; g.font = '700 28px Inter'; g.fillText('FM 101.3', 210, 60);
  const gr = g.createLinearGradient(40, 90, 180, 230); gr.addColorStop(0, '#46b8ff'); gr.addColorStop(1, '#2d6fe0');
  g.fillStyle = gr; rr(g, 40, 90, 140, 140, 10); g.fill();
  g.fillStyle = '#fff'; g.font = '800 34px Inter'; g.fillText('In viaggio', 205, 140);
  g.fillStyle = '#9fb3cc'; g.font = '600 22px Inter'; g.fillText('Radio Strada 101.3', 205, 178);
  g.fillStyle = '#3a4a66'; g.fillRect(205, 205, 300, 6); g.fillStyle = '#46b8ff'; g.fillRect(205, 205, 120, 6);
  g.fillStyle = '#9fb3cc'; g.font = '700 18px Inter'; ['HOME', 'AUDIO', 'MAPPA', 'TEL'].forEach((t, i) => g.fillText(t, 40 + i * 125, 295));
});
{
  const d = .85, wdt = sizeAt(.27, d);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(wdt, wdt * 340 / 560), new THREE.MeshBasicMaterial({ map: radioTex, fog: false, toneMapped: false, color: 0xb8b8b8 }));
  cam(sc, .88, .5, d);
}
// manopole clima (3D)
{
  const kmat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: .6, roughness: .35 });
  [.8, .89, .98].forEach(sx => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.011, .012, .02, 24), kmat);
    k.rotation.x = Math.PI / 2 - .5; cam(k, sx, .715, .8);
  });
}
// volante (3D, luce vera)
{
  const leather = new THREE.MeshStandardMaterial({ color: 0x1e2128, roughness: .55, metalness: .1 });
  const wheel = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.172, .022, 20, 80), leather); wheel.add(ring);
  const stitch = new THREE.Mesh(new THREE.TorusGeometry(.172, .0225, 4, 80, Math.PI * .5), new THREE.MeshStandardMaterial({ color: 0x8b93a3, roughness: .6, wireframe: true }));
  stitch.rotation.z = Math.PI * .25; wheel.add(stitch);
  const hub = new THREE.Mesh(softBox(.09, .075, .04, 4, .02), new THREE.MeshStandardMaterial({ color: 0x3a3f48, roughness: .4, metalness: .3 })); hub.position.z = .02; wheel.add(hub);
  for (const s of [-1, 1]) { const sp = new THREE.Mesh(softBox(.13, .035, .02, 2, .01), leather); sp.position.set(s * .105, -.01, 0); wheel.add(sp); }
  const low = new THREE.Mesh(softBox(.04, .12, .02, 2, .01), leather); low.position.set(0, -.105, 0); wheel.add(low);
  wheel.rotation.x = .42; cam(wheel, .43, .85, .8);
}
// tetto/montante superiore scuro
{
  const d = 1, top = new THREE.Mesh(new THREE.PlaneGeometry(sizeAt(1.1, d), .3), new THREE.MeshBasicMaterial({ color: 0x2a2c31, fog: false }));
  cam(top, .5, 0, d); top.position.y = cs(.5, .012, d).y + .15;
}
// crepa sul parabrezza
const crackTex = canvas(512, 512, (g, w, h) => {
  const cx = w / 2, cy = h / 2; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    let a = i / 16 * 6.283 + R(-.15, .15), r = 6, x = cx, y = cy; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y);
    const L = R(120, 245);
    while (r < L) { r += R(12, 28); a += R(-.2, .2); x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r; g.lineTo(x, y); }
    g.stroke();
  }
  for (const rad of [22, 48, 85]) {
    g.lineWidth = 1.8; g.beginPath();
    for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.283, q = rad * R(.85, 1.15); i ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
    g.stroke();
  }
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 30); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill();
});
{
  const d = 1.1, s = sizeAt(.3, d);
  const cr = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: .85 }));
  cam(cr, .74, .265, d);
}

// ---------- post e render ----------
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .35, .5, .92));
composer.addPass(new OutputPass());
document.fonts.ready.then(() => { composer.render(); window.DONE = true; });

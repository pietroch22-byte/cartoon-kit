// Realistic look tuned on «Ho già mangiato» (see references/luce-colore.md):
// ACES + exposure per preset, HDR sky from the script's time of day, selective bloom, final grade,
// hue-preserving highlight compression, NO screen-space AO (it leaves halos).
import * as THREE from 'three';
import { RGBELoader } from '../lib/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from '../lib/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from '../lib/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from '../lib/jsm/postprocessing/ShaderPass.js';
import { scene, renderer, camera, sky, L as RIG, W, H } from './engine.js';

// light presets: reference light rig + sky + grade (names used in the story JSON)
const BASE = {
  interno: { sky: '#ffe2c0', ground: '#8a5a3a', hemi: 1.3, sun: '#ffc890', sunI: 1.6, sunDir: [-0.4, 1, 0.9], ambI: 0.35, fog: '#f3d98c', fogN: 20, fogF: 90, top: '#ffd0a0', bot: '#ffd0a0', lamp: 1.5 },
  interno_notte: { sky: '#e8d8c8', ground: '#6a4a3a', hemi: 1.15, sun: '#ffd0a0', sunI: 1.1, sunDir: [0.5, 1, 0.9], ambI: 0.3, fog: '#c0a890', fogN: 20, fogF: 90, top: '#ffe0b0', bot: '#ffe0b0', lamp: 4 },
  giorno: { sky: '#bfe0ff', ground: '#7a7060', hemi: 0.7, sun: '#fff1d8', sunI: 3.0, sunDir: [0.7, 1, 0.5], ambI: 0.15, fog: '#d8e8f5', fogN: 80, fogF: 400, top: '#9fd0ff', bot: '#e8f2ff', lamp: 0 },
  tramonto: { sky: '#ffb37a', ground: '#6a4a5a', hemi: 0.45, sun: '#ff9a4a', sunI: 0.8, sunDir: [-1, 0.55, 0.6], ambI: 0.3, fog: '#ffb890', fogN: 60, fogF: 300, top: '#5a6ac8', bot: '#ffb070', lamp: 0 },
  notte: { sky: '#6a7ac8', ground: '#2a2440', hemi: 0.95, sun: '#9ab0ff', sunI: 0.9, sunDir: [0.5, 1, 0.7], ambI: 0.25, fog: '#1a1e40', fogN: 25, fogF: 110, top: '#070c2a', bot: '#2a2a62', stars: 1, lamp: 6 },
};
export const LOOK = {
  interno: { base: 'interno', hdri: 'kiara_interior', exp: 1.1, sat: 1.3, con: 1.06, tint: [1.03, 1.0, 0.95], card: 0.82 },
  interno_notte: { base: 'interno_notte', hdri: 'kiara_interior', exp: 0.85, sat: 1.22, con: 1.03, tint: [0.97, 0.98, 1.05], card: 0.92 },
  giorno: { base: 'giorno', hdri: 'kloofendal_48d_partly_cloudy_puresky', bg: true, exp: 1.05, sat: 1.22, con: 1.04, tint: [1, 1, 1], card: 1.0 },
  tramonto: { base: 'tramonto', hdri: 'belfast_sunset_puresky', bg: true, exp: 0.34, sat: 1.22, con: 1.04, tint: [1.04, 0.99, 0.94], card: 1.0 },
  notte: { base: 'notte', hdri: 'moonlit_golf', bg: true, exp: 0.95, sat: 1.2, con: 0.98, tint: [0.95, 0.98, 1.06], card: 1.0 },
};
export const lightRig = name => BASE[(LOOK[name] || LOOK.interno).base];

const Grade = { uniforms: { tDiffuse: { value: null }, sat: { value: 1.3 }, con: { value: 1.06 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, con; uniform vec3 tint; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 g = mix(vec3(l), c.rgb, sat); g = (g - 0.5) * con + 0.5; g *= tint;
      float m = max(max(g.r, g.g), g.b); if (m > 0.97) g *= 0.97 / m;   // keep hue and saturation, never grey it out
      gl_FragColor = vec4(clamp(max(g, vec3(0.025)), 0.0, 1.0), c.a); }` };

let composer, grade; const ENV = {}, BG = {};

// ---------- rendering a passaggi (qualità "alla Blender", references/migliora-frame.md) ----------
// ?passaggi=N (render.mjs lo aggiunge da PASSAGGI): ogni fotogramma è la media di N render con il sole spostato
// in un disco di ~1,5° (penombre), una luce di cielo CON OMBRE da una direzione casuale della volta che prende
// il posto di gran parte della luce ambiente (occlusione e ombre di contatto vere, senza gli aloni dell'AO
// in screen-space) e la camera spostata di frazioni di pixel (bordi puliti). 0 o 1 = render normale.
const QS = new URLSearchParams(location.search), PASSES = +(QS.get('passaggi') || 0);
// test di controllo: ?passaggi=1&cielo=0 deve dare gli stessi pixel del render normale (entro 1-2 livelli)
const SKY_SHARE = QS.has('cielo') ? +QS.get('cielo') : 0.8, SKY_GAIN = 2.0;   // quota di luce ambiente spostata nel cielo con ombre; guadagno tarato col test di controllo
const skyL = new THREE.DirectionalLight(0xffffff, 0);
if (PASSES >= 1) {
  skyL.castShadow = true; skyL.shadow.mapSize.set(2048, 2048);
  Object.assign(skyL.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 80 });
  skyL.shadow.bias = -0.0006; skyL.shadow.normalBias = 0.03; scene.add(skyL, skyL.target);
}
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
let accBuf, accPx, outTex, outScene, outCam;
function renderProgressive(n) {
  const gl = renderer.getContext();
  if (!accBuf) {
    accBuf = new Float32Array(W * H * 3); accPx = new Uint8Array(W * H * 4);
    outTex = new THREE.DataTexture(new Uint8Array(W * H * 4), W, H); outTex.colorSpace = THREE.SRGBColorSpace;
    outScene = new THREE.Scene(); outCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: outTex, toneMapped: false, depthTest: false })));
  }
  accBuf.fill(0);
  const sun = RIG.sun, tgt = sun.target.position.clone(), base = sun.position.clone().sub(tgt);
  const hemiI = RIG.hemi.intensity, ambI = RIG.amb.intensity, up = new THREE.Vector3(0, 1, 0);
  RIG.hemi.intensity = hemiI * (1 - SKY_SHARE); RIG.amb.intensity = ambI * (1 - SKY_SHARE);
  skyL.color.copy(RIG.hemi.color); skyL.intensity = SKY_GAIN * SKY_SHARE * (hemiI + ambI);   // la luce tolta all'ambiente torna dal cielo, ma con le ombre
  skyL.target.position.copy(tgt);
  const side = new THREE.Vector3().crossVectors(base, up).normalize(), up2 = new THREE.Vector3().crossVectors(side, base).normalize();
  for (let i = 0; i < n; i++) {
    const a = halton(i + 1, 2), b = halton(i + 1, 3), c = halton(i + 1, 5);
    const j = n > 1 ? 1 : 0;   // con 1 solo passaggio niente variazioni (test di controllo)
    const r = j * Math.sqrt(a) * 0.026, th = b * 6.283;
    sun.position.copy(tgt).add(base.clone().normalize().addScaledVector(side, Math.cos(th) * r).addScaledVector(up2, Math.sin(th) * r).normalize().multiplyScalar(base.length()));
    const ct = Math.sqrt(1 - a), st = Math.sqrt(1 - ct * ct), ph = c * 6.283;
    skyL.position.set(Math.cos(ph) * st, ct, Math.sin(ph) * st).multiplyScalar(30).add(tgt);
    camera.setViewOffset(W, H, j * (a - 0.5), j * (b - 0.5), W, H);
    composer.render();
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, accPx);   // la media si fa sui pixel finali (verificato: un buffer float intermedio sbagliava i colori)
    for (let p = 0, q = 0; p < accPx.length; p += 4, q += 3) { accBuf[q] += accPx[p]; accBuf[q + 1] += accPx[p + 1]; accBuf[q + 2] += accPx[p + 2]; }
  }
  camera.clearViewOffset(); sun.position.copy(tgt).add(base);
  RIG.hemi.intensity = hemiI; RIG.amb.intensity = ambI; skyL.intensity = 0;
  const o = outTex.image.data;
  for (let p = 0, q = 0; p < o.length; p += 4, q += 3) { o[p] = accBuf[q] / n; o[p + 1] = accBuf[q + 1] / n; o[p + 2] = accBuf[q + 2] / n; o[p + 3] = 255; }
  outTex.needsUpdate = true; renderer.render(outScene, outCam);
}
const tl = new THREE.TextureLoader();
export async function initLook(KIT, presets) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const pm = new THREE.PMREMGenerator(renderer), rl = new RGBELoader();
  for (const p of presets) {
    const L = LOOK[p] || LOOK.interno; if (ENV[L.hdri]) continue;
    const h = await rl.loadAsync(`${KIT}/hdri/${L.hdri}.hdr`).catch(() => null);
    if (!h) { console.error('hdri missing ' + L.hdri); continue; }
    ENV[L.hdri] = pm.fromEquirectangular(h).texture; h.mapping = THREE.EquirectangularReflectionMapping; BG[L.hdri] = h;
  }
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1080, 1920), 0.45, 0.35, 1.6)); // only real light sources exceed 1.15
  composer.addPass(new OutputPass());
  grade = new ShaderPass(Grade); composer.addPass(grade);
}
export function renderLook(name, cards) {
  const L = LOOK[name] || LOOK.interno;
  scene.environment = ENV[L.hdri] || null;
  scene.background = L.bg ? BG[L.hdri] || null : null;
  sky.visible = !(L.bg && BG[L.hdri]);
  renderer.toneMappingExposure = L.exp;
  grade.uniforms.sat.value = L.sat; grade.uniforms.con.value = L.con; grade.uniforms.tint.value.set(...L.tint);
  for (const c of cards) c.material.color.setScalar(L.card); // cards are unlit: keep characters steady whatever the room exposure
  if (PASSES >= 1) renderProgressive(PASSES); else composer.render();
}

// PBR material from the kit: {tex, tint, rep:[x,y]} or plain {color, rough}
const texCache = {};
function tx(url, srgb, rep) {
  const k = url + rep; if (texCache[k]) return texCache[k];
  const t = tl.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(...rep);
  return (texCache[k] = t);
}
export function mat(KIT, s = {}) {
  if (typeof s === 'string') s = s.startsWith('#') ? { color: s } : { tex: s };
  if (s.tex) {
    const rep = s.rep ? (Array.isArray(s.rep) ? s.rep : [s.rep, s.rep]) : [2, 2], b = `${KIT}/texture/${s.tex}/${s.tex}`;
    const a = tx(`${b}_arm.jpg`, false, rep);
    return new THREE.MeshStandardMaterial({ map: tx(`${b}_diff.jpg`, true, rep), normalMap: tx(`${b}_nor.jpg`, false, rep), roughnessMap: a, aoMap: a, roughness: 1, metalness: 0, color: new THREE.Color(s.tint || '#ffffff'), envMapIntensity: s.env ?? 0.85 });
  }
  return new THREE.MeshStandardMaterial({ color: s.color || '#cccccc', roughness: s.rough ?? 0.8, metalness: s.metal ?? 0, envMapIntensity: 0.8 });
}
// light-emitting surfaces: unlit colour above the bloom threshold (lit + emissive saturates to flat white)
export const glow = (color, k = 3.6) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });

const gl = new GLTFLoader(), modelCache = {};
export async function loadModel(url) {
  if (!modelCache[url]) modelCache[url] = gl.loadAsync(url).catch(() => { console.error('model missing ' + url); return null; });
  const g = await modelCache[url]; return g ? g.scene.clone(true) : null;
}

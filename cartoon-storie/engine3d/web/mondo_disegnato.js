// Costruttori del mondo per il look «disegnato». Ogni funzione è la versione a parametri di un pezzo della scena approvata
// (references/look-disegnato/scena_disegnato.js, step 18): stessi colori, misure e materiali. Regole: references/look-disegnato.md
// (§0a standard alto, §0b scala sui personaggi, §5b «luce = superficie, volume = ombreggiato», §8 ricchezza).
// Convenzione: la strada corre verso -z, la camera sta a z positivo; facciata destra a x = XR, sinistra a x = -XL. Misure in metri.
import { THREE, personalita } from '/web/look_disegnato.js';

export function creaMondo(D, O = {}) {
  const root = D.root, XR = O.xr ?? 7, XL = O.xl ?? 2.6;
  let rnd = O.seme || 7; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  let gr = 99; const G = () => (gr = (gr * 48271) % 2147483647) / 2147483647;   // grana delle texture (fissa: stesso mondo a ogni caricamento)
  const FX = (side, off = 0) => side > 0 ? XR - off : -(XL - off);   // x della facciata (off = quanto sporge verso la strada)
  const std = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const emi = (c, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: true });
  const add = o => { root.add(o); return o; };
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return add(o); };
  // oggetto luminoso con spessore: si accende solo la faccia che emette (0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z), i fianchi restano scuri
  const boxLuce = (w, h, d, col, k, x, y, z, faccia = 1) => { const side = std(new THREE.Color(col).multiplyScalar(0.35).getStyle(), 0.6), mats = [side, side, side, side, side, side]; mats[faccia] = emi(col, k);
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return add(o); };
  const tex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = Math.round(h); fn(c.getContext('2d'), w, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const luce = (c, i, x, y, z, d = 8) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); return add(l); };
  const dipinto = (t, e = 0.32, r = 0.9) => new THREE.MeshStandardMaterial({ map: t, roughness: r, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: e });   // look dipinto: la texture è anche emissiva

  // ---- Caricamento texture PBR reali (/kit/texture/<nome>/<nome>_{diff,nor,arm}.jpg) con attese tracciate
  const texLoader = new THREE.TextureLoader(), PBR_CACHE = new Map(), PENDING = [], tick = [];
  function loadSingleTex(url, srgb, mip = true) {
    return new Promise(res => {
      texLoader.load(url, t => {
        t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.generateMipmaps = mip;
        t.needsUpdate = true;
        res(t);
      }, undefined, () => res(null));
    });
  }
  function loadPbrSet(nome) {
    if (!PBR_CACHE.has(nome)) {
      const base = `/kit/texture/${nome}/${nome}`;
      PBR_CACHE.set(nome, Promise.all([
        loadSingleTex(`${base}_diff.jpg`, true),
        loadSingleTex(`${base}_nor.jpg`, false),
        loadSingleTex(`${base}_arm.jpg`, false),
      ]).then(([diff, nor, arm]) => ({ diff, nor, arm })));
    }
    return PBR_CACHE.get(nome);
  }
  function cloneTiled(src, rep, ani) {
    if (!src) return null;
    const t = src.clone();
    t.image = src.image;
    t.colorSpace = src.colorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
    t.anisotropy = ani;
    t.channel = 0;
    t.needsUpdate = true;
    return t;
  }
  const pbr = (nome, opt = {}) => {
    const rep = opt.ripeti || (opt.misure ? [Math.max(0.25, opt.misure[0] / (opt.scala || 2.0)), Math.max(0.25, opt.misure[1] / (opt.scala || 2.0))] : [1, 1]);
    const ani = opt.anisotropia ?? 8, ril = opt.rilievo ?? 0.35;
    const mat = new THREE.MeshStandardMaterial({
      color: opt.colore ?? '#ffffff',
      roughness: opt.ruvido ?? 0.92,
      metalness: opt.metallo ?? 0.10,
      aoMapIntensity: opt.ao ?? 0.65,
      normalScale: new THREE.Vector2(ril, ril),
      side: opt.doppio ? THREE.DoubleSide : THREE.FrontSide,
    });
    if (opt.env !== undefined) mat.userData.envExplicit = opt.env;
    if (!opt.rick) mat.userData.noRick = true;
    const pr = loadPbrSet(nome).then(({ diff, nor, arm }) => {
      if (diff) {
        mat.map = cloneTiled(diff, rep, ani);
        if (opt.emissiva > 0) {
          mat.emissive.set(opt.coloreEmissiva ?? '#ffffff');
          mat.emissiveMap = mat.map;
          mat.emissiveIntensity = opt.emissiva;
        }
      }
      if (nor && ril > 0) mat.normalMap = cloneTiled(nor, rep, Math.min(ani, 4));
      if (arm) {
        const tArm = cloneTiled(arm, rep, Math.min(ani, 4));
        mat.aoMap = tArm;
        mat.roughnessMap = tArm;
        mat.metalnessMap = tArm;
      }
      mat.needsUpdate = true;
      return mat;
    });
    PENDING.push(pr);
    return mat;
  };
  const attendi = () => PENDING.length ? Promise.all(PENDING.splice(0)) : Promise.resolve([]);

  // ---- Prato 3D istanziato (`M.erba`) + suolo PBR sotto: fili curvi a ciuffi, vento leggero in shader, zero outline neri
  const erba = (opt = {}) => {
    const g = new THREE.Group(); g.name = opt.nome || 'prato_3d';
    g.userData.suolo = true;
    const x = opt.x ?? 0, z = opt.z ?? 0, y = opt.y ?? 0, w = opt.w ?? 12, d = opt.d ?? 12;
    g.position.set(x, y, z);
    if (opt.terreno !== false) {
      const mTerr = pbr(opt.terreno || 'Grass005', {
        colore: opt.coloreTerreno || '#ffffff',
        misure: [w, d],
        scala: opt.scalaTerreno || 2.4,
        ruvido: 0.96,
        metallo: 0.0,
        rilievo: opt.rilievoTerreno ?? 0.28,
        ao: 0.7,
        env: 0.25,
        emissiva: opt.emissivaTerreno ?? 0.08,
      });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mTerr);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.004;
      ground.receiveShadow = true;
      ground.userData.suolo = true;
      ground.userData.noRick = true;
      g.add(ground);
    }
    // Geometria ciuffo 3D composito (4 fili arcuati sfasati in un solo draw-call istanziato)
    const segs = 3, bw = opt.larghezza ?? 0.044;
    const pos = [], nrm = [], cols = [], uvs = [], idx = [];
    const cRoot = new THREE.Color(opt.base || '#3b6b22'), cTip = new THREE.Color(opt.punta || '#95dc58'), cTmp = new THREE.Color();
    const fili = opt.lamePerCiuffo === 1
      ? [[0, 0, 0, 1.0, 0.24]]
      : [
          [-0.032, -0.015, -0.45, 0.92, 0.26],
          [0.034, -0.010, 0.55, 1.05, 0.24],
          [-0.008, 0.032, 2.05, 0.84, 0.28],
          [0.012, -0.030, -1.85, 0.96, 0.22],
        ];
    for (const [ox, oz, yaw, hMul, bendK] of fili) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const baseV = pos.length / 3;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, half = (bw * 0.5) * (1 - 0.86 * Math.pow(t, 1.3));
        const yb = t * hMul, zz = Math.pow(t, 1.8) * bendK;
        cTmp.copy(cRoot).lerp(cTip, Math.pow(t, 0.82));
        for (const sgn of [-1, 1]) {
          const lx = sgn * half, lz = zz;
          const wx = ox + lx * cy + lz * sy;
          const wz = oz - lx * sy + lz * cy;
          pos.push(wx, yb, wz);
          nrm.push((sgn * 0.08) * cy + 0.35 * sy, 0.92, -(sgn * 0.08) * sy + 0.35 * cy);
          cols.push(cTmp.r, cTmp.g, cTmp.b);
          uvs.push(sgn < 0 ? 0 : 1, t);
        }
        if (i < segs) { const k = baseV + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);

    const uTempo = { value: 0 }, vento = opt.vento ?? 0.045, freq = opt.freq ?? 1.45;
    const mat = new THREE.MeshStandardMaterial({
      color: opt.colore || '#ffffff',
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.0,
      emissive: new THREE.Color(opt.base || '#29481a'),
      emissiveIntensity: 0.36,
      side: THREE.DoubleSide,
    });
    mat.userData.noRick = true;
    mat.userData.envExplicit = 0.28;
    mat.userData.obcKey = 'erbaWind1';
    mat.onBeforeCompile = sh => {
      sh.uniforms.uErbaTempo = uTempo;
      sh.uniforms.uErbaVento = { value: vento };
      sh.uniforms.uErbaFreq = { value: freq };
      sh.vertexShader = 'uniform float uErbaTempo, uErbaVento, uErbaFreq;\n' +
        sh.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec3 instPos = vec3(0.0);
           #ifdef USE_INSTANCING
             instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           #endif
           float ph = instPos.x * 0.65 + instPos.z * 0.48 + uErbaTempo * uErbaFreq;
           float bend = (sin(ph) * 0.65 + sin(ph * 2.1 + 1.1) * 0.35) * uErbaVento * uv.y * uv.y;
           transformed.x += bend;
           transformed.z += bend * 0.45;`
        );
    };

    const area = w * d, maxC = opt.maxCiuffi ?? opt.maxFili ?? 9000;
    const targetN = Math.min(maxC, Math.max(120, Math.round(area * (opt.densita ?? 32))));
    let seed = ((opt.seme ?? 17) * 9301 + 49297) % 233280;
    const rn = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const excl = opt.escludi || [];
    const escluso = (px, pz) => {
      const wx = x + px, wz = z + pz;
      for (const e of excl) {
        if (e.length === 3 && Math.hypot(wx - e[0], wz - e[1]) < e[2]) return true;
        if (e.length === 4 && wx >= e[0] && wx <= e[2] && wz >= e[1] && wz <= e[3]) return true;
      }
      return false;
    };
    const [hMin, hMax] = Array.isArray(opt.altezza) ? opt.altezza : [opt.altezza || 0.18, (opt.altezza || 0.18) * 1.55];
    const pts = [];
    for (let i = 0; i < targetN * 2 && pts.length < targetN; i++) {
      const bx = (rn() - 0.5) * (w - 0.12), bz = (rn() - 0.5) * (d - 0.12);
      if (escluso(bx, bz)) continue;
      pts.push([bx, bz, rn(), rn(), rn()]);
    }
    const inst = new THREE.InstancedMesh(geo, mat, pts.length);
    const dummy = new THREE.Object3D(), colVar = new THREE.Color();
    for (let i = 0; i < pts.length; i++) {
      const [bx, bz, r1, r2, r3] = pts[i];
      dummy.position.set(bx, 0, bz);
      dummy.rotation.set(0.05 + r1 * 0.12, r2 * Math.PI * 2, (r3 - 0.5) * 0.10);
      const sy = hMin + (hMax - hMin) * (0.25 + 0.75 * r1);
      dummy.scale.set(0.85 + r2 * 0.45, sy, 0.85 + r3 * 0.45);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      const shade = 0.84 + r3 * 0.30;
      colVar.setRGB(shade * (0.95 + r1 * 0.10), shade * (0.98 + r2 * 0.08), shade * 0.90);
      inst.setColorAt(i, colVar);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.receiveShadow = true;
    inst.castShadow = false;
    inst.userData.noInk = true;
    inst.userData.noRick = true;
    inst.userData.suolo = true;
    g.add(inst);
    if (vento > 0) tick.push(t => { uTempo.value = t; });
    return add(g);
  };

  const M = { THREE, root, R, FX, XR, XL, std, emi, box, boxLuce, tex, luce, dipinto, pbr, erba, attendi, tick, add, personalita };

  // ---- linea di mezzeria
  M.mezzeria = ({ z0 = 0, z1 = -110, x = 0 } = {}) => { for (let z = z0; z > z1; z -= 6) box(0.15, 0.02, 3, emi('#c8c8d0', 0.5), x, 0.01, z).userData.struttura = 1; };   // segni a terra: strutture (il controllo vita non li conta)

  // ---- fila di palazzi semplici grigio-blu con emissiva 0,3 (leggibili anche lontano dalle luci) e finestrelle accese
  M.filaPalazzi = ({ lato = 1, z0 = 0, z1 = -110, colori = ['#525a92', '#5c5a90', '#4a5688'], finestre = ['#ffd890', '#ffe8b0', '#a8c8ff'], emissiva = 0.3, hMin = 8, hVar = 18 } = {}) => {
    const winM = finestre.map(c => emi(c, 1.6));
    for (let z = z0; z > z1;) { const w = 5 + R() * 5, h = hMin + R() * hVar, d = 6, bc = colori[Math.floor(R() * colori.length)], bm = std(bc, 0.9); bm.emissive.set(bc); bm.emissiveIntensity = emissiva;
      box(d, h, w, bm, lato > 0 ? XR + d / 2 : -(XL + d / 2), h / 2, z - w / 2);
      for (let y = 3; y < h - 1; y += 2.2) for (let k = 0.8; k < w - 0.6; k += 1.4) if (R() < 0.45) box(0.05, 1.1, 0.8, winM[Math.floor(R() * winM.length)], FX(lato, 0.03), y, z - k);
      z -= w + 0.2; } };

  // ---- colonne al neon sui muri
  M.neon = ({ n = 14, colori = ['#ff3aa8', '#30d8ff', '#ff5ad0', '#ffb040', '#40a0ff'], z0 = -6, passo = 7 } = {}) => {
    for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, z = z0 - i * passo - R() * 3, x = FX(side, 0.3), y = 5 + R() * 3, h = 4 + R() * 3;
      box(0.3, h, 1.0, std('#100810', 0.5), x, y, z); const tubo = box(0.12, h - 0.3, 0.8, emi(colori[i % colori.length], 3.2), x - side * 0.17, y, z); tubo.name = 'neon'; M.vita?.aggiungi(tubo, 'lampeggia', { min: 0.86, freq: 0.25 + (i % 3) * 0.08, modo: 'respiro' }); } };

  // ---- condizionatore di qualità (§0a): volume vero, faccia dipinta con ventola, pale, griglia, feritoie, sporco; staffe
  let acMat = null;
  const acMats = () => acMat || (acMat = (() => { const f = tex(256, 180, (g, w, h) => {
      const q = g.createLinearGradient(0, 0, 0, h); q.addColorStop(0, '#d6d8e2'); q.addColorStop(1, '#a8abbc'); g.fillStyle = q; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(60,50,70,${G() * 0.08})`; g.fillRect(G() * w, G() * h, 2 + G() * 8, 2 + G() * 5); }
      g.fillStyle = 'rgba(40,30,60,0.18)'; g.fillRect(0, h - 26, w, 26);
      const cx = w * 0.58, cy = h * 0.5, r = h * 0.36, fan = g.createRadialGradient(cx - 6, cy - 6, 4, cx, cy, r); fan.addColorStop(0, '#5a5870'); fan.addColorStop(1, '#2e2c40'); g.fillStyle = fan; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
      g.strokeStyle = 'rgba(210,210,225,0.35)'; g.lineWidth = 3; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a) * r * 0.5 + 10, cy + Math.sin(a) * r * 0.5, cx + Math.cos(a + 0.5) * r * 0.9, cy + Math.sin(a + 0.5) * r * 0.9); g.stroke(); }
      g.strokeStyle = 'rgba(30,25,45,0.55)'; g.lineWidth = 2; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx - r, cy + i * r / 4.5); g.lineTo(cx + r, cy + i * r / 4.5); g.stroke(); }
      g.strokeStyle = '#3a2a2e'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(40,30,60,0.35)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(14, 34 + i * 22); g.lineTo(w * 0.28, 34 + i * 22); g.stroke(); }
      g.strokeStyle = '#3a2a2e'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); });
    const s = std('#8a8ca0', 0.8), t = std('#c4c6d4', 0.7); s.emissive.set('#5a5c70'); s.emissiveIntensity = 0.35; t.emissive.set('#8a8ca0'); t.emissiveIntensity = 0.35;
    return { s, t, f: dipinto(f, 0.18, 0.75) }; })());
  M.condizionatore = ({ lato = 1, y = 4, z = 0 } = {}) => { const { s, t, f } = acMats(), x = FX(lato, 0.19);
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.85), lato > 0 ? [s, f, t, s, s, s] : [f, s, t, s, s, s]); ac.position.set(x, y, z); ac.castShadow = ac.receiveShadow = true; ac.name = 'condizionatore'; add(ac); M.vita?.aggiungi(ac, 'vibra', { amp: 0.003 });
    for (const dz of [-0.3, 0.3]) box(0.42, 0.04, 0.04, std('#2a2630', 0.5, 0.6), FX(lato, 0.2), y - 0.32, z + dz); return ac; };

  // ---- facciata dipinta del palazzo protagonista (§5): marcapiani, finestre grandi incorniciate (una su cinque accesa), piano terra scuro
  M.facciata = ({ lato = 1, z0 = 4, z1 = -14, h = 16, base = ['#4a5288', '#5e6496'], terra = '#16142a', cornice = '#c9ccdc', vetro = ['#3a4c9a', '#1c2458'], accesa = ['#ffcf70', '#f08a30'], emissiva = 0.32, condizionatori = true, retro = '#202040' } = {}) => {
    const Lz = z0 - z1, acPos = [];
    const t = tex(1024, 1024 * h / Lz, (g, w, hh) => { const s = w / Lz, gy = hh - 3.6 * s;
      const q = g.createLinearGradient(0, 0, w, 0); q.addColorStop(0, base[0]); q.addColorStop(1, base[1]); g.fillStyle = q; g.fillRect(0, 0, w, gy);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(20,20,50,${G() * 0.06})`; g.fillRect(G() * w, G() * gy, 2 + G() * 6, 2 + G() * 6); }
      g.fillStyle = terra; g.fillRect(0, gy, w, hh - gy);
      g.strokeStyle = '#1e1a30'; g.lineWidth = 4; for (let y = gy - 3.2 * s; y > 0; y -= 3.2 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let y = gy - 3.0 * s, f = 0; y > 1.5 * s; y -= 3.2 * s, f++) for (let x = 0.8 * s, k = 0; x < w - 2 * s; x += 3.4 * s, k++) {
        const ww = 2.2 * s, wh = 2.0 * s, lit = (f * 7 + k * 3) % 5 === 0, yy = y + 0.5 * s;
        g.fillStyle = cornice; g.fillRect(x - 6, yy - 6, ww + 12, wh + 12);
        const gl = g.createLinearGradient(x, y, x + ww, y + wh); gl.addColorStop(0, lit ? accesa[0] : vetro[0]); gl.addColorStop(1, lit ? accesa[1] : vetro[1]); g.fillStyle = gl; g.fillRect(x, yy, ww, wh);
        g.strokeStyle = '#2e2226'; g.lineWidth = 5; g.strokeRect(x, yy, ww, wh); g.beginPath(); g.moveTo(x + ww / 2, yy); g.lineTo(x + ww / 2, yy + wh); g.stroke();
        if (!lit) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(x + 8, yy + wh - 8); g.lineTo(x + ww * 0.45, yy + 8); g.lineTo(x + ww * 0.6, yy + 8); g.lineTo(x + 30, yy + wh - 8); g.fill(); }
        if ((f + k) % 3 === 1) acPos.push([(x + ww + 0.25 * s) / s + 0.4, (hh - (yy + wh - 0.9 * s)) / s - 0.3]); }
      g.strokeStyle = '#2e2226'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, hh - 6); });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(Lz, h), dipinto(t, emissiva)); wall.rotation.y = lato > 0 ? -Math.PI / 2 : Math.PI / 2; wall.position.set(FX(lato), h / 2, (z0 + z1) / 2); wall.receiveShadow = true; add(wall);
    if (condizionatori) for (const [u, v] of acPos) M.condizionatore({ lato, y: v, z: lato > 0 ? z1 + u : z0 - u });
    box(6, h, Lz, std(retro, 0.9), lato > 0 ? XR + 3.01 : -(XL + 3.01), h / 2, (z0 + z1) / 2); return wall; };

  // ---- porta luminosa a due ante (in scala: 2,4 × 2,3 m con personaggi di 2 m) + fascia piatta a filo del muro + luci vere
  M.porta = ({ lato = 1, z = -1.6, w = 2.4, h = 2.3, colori = ['#ffcf90', '#ff8a40'], bordo = '#fff2d8', fascia = '#ff4aa8', luceC = '#ff9a50', luci = true } = {}) => {
    const s = lato > 0 ? 1 : -1, ry = lato > 0 ? -Math.PI / 2 : Math.PI / 2;
    const t = tex(256, 256, (g, W, H) => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, colori[0]); q.addColorStop(1, colori[1]); g.fillStyle = q; g.fillRect(0, 0, W, H);
      g.strokeStyle = bordo; g.lineWidth = 6; g.strokeRect(4, 4, W - 8, H - 8); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); });
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.1, 1.1, 1.1) })); dm.rotation.y = ry; dm.position.set(FX(lato, 0.02), h / 2, z); add(dm);
    if (fascia) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.4, 0.32), emi(fascia, 2.4)); f.rotation.y = ry; f.position.set(FX(lato, 0.015), h + 0.32, z); add(f); }
    if (luci) { luce(luceC, 10, FX(lato, 1.0), 1.1, z, 6); if (fascia) luce(fascia, 5, FX(lato, 0.8), h + 0.1, z + 1.4, 5); }
    return dm; };

  // ---- insegna verticale a bandiera (§4): faccia luminosa ×1,25 con lampadine sul bordo, cassone scuro con spessore, staffe, luce vera
  M.insegna = ({ testo = 'PACHINKO', sopra = 'パチンコ', x = 6.303, y = 5.005, z = -1.454, w = 1.245, h = 5.121, ry = 0.039, lato = 1, fondo = ['#ff2a6a', '#c0104a'], riquadro = '#ff5a9a', lettere = '#ffe0ec', cassa = '#2a0a1e', freccia = '#ffd23a', luceC = '#ff3a9a', luceF = 14, lucePos = null, passa = true } = {}) => {
    const t = tex(256, 1280, (g, W, H) => { g.fillStyle = cassa; g.fillRect(0, 0, W, H);
      const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, fondo[0]); q.addColorStop(1, fondo[1]); g.fillStyle = q; g.fillRect(18, 18, W - 36, H - 36); g.textAlign = 'center';
      let top = 220; if (sopra) { g.fillStyle = riquadro; g.fillRect(34, 34, W - 68, 170); g.fillStyle = '#ffffff'; g.font = `bold ${Math.min(70, 300 / [...sopra].length)}px sans-serif`; g.fillText(sopra, W / 2, 150); } else top = 60;
      const ch = [...testo], bot = freccia ? 1050 : H - 60, st = Math.min(96, (bot - top) / ch.length), fs = Math.min(96, st * 1.0); g.fillStyle = lettere; g.font = `bold ${fs}px sans-serif`; ch.forEach((c, i) => g.fillText(c, W / 2, top + st * (i + 0.5) + fs * 0.44));
      if (freccia) { g.fillStyle = freccia; g.strokeStyle = '#a06000'; g.lineWidth = 6; g.beginPath(); g.moveTo(70, 1080); g.lineTo(186, 1080); g.lineTo(186, 1130); g.lineTo(236, 1130); g.lineTo(128, 1250); g.lineTo(20, 1130); g.lineTo(70, 1130); g.closePath(); g.fill(); g.stroke(); }
      g.fillStyle = '#fff6c0'; for (let yy = 12; yy < H; yy += 28) { g.beginPath(); g.arc(9, yy, 6, 0, 7); g.arc(W - 9, yy, 6, 0, 7); g.fill(); } });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.25, 1.25, 1.25), side: THREE.DoubleSide })); sg.position.set(x, y, z); sg.rotation.y = ry; add(sg);
    const c = box(w * 1.09, h * 1.023, 0.22, std(cassa, 0.5), 0, 0, 0); c.rotation.copy(sg.rotation); c.position.copy(sg.position).add(new THREE.Vector3(0, 0, -0.125).applyEuler(sg.rotation));
    const wx = FX(lato), bw = Math.abs(wx - x) + 0.05; for (const dy of [h * 0.43, -h * 0.39]) box(bw, 0.1, 0.1, std('#1a1020', 0.6), (wx + x) / 2 + (lato > 0 ? 0.0 : 0), y + dy, z - 0.05);
    if (luceF) { const p = lucePos || [x - (lato > 0 ? 0.3 : -0.3), y - 1.6, z + 0.05]; luce(luceC, luceF, p[0], p[1], p[2], 10); }
    sg.name = 'insegna'; sg.userData.scritta = 1; sg.userData.testo = [sopra, testo].filter(Boolean).join(' '); if (passa) sg.userData.testoPassa = 1; M.vita?.aggiungi(sg, 'lampeggia', { min: 0.88, freq: 0.45 }); return sg; };

  // ---- insegne appese spente (una su quattro accesa): pannelli verticali con testo, perpendicolari al muro
  M.insegneAppese = ({ parole = ['PACHINKO', 'カラオケ', 'SLOTS', 'パチンコ', 'GAME', 'ラーメン', 'HOTEL', 'カフェ'], z1 = -60, zDx = -10, zSx = -2, accese = ['#ff3a9a', '#30c8ff', '#ff8a30'] } = {}) => {
    const spenta = (txt, h) => tex(160, 160 * h, (g, w, H) => { g.fillStyle = '#2c3350'; g.fillRect(0, 0, w, H); g.strokeStyle = '#1a1e30'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, H - 10);
      g.fillStyle = '#7a84a8'; g.font = 'bold 62px sans-serif'; g.textAlign = 'center'; const ch = [...txt]; ch.forEach((c, i) => g.fillText(c, w / 2, 110 + i * (H - 260) / Math.max(ch.length - 1, 1)));
      g.fillStyle = '#5a6488'; g.beginPath(); g.moveTo(40, H - 110); g.lineTo(120, H - 110); g.lineTo(80, H - 40); g.fill(); });
    let k = 0;
    for (const side of [-1, 1]) for (let z = side > 0 ? zDx : zSx; z > z1; z -= 5 + (k % 3) * 2.5, k++) { const h = 3.5 + (k % 3) * 1.2, t = spenta(parole[k % parole.length], h), lit = k % 4 === 1;
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, emissive: lit ? new THREE.Color(accese[k % accese.length]) : 0xffffff, emissiveMap: lit ? null : t, emissiveIntensity: lit ? 1.6 : 0.25, side: THREE.DoubleSide });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, h), m); p.position.set(FX(side, 0.8), 5.2 + (k % 2) * 1.5, z); p.rotation.y = side > 0 ? -0.15 : 0.15; p.name = 'insegna_appesa'; add(p);
      M.vita?.aggiungi(p, 'pendola', { asse: 'x', amp: 0.03, freq: 0.22 }); if (lit) M.vita?.aggiungi(p, 'lampeggia', { min: 0.8, freq: 0.5 });
      box(1.0, 0.08, 0.08, std('#1a1020', 0.6), FX(side, 0.4), 5.2 + (k % 2) * 1.5 + h / 2 - 0.2, z); } };

  // ---- vetrine accese a piano terra con tettoiette colorate; una lanterna rossa ogni quattro
  M.vetrine = ({ z1 = -70, zDx = -7, zSx = 0, colori = ['#ffcf80', '#ffe2a8', '#ff9a50', '#fff0c8'], tettoie = ['#c83a3a', '#2a6ac0', '#e8c040'], lanterne = '#ff3020' } = {}) => {
    for (const side of [-1, 1]) for (let z = side > 0 ? zDx : zSx, i = 0; z > z1; z -= 3.2 + (i % 3), i++) { if (i % 3 === 2) continue;
      const v = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(colori[i % colori.length]).multiplyScalar(1.15) })); v.position.set(FX(side, 0.02), 1.05, z); v.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; v.name = 'vetrina'; add(v); M.vita?.aggiungi(v, 'lampeggia', { min: 0.9, freq: 0.15, modo: 'respiro' });
      box(0.4, 0.3, 2.4, std(tettoie[i % tettoie.length], 0.6), FX(side, 0.2), 2.3, z);
      if (lanterne && i % 4 === 0) M.lanterna({ x: FX(side, 0.5), y: 2.7, z: z + 1.3, colore: lanterne }); } };
  M.lanterna = ({ x, y = 2.7, z, colore = '#ff3020', r = 0.22 }) => { const l = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(colore).multiplyScalar(2.2) })); l.scale.y = 1.3; l.position.set(x, y, z); l.name = 'lanterna'; add(l); M.vita?.aggiungi(l, 'pendola', { amp: 0.09, freq: 0.38, perno: [x, y + r * 1.6, z] }); return l; };

  // ---- cavi (catenarie) tra i due lati e lungo la facciata
  M.cavo = (a, b, sag = 1) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector3().lerpVectors(A, B, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0))); }
    return add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025, 4), std('#141018', 0.6))); };
  M.cavi = ({ n = 9, z0 = -4, passo = 6.5 } = {}) => { for (let i = 0; i < n; i++) { const z = z0 - i * passo; M.cavo([-XL, 8.5 + (i % 3), z], [XR, 9 + ((i + 1) % 3), z - 2 - (i % 2) * 3], 0.9 + (i % 2) * 0.5); }
    for (let i = 0; i < 4; i++) M.cavo([-XL, 7.5 + i * 0.4, -2 - i], [-XL, 7.8 + i * 0.4, -60], 1.5); };

  // ---- furgone squadrato (fari: solo la faccia davanti si accende)
  // `moto`: { a: [x, y, z], dur, pausa } = passa per la strada con le ruote che girano (comportamento «passa» di vita.js); senza, è parcheggiato e vibra a motore acceso
  M.furgone = ({ x = 1.6, z = -24, colore = '#c8ccd8', moto = null } = {}) => { const g = new THREE.Group(); g.name = 'furgone'; g.position.set(x, 0, z); add(g); const P = [];
    P.push(box(1.9, 1.9, 4.2, std(colore, 0.5), 0, 1.15, 0), box(1.92, 0.8, 1.6, std('#1c2440', 0.2, 0.3), 0, 1.6, 1.7));
    for (const dx of [-0.7, 0.7]) P.push(boxLuce(0.25, 0.15, 0.05, '#fff2c8', 3, dx, 0.75, 2.12, 4));
    for (const [dx, dz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16), std('#111', 0.8)); w.rotation.z = Math.PI / 2; w.position.set(dx, 0.38, dz); w.name = 'ruota'; P.push(w); }
    P.forEach(m => g.add(m));
    if (moto) M.vita?.aggiungi(g, 'passa', { da: [x, 0, z], a: moto.a, dur: moto.dur ?? 7, pausa: moto.pausa ?? 3, r: 0.38 }); else M.vita?.aggiungi(g, 'vibra', { amp: 0.006, freq: 9 }); return g; };

  // ---- strisce pedonali: bianche di base (emissiva 0,45) ma prendono il viola/rosa delle luci [utente]
  M.strisce = ({ z = -6.5, x0 = -XL + 0.5, x1 = 6.5, lungo = 3.2 } = {}) => { for (let x = x0; x <= x1; x += 1.0) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, lungo), new THREE.MeshStandardMaterial({ color: '#f4f4f8', roughness: 0.5, emissive: '#f4f4f8', emissiveIntensity: 0.45 })); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.006, z); s.receiveShadow = true; s.userData.struttura = 1; add(s); } };

  // ---- lampioni (testa: si accende solo la faccia sotto)
  M.lampioni = ({ z0 = -4, z1 = -100, passo = 14, colore = '#ffe0a0' } = {}) => { for (let z = z0; z > z1; z -= passo) for (const s of [-1, 1]) { box(0.12, 5, 0.12, std('#222', 0.5, 0.8), s > 0 ? 4.6 : -(XL - 0.5), 2.6, z); const tl = boxLuce(0.5, 0.15, 0.3, colore, 3, s > 0 ? 4.3 : -(XL - 0.8), 5.1, z, 3); tl.name = 'lampione'; M.vita?.aggiungi(tl, 'lampeggia', { min: 0.93, freq: 0.2, modo: 'respiro' }); } };

  // ---- pezzi generici per mondi nuovi (sempre con lo standard §0a: mai lasciarli come segnaposto a tinta unita)
  M.scatola = ({ w = 1, h = 1, d = 1, x = 0, y, z = 0, colore = '#8a8ca0', ruvido = 0.8, emissiva = 0.2, ry = 0 }) => { const m = std(colore, ruvido); m.emissive.set(colore); m.emissiveIntensity = emissiva; const o = box(w, h, d, m, x, y ?? h / 2, z); o.rotation.y = ry; return o; };
  M.scatolaLuce = ({ w = 1, h = 1, d = 1, x = 0, y = 1, z = 0, colore = '#ffe0a0', forza = 3, faccia = 4 }) => boxLuce(w, h, d, colore, forza, x, y, z, faccia);
  // pannello piatto: `dipingi(g, W, H)` disegna la faccia su canvas; `luminoso` = schermo/insegna/vetrina (piatto, a filo), altrimenti prende la luce
  M.pannello = ({ w = 2, h = 1, x = 0, y = 1, z = 0, ry = 0, rx = 0, px = 256, dipingi, colore = '#ffffff', luminoso = 0, emissiva = 0.3, testo, coloreTesto = '#ffffff', doppio = true, passa = false }) => {
    const t = (dipingi || testo) ? tex(px, px * h / w, (g, W, H) => { g.fillStyle = colore; g.fillRect(0, 0, W, H); if (dipingi) dipingi(g, W, H, G); if (testo) { g.fillStyle = coloreTesto; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = H * 0.6; g.font = `bold ${fs}px sans-serif`; const tw = g.measureText(testo).width; if (tw > W * 0.86) { fs *= W * 0.86 / tw; g.font = `bold ${fs}px sans-serif`; } g.fillText(testo, W / 2, H / 2); }
      g.strokeStyle = '#3a2a2e'; g.lineWidth = Math.max(4, W / 60); g.strokeRect(2, 2, W - 4, H - 4); }) : null;
    const m = luminoso ? new THREE.MeshBasicMaterial({ map: t, color: t ? new THREE.Color(luminoso, luminoso, luminoso) : new THREE.Color(colore).multiplyScalar(luminoso), side: doppio ? THREE.DoubleSide : THREE.FrontSide })
      : (t ? Object.assign(dipinto(t, emissiva), { side: doppio ? THREE.DoubleSide : THREE.FrontSide }) : std(colore));
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; if (testo) { o.userData.scritta = 1; o.userData.testo = String(testo); if (passa) o.userData.testoPassa = 1; } return add(o); };
  M.luceVera = ({ colore = '#ffffff', forza = 8, x = 0, y = 2, z = 0, dist = 8, decadimento = 1.6, ombra = false } = {}) => {
    const l = new THREE.PointLight(colore, forza, dist, decadimento);
    l.position.set(x, y, z);
    if (ombra) { l.castShadow = true; l.shadow.bias = -0.0005; l.shadow.mapSize.set(512, 512); }
    return add(l);
  };
  M.luceSpot = ({ colore = '#fff0d8', forza = 9, x = 0, y = 3, z = 0, verso = [0, 0, 0], angolo = 0.55, penombra = 0.55, dist = 14, decadimento = 1.0, ombra = false } = {}) => {
    const tgt = Array.isArray(verso) ? verso : [verso.x ?? 0, verso.y ?? 0, verso.z ?? 0];
    const l = new THREE.SpotLight(colore, forza, dist, angolo, penombra, decadimento);
    l.position.set(x, y, z);
    l.target.position.set(...tgt);
    if (ombra) {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
      l.shadow.bias = -0.0004;
      l.shadow.normalBias = 0.02;
    }
    add(l.target);
    return add(l);
  };
  M.luceFinestra = ({ x = 0, y = 2, z = -3.65, verso = [0.4, 0, -0.4], colore = '#fff0d0', coloreCielo = '#c6e0ff', forza = 11, angolo = 0.36, penombra = 0.62, dist = 14, raggio = 0.024, ombra = true } = {}) => {
    const tgt = Array.isArray(verso) ? verso : [verso.x ?? 0, verso.y ?? 0, verso.z ?? 0];
    const spot = M.luceSpot({ colore, forza, x, y, z, verso: tgt, angolo, penombra, dist, decadimento: 0.9, ombra });
    const dir = new THREE.Vector3(tgt[0] - x, tgt[1] - y, tgt[2] - z);
    const len = Math.min(dist * 0.55, Math.max(1.5, dir.length() * 1.05));
    const uDir = dir.clone().normalize();
    const fill = M.luceVera({ colore: coloreCielo, forza: forza * 0.20, x: x + uDir.x * 1.1, y: y - 0.15, z: z + uDir.z * 1.1, dist: 8.5, decadimento: 1.0 });
    let fascio = null;
    if (raggio > 0) {
      const rTop = 0.28, rBot = Math.min(1.5, Math.tan(angolo) * len * 0.78);
      const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20, 1, true);
      geo.translate(0, -len / 2, 0);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uCol: { value: new THREE.Color(colore) }, uAlpha: { value: raggio } },
        vertexShader: `varying vec2 vUv; varying vec3 vN, vV;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `uniform vec3 uCol; uniform float uAlpha; varying vec2 vUv; varying vec3 vN, vV;
          void main() {
            float t = 1.0 - vUv.y;
            float along = smoothstep(0.08, 0.30, t) * (1.0 - smoothstep(0.32, 0.94, t));
            float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.85);
            gl_FragColor = vec4(uCol, uAlpha * along * edge);
          }`
      });
      fascio = new THREE.Mesh(geo, mat);
      fascio.position.set(x, y, z);
      fascio.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), uDir);
      fascio.castShadow = fascio.receiveShadow = false;
      fascio.userData.noInk = true;
      fascio.userData.ombra = true;
      fascio.userData.noRick = true;
      fascio.userData.struttura = 1;
      fascio.renderOrder = 4;
      add(fascio);
    }
    return { spot, fill, fascio };
  };

  // ---- quinte di primo piano (3-plane staging: rami, stipite, pianta) per profondità cinematografica
  M.quinta = (opt = {}) => {
    const tipo = opt.tipo || 'rami';
    const lato = opt.lato ?? -1;
    const inw = lato < 0 ? 1 : -1;
    const g = new THREE.Group();
    g.position.set(opt.x ?? 0, opt.y ?? 0, opt.z ?? 0);
    g.rotation.y = opt.ry ?? 0;
    g.scale.setScalar(opt.scala ?? 1);
    const ombra = opt.ombra ?? false;

    if (tipo === 'rami') {
      const mLegno = std(opt.legno || '#3d291c', 0.88);
      const mFogliaS = std(opt.colore || '#2f4f20', 0.82);
      const mFogliaC = std(opt.chiaro || '#466f2e', 0.78);
      if (opt.tronco) {
        const y0 = opt.y ?? 2.25;
        const hT = (typeof opt.tronco === 'number' ? opt.tronco : y0 + 0.40) / (opt.scala ?? 1);
        const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.122, hT, 10), mLegno);
        tronco.position.set(0, hT * 0.5 - y0 / (opt.scala ?? 1), 0);
        g.add(tronco);
      }
      const fogliaGrp = new THREE.Group();
      const ramo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.042, 0.78, 8), mLegno);
      ramo.position.set(inw * 0.38, -0.03, 0);
      ramo.rotation.z = -inw * 1.62;
      fogliaGrp.add(ramo);
      const rametto = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.024, 0.42, 7), mLegno);
      rametto.position.set(inw * 0.34, 0.02, 0.05);
      rametto.rotation.set(-0.18, 0, -inw * 1.38);
      fogliaGrp.add(rametto);
      const ciuffi = [
        [inw * 0.16, 0.08, 0.02, 0.17, 0.11, 0.15, 0],
        [inw * 0.30, 0.02, -0.04, 0.18, 0.11, 0.15, 1],
        [inw * 0.44, 0.05, 0.06, 0.16, 0.10, 0.14, 0],
        [inw * 0.58, -0.02, -0.02, 0.15, 0.10, 0.13, 1],
        [inw * 0.70, -0.06, 0.03, 0.13, 0.09, 0.12, 0],
        [inw * 0.24, -0.06, 0.08, 0.14, 0.09, 0.13, 1],
        [inw * 0.42, -0.08, 0.09, 0.13, 0.09, 0.12, 0],
        [inw * 0.54, 0.09, 0.01, 0.13, 0.09, 0.11, 1],
        [inw * 0.12, 0.16, -0.03, 0.16, 0.11, 0.14, 1],
      ];
      for (const [cx, cy, cz, sx, sy, sz, chi] of ciuffi) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), chi ? mFogliaC : mFogliaS);
        f.position.set(cx, cy, cz);
        f.scale.set(sx, sy, sz);
        f.rotation.set(cx * 0.7, cy * 1.1, cz * 0.9);
        fogliaGrp.add(f);
      }
      g.add(fogliaGrp);
      const amp = opt.vento ?? 0.024;
      if (amp > 0) {
        tick.push(t => {
          fogliaGrp.rotation.z = Math.sin(t * 1.15 + (opt.x ?? 0)) * amp;
          fogliaGrp.rotation.x = Math.cos(t * 0.85 + (opt.z ?? 0)) * (amp * 0.65);
        });
      }
    } else if (tipo === 'stipite') {
      const h = opt.altezza ?? 3.1;
      const mLegno = std(opt.colore || '#3f281a', 0.64, 0.04);
      const mTrim = std('#553724', 0.56, 0.05);
      const mMuro = std(opt.muro || '#c8b498', 0.90);
      const mont = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.24), mLegno);
      mont.position.set(0, 0, 0);
      g.add(mont);
      const modan = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.27), mTrim);
      modan.position.set(inw * 0.09, 0, 0);
      g.add(modan);
      const arch = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.20, 0.25), mLegno);
      arch.position.set(inw * 0.52, h * 0.5 - 0.10, 0);
      g.add(arch);
      const spalla = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 0.20), mMuro);
      spalla.position.set(-inw * 0.69, 0, 0);
      g.add(spalla);
    } else if (tipo === 'pianta') {
      const mVaso = std(opt.vaso || '#9c5234', 0.56, 0.02);
      const mTerra = std('#36261a', 0.95);
      const mFoglia = std(opt.colore || '#2f5d29', 0.54, 0.04);
      const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.105, 0.25, 14), mVaso);
      vaso.position.y = 0.125;
      g.add(vaso);
      const bordo = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.156, 0.036, 14), mVaso);
      bordo.position.y = 0.24;
      g.add(bordo);
      const terra = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 12), mTerra);
      terra.position.y = 0.235;
      g.add(terra);
      const chioma = new THREE.Group();
      chioma.position.y = 0.25;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        const piv = new THREE.Group();
        piv.rotation.y = a;
        const stelo = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mFoglia);
        stelo.scale.set(0.052, 0.17, 0.022);
        stelo.position.set(0.08 + (i % 2) * 0.03, 0.11 + (i % 3) * 0.025, 0);
        stelo.rotation.z = -0.68 - (i % 2) * 0.18;
        piv.add(stelo);
        chioma.add(piv);
      }
      g.add(chioma);
      const amp = opt.vento ?? 0.015;
      if (amp > 0) {
        tick.push(t => { chioma.rotation.z = Math.sin(t * 1.3 + (opt.x ?? 0)) * amp; });
      }
    }

    g.traverse(m => {
      if (!m.isMesh) return;
      m.castShadow = ombra;
      m.receiveShadow = true;
      m.userData.quinta = 1;
      m.userData.struttura = 1;
    });
    add(g);
    return g;
  };

  // ---- personaggi: sagoma 1,0 × 2,0 m con ombra ovale; `scala` per bambini/giganti
  M.omino = (opt = {}, x = 0, z = 0, ry = -0.5, scala = 1) => { const m = D.card(opt, x, z, ry); if (scala !== 1) m.scale.setScalar(scala); return m; };
  // folla che ATTRAVERSA le strisce (mai omini messi lì a caso): due file sfalsate, di profilo nel verso in cui camminano
  M.follaAttraversa = ({ z = -6.5, n = 9, x0 = 2.3, passo = 0.55, seme = 7, min = -XL + 0.3, max = XR - 0.3 } = {}) => { const out = [];
    for (let i = 0; i < n; i++) { const x = x0 + i * passo + (i % 2) * 0.2, zz = z + (i % 2 ? -0.7 : 0.6) + ((i * 7) % 3) * 0.2, v = i % 3 === 2 ? -1 : 1;
      const m = M.omino({ ...personalita(i * 31 + seme), posa: 'cammina', verso: v, passo: (i * 0.37) % 1 }, x, zz, i % 2 ? 0.5 : -0.5); m.userData.cammina = { dir: v, x0: x, min, max, vel: 1.25 }; out.push(m); } return out; };
  M.follaFerma = ({ punti = [[6.3, -9.5, 6], [5.6, -14.5, 7], [6.4, -18, 8], [3.6, -16, 9], [2.6, -20, 0], [4.6, -22, 3]], verso = -0.3, ry = -0.6 } = {}) => punti.map(([x, z, c = 1]) => { const m = M.omino({ ...personalita(c * 53 + 101), posa: 'fermo', verso }, x, z, ry); m.name = 'comparsa'; M.vita?.aggiungi(m, 'respira', { amp: 0.015 }); return m; });

  // ---- via di città di notte completa (quella approvata): un solo oggetto nel JSON dà tutta la ricchezza del §8.
  // `protagonista`: tratto della facciata destra lasciato libero per il palazzo della storia (facciata + porta + insegna).
  // ---- MONDO RICK, sotto-pezzo B1 (solo con "mondo_rick": true): superfici dipinte chiare e sature come @RicksClips3000
  // (references/ricksclips + asset-kit/.../reports/textures.md: superfici grandi L* 72-80, mai sotto L* ~19 fuori dall'inchiostro).
  // Non tocca i file dei luoghi: misura il colore medio di ogni materiale (colore × texture) e lo sposta nella fascia giusta.
  M.dipingiRick = (o = {}) => {
    const LMIN = o.lMin ?? 72, LMAX = o.lMax ?? 80, CMIN = o.cMin ?? 14, OMIN = o.oMin ?? 24, OMAX = o.oMax ?? 84, CK = o.cK ?? 1.15, PIENO = o.pieno ?? 25;   // v2 (12/11, utente: «troppo stravolto, il rosso è diventato arancione»): tinta sempre uguale, i colori già pieni quasi non si toccano
    const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4), srgb = c => c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    const toLab = ([r, g, b]) => { const R_ = lin(r), G_ = lin(g), B_ = lin(b); let X = (0.4124 * R_ + 0.3576 * G_ + 0.1805 * B_) / 0.95047, Y = 0.2126 * R_ + 0.7152 * G_ + 0.0722 * B_, Z = (0.0193 * R_ + 0.1192 * G_ + 0.9505 * B_) / 1.08883;
      const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; X = f(X); Y = f(Y); Z = f(Z); return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]; };
    const fromLab = ([L, a, b]) => { const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200, inv = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
      const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
      return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z]; };
    const dentro = v => v.every(c => c >= -0.002 && c <= 1.002), aSrgb = v => v.map(c => Math.min(1, Math.max(0, srgb(Math.max(0, c)))));
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const cg = cv.getContext('2d', { willReadFrequently: true });
    const mediaMap = t => { try { const im = t?.image; if (!im || !(im.width > 0)) return null; cg.clearRect(0, 0, 16, 16); cg.drawImage(im, 0, 0, 16, 16); const d = cg.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += lin(d[i] / 255); g += lin(d[i + 1] / 255); b += lin(d[i + 2] / 255); n++; } return n ? [srgb(r / n), srgb(g / n), srgb(b / n)] : null; } catch (e) { return null; } };
    const fatto = new Map(), bb = new THREE.Box3(), sz = new THREE.Vector3(); let nS = 0, nO = 0;
    root.traverse(m => {
      if (!m.isMesh || m.userData.card || m.userData.ombra || m.userData.wet || m.userData.scritta || m.userData.noRick) return;
      bb.setFromObject(m); bb.getSize(sz); const area = Math.max(sz.x * sz.y, sz.x * sz.z, sz.y * sz.z), soffitto = sz.y < 0.45 && bb.min.y > 2.2;
      const grande = (area > (o.area ?? 4) && Math.min(sz.x, sz.y, sz.z) < 0.45 && !soffitto) || m === D.road || m.userData.suolo;   // solo pavimenti e muri (sottili e larghi); soffitti, tavoli e banconi sono oggetti
      const lista = Array.isArray(m.material) ? m.material : [m.material];
      for (let li = 0; li < lista.length; li++) { let mat = lista[li];
        if (!mat?.isMeshStandardMaterial || mat.userData.scritta || mat.userData.noRick) continue;
        if (fatto.has(mat)) { if (fatto.get(mat) === grande) continue;   // stesso materiale su superficie e oggetto: si sdoppia e si ricomincia dal colore originale
          const c2 = mat.clone(); c2.color.copy(mat.userData.rickC0); c2.map = mat.userData.rickMap0; if (mat.userData.rickE0) c2.emissive.copy(mat.userData.rickE0); c2.userData = {}; mat = c2;
          if (Array.isArray(m.material)) m.material[li] = c2; else m.material = c2; }
        fatto.set(mat, grande); mat.userData.rickC0 = mat.color.clone(); mat.userData.rickMap0 = mat.map; if (mat.emissive) mat.userData.rickE0 = mat.emissive.clone();
        const base = [mat.color.r, mat.color.g, mat.color.b].map(srgb), mm = mat.map ? mediaMap(mat.map) : null, avg = mm ? mm.map((v, i) => srgb(lin(v) * lin(base[i]))) : base;
        let [L, a, b] = toLab(avg); const C = Math.hypot(a, b); let h = Math.atan2(b, a);
        let L2, C2;
        const pieno = C >= PIENO;
        if (grande) { L2 = pieno ? L : Math.min(LMAX, Math.max(Math.min(LMIN, L + 25), L)); C2 = pieno ? C : Math.min(o.cMax ?? 30, Math.max(CMIN, C * CK)); if (C < 2.5) h = (o.tinta ?? 75) * Math.PI / 180; nS++; }   // grigio → crema tenue; colore pieno (rosso, blu…): non si tocca, se no la luce lo fa scivolare verso l'arancio
        else { L2 = Math.min(Math.max(L, OMIN), Math.max(L, OMAX)); C2 = pieno ? C : C * CK; nO++; }
        let lab = fromLab([L2, C2 * Math.cos(h), C2 * Math.sin(h)]); for (let t = 0; t < 12 && !dentro(lab); t++) { C2 *= 0.9; lab = fromLab([L2, C2 * Math.cos(h), C2 * Math.sin(h)]); }   // fuori gamma: si toglie croma, MAI si cambia tinta
        const tgt = aSrgb(lab);
        if (o.debug && Math.abs(L2 - L) > 12) console.log('[d] rick ' + (m.name || m.parent?.name || '?') + ' ' + (grande ? 'S' : 'o') + ' L ' + L.toFixed(0) + '→' + L2.toFixed(0) + ' C ' + C.toFixed(0) + '→' + C2.toFixed(0) + (mm ? ' map' : '') + ' sz ' + sz.toArray().map(v => v.toFixed(1)).join('x'));
        const Yl = v => 0.2126 * lin(v[0]) + 0.7152 * lin(v[1]) + 0.0722 * lin(v[2]), kY = Yl(tgt) / Math.max(1e-4, Yl(avg));
        const k = pieno ? [kY, kY, kY] : tgt.map((v, i) => lin(v) / Math.max(1e-3, lin(avg[i])));   // colore pieno: stesso fattore su tutti i canali = solo più chiaro, tinta identica   // fattore lineare per canale (il colore può superare 1: schiarisce anche la texture)
        mat.color.setRGB(mat.color.r * Math.min(k[0], 6), mat.color.g * Math.min(k[1], 6), mat.color.b * Math.min(k[2], 6));
        if (mat.emissive && mat.emissiveIntensity > 0 && !mat.emissiveMap) mat.emissive.copy(mat.color).multiplyScalar(0.5);
        if (grande && !mat.map && o.macchie !== false) {   // superficie liscia: campi di colore piatti con poche macchie di pittura (α 0,05-0,08), come i muri di Rick
          let s2 = 1234 + nS * 97; const Rn = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
          const t = tex(512, 512, (g, W, H) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
            for (let i = 0; i < 9; i++) { const x = Rn() * W, y = Rn() * H, r = 60 + Rn() * 170, q = g.createRadialGradient(x, y, 0, x, y, r), sc = Rn() < 0.5, al = 0.05 + Rn() * 0.04;
              const col = sc ? `rgba(120,95,150,${al})` : `rgba(255,248,232,${al * 1.4})`; q.addColorStop(0, col); q.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
              for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) { g.save(); g.translate(dx, dy); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); } } });
          t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, sz.x / 4 + sz.z / 4), Math.max(1, sz.y / 4 + sz.z / 8)); mat.map = t; mat.needsUpdate = true; }
      } });
    return { superfici: nS, oggetti: nO }; };

  M.viaCitta = ({ protagonista = [4, -14], parole, neon = true, cavi = true, furgone = true, strisce = -6.5, folla = true, lampioni = true, vetrine = true, insegne = true, mezzeria = true, colori } = {}) => {
    if (mezzeria) M.mezzeria();
    M.filaPalazzi({ lato: -1, z0: 0, ...(colori ? { colori } : {}) }); M.filaPalazzi({ lato: 1, z0: protagonista ? protagonista[1] : 0, ...(colori ? { colori } : {}) });
    if (neon) M.neon();
    if (insegne) M.insegneAppese(parole ? { parole } : {}); if (vetrine) M.vetrine(); if (cavi) M.cavi(); if (furgone) M.furgone();
    if (strisce !== false && strisce !== null) { M.strisce({ z: strisce }); if (folla) { M.follaAttraversa({ z: strisce }); M.follaFerma(); } }
    if (lampioni) M.lampioni(); };
  return M;
}

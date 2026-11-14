// Personaggi 3D (engine3d/personaggi3d/*.glb, forme fatte in Blender da genera_personaggi.py) DISEGNATI dal motore:
// - colore pieno a tre bande di luce (niente lucido), contorno scuro spesso (guscio rovesciato) + filo di luce bianca dove arriva la luce vera
// - faccia modellata in Blender con shape key (viso.py): espressioni, bocca che parla (visemi), sguardo, battito; i GLB vecchi usano ancora la faccia dipinta su tela
// - testa che gira da sola; braccia e gambe a due pezzi (ginocchio, gomito) che raggiungono punti veri: seduta, passi, mani sugli oggetti
import * as THREE from 'three';
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
import { posaClip } from '/web/animazioni.js';
const INK = '#2b1c20', cache = {};
let catalogo = null;
let preset = null;
async function pres() { if (!preset) preset = await (await fetch('/personaggi3d/espressioni.json')).json(); return preset; }
async function cat() { if (!catalogo) catalogo = await (await fetch('/personaggi3d/catalogo.json')).json(); return catalogo; }

// Stile del reference: colori smorzati da vestito, pelle crema, ombra morbida (niente bande nette né lucido), contorno bruno, vestiti disegnati sul corpo a sacco.
const PELLE = '#efe5d3', vestiti = {};
const rampa = (() => { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 14, 14, 14, 255, 46, 46, 46, 255, 84, 84, 84, 255, 116, 116, 116, 255, 134, 134, 134, 255]), 8, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
function smorza(c, n) { if (n === 'pelle') return new THREE.Color(PELLE); const h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, h.s * (n === 'capelli' ? 0.8 : 0.6), Math.min(0.8, h.l * 0.92 + 0.03)); }
function colore(c0, k = {}) { const c = new THREE.Color(c0), m = new THREE.MeshToonMaterial({ color: c, gradientMap: rampa, emissive: c.clone(), emissiveIntensity: k.e ?? 0.46, vertexColors: !!k.vc });
  if (k.vc) m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif'); };
  return m; }
function guscio(w) { const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });   // contorno: la stessa forma, gonfiata e vista da dentro
  m.onBeforeCompile = sh => { sh.uniforms.gw = { value: w }; sh.vertexShader = 'uniform float gw;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * gw;'); };
  return m; }
// ombra morbida dipinta nei vertici: più scuro in basso e su un lato
function sfuma(geo) { if (geo.attributes.color) return; geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, h = (b.max.y - b.min.y) || 1, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const u = (p.getY(i) - b.min.y) / h, k = (0.7 + 0.3 * u * u * (3 - 2 * u)) * (p.getX(i) < 0 ? 0.95 : 1); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
// corpo a sacco (spalle strette, fondo largo) + pelle sottile davanti su cui si disegna il vestito
function sacco(geo) { if (geo.userData.sacco) return geo.userData.sacco; geo.computeBoundingBox(); let b = geo.boundingBox; const p = geo.attributes.position, hy = (b.max.y - b.min.y) || 1;
  for (let i = 0; i < p.count; i++) { const u = (p.getY(i) - b.min.y) / hy, k = 1.1 - 0.42 * u * u; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); b = geo.boundingBox;
  const n = geo.attributes.normal, ix = geo.index ? geo.index.array : null, cnt = ix ? ix.length : p.count, fr = [], pos = new Float32Array(p.count * 3), uv = new Float32Array(p.count * 2);
  for (let i = 0; i + 2 < cnt; i += 3) { const a = ix ? ix[i] : i, b2 = ix ? ix[i + 1] : i + 1, c = ix ? ix[i + 2] : i + 2; if (n.getZ(a) > 0.1 && n.getZ(b2) > 0.1 && n.getZ(c) > 0.1) fr.push(a, b2, c); }
  for (let i = 0; i < p.count; i++) { pos[i * 3] = p.getX(i) + n.getX(i) * 0.006; pos[i * 3 + 1] = p.getY(i) + n.getY(i) * 0.006; pos[i * 3 + 2] = p.getZ(i) + n.getZ(i) * 0.006; uv[i * 2] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x); uv[i * 2 + 1] = (p.getY(i) - b.min.y) / hy; }
  const d = new THREE.BufferGeometry(); d.setAttribute('position', new THREE.BufferAttribute(pos, 3)); d.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); d.setIndex(fr); return (geo.userData.sacco = d); }
function vestito(nome) { if (vestiti[nome]) return vestiti[nome];
  const cv = document.createElement('canvas'), W = cv.width = 256, H = cv.height = 320, g = cv.getContext('2d'), X = v => v * W, Yv = v => v * H;
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 6;
  const L = (...q) => { g.beginPath(); q.forEach(([x, y], i) => i ? g.lineTo(X(x), Yv(y)) : g.moveTo(X(x), Yv(y))); }, dot = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(X(x), Yv(y), r, 0, 7); g.fill(); g.stroke(); };
  const chiaro = '#efe8d8', rosso = '#b8342f', oro = '#e2b84a', t = /impiegato|commesso/.test(nome) ? 'giacca' : /nonn/.test(nome) ? 'cardigan' : /poliziotto/.test(nome) ? 'divisa' : /duro/.test(nome) ? 'felpa' : 'maglia';
  if (t === 'giacca') { L([.36, .1], [.5, .5], [.64, .1]); g.closePath(); g.fillStyle = chiaro; g.fill(); g.stroke();
    if (/commesso/.test(nome)) { for (const s of [-1, 1]) { L([.5, .2], [.5 + s * .1, .14], [.5 + s * .1, .26]); g.closePath(); g.fillStyle = rosso; g.fill(); g.stroke(); } }
    else { L([.5, .14], [.55, .22], [.5, .47], [.45, .22]); g.closePath(); g.fillStyle = rosso; g.fill(); g.stroke(); }
    L([.5, .5], [.5, .95]); g.stroke(); dot(.56, .62, 5, chiaro); dot(.56, .76, 5, chiaro); L([.68, .5], [.82, .5]); g.stroke(); }
  else if (t === 'cardigan') { L([.38, .1], [.5, .3], [.62, .1]); g.closePath(); g.fillStyle = chiaro; g.fill(); g.stroke(); L([.5, .3], [.5, .95]); g.stroke(); for (const y of [.42, .58, .74]) dot(.56, y, 5, oro); for (const x of [.2, .67]) g.strokeRect(X(x), Yv(.68), X(.13), Yv(.1)); }
  else if (t === 'divisa') { L([.4, .1], [.5, .24], [.6, .1]); g.stroke(); L([.5, .24], [.5, .7]); g.stroke(); for (const y of [.34, .46, .58]) dot(.5, y, 5, oro); g.fillStyle = '#231a22'; g.fillRect(0, Yv(.72), W, Yv(.07)); g.fillStyle = oro; g.fillRect(X(.45), Yv(.725), X(.1), Yv(.06)); g.strokeRect(X(.45), Yv(.725), X(.1), Yv(.06)); dot(.3, .36, 9, oro); }
  else if (t === 'felpa') { L([.36, .1], [.5, .26], [.64, .1]); g.stroke(); L([.5, .26], [.5, .95]); g.stroke(); L([.44, .26], [.43, .42]); g.stroke(); L([.56, .26], [.57, .42]); g.stroke(); L([.26, .8], [.34, .64], [.66, .64], [.74, .8]); g.stroke(); }
  else { g.beginPath(); g.arc(X(.5), Yv(.08), X(.14), 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); g.fillStyle = 'rgba(255,255,255,.32)'; g.fillRect(0, Yv(.4), W, Yv(.1)); g.fillRect(0, Yv(.56), W, Yv(.05));
    if (/turista/.test(nome)) { L([.3, .1], [.44, .5]); g.stroke(); L([.7, .1], [.56, .5]); g.stroke(); g.fillStyle = '#2a2430'; g.fillRect(X(.38), Yv(.48), X(.24), Yv(.14)); g.strokeRect(X(.38), Yv(.48), X(.24), Yv(.14)); dot(.5, .55, 9, '#8fb6d8'); } }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return (vestiti[nome] = tx); }

// ---- faccia a tratti (tela trasparente sopra la testa): occhi a punto, sopracciglia corte, bocca piccola
export function dipingiFaccia(g, W, o = {}) {
  const f = o.faccia || 'neutro', gx = (o.guarda || 0) * W * 0.03;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, W); g.translate(W * 0.5, W * 0.55); g.scale(1.2, 1.2); g.translate(-W * 0.5, -W * 0.55); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = INK;
  const ey = W * 0.5, ex = [W * 0.3, W * 0.7], er = W * (f === 'sorpreso' ? 0.062 : 0.048), lw = W * 0.03;
  if (o.occhiali_sole) {
    for (const x of ex) { g.fillStyle = '#17121d'; g.beginPath(); g.ellipse(x, ey, W * 0.13, W * 0.092, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(x - W * 0.05, ey - W * 0.035, W * 0.03, W * 0.014, -0.5, 0, 7); g.fill(); }
    g.lineWidth = lw; g.beginPath(); g.moveTo(ex[0] + W * 0.12, ey - W * 0.02); g.lineTo(ex[1] - W * 0.12, ey - W * 0.02); g.stroke();
  } else {
    for (const x of ex) { g.fillStyle = INK; g.lineWidth = lw;
      if (o.chiusi) { g.beginPath(); g.moveTo(x - er * 1.3, ey); g.lineTo(x + er * 1.3, ey); g.stroke(); }
      else if (f === 'sorriso' || f === 'felice') { g.beginPath(); g.arc(x, ey + er * 0.9, er * 1.25, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
      else if (f === 'annoiato' || f === 'furbo') { g.beginPath(); g.moveTo(x - er * 1.5, ey - er * 0.2); g.lineTo(x + er * 1.5, ey - er * 0.2); g.stroke(); g.beginPath(); g.arc(x + gx, ey, er * 0.95, 0, Math.PI); g.fill(); }
      else { g.beginPath(); g.arc(x + gx, ey, er, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + gx - er * 0.35, ey - er * 0.35, er * 0.28, 0, 7); g.fill(); }
    }
    if (o.occhiali) { g.lineWidth = W * 0.02; g.fillStyle = 'rgba(255,255,255,.22)'; for (const x of ex) { g.beginPath(); g.arc(x, ey, W * 0.115, 0, 7); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(ex[0] + W * 0.115, ey); g.lineTo(ex[1] - W * 0.115, ey); g.stroke(); }
  }
  g.fillStyle = 'rgba(238,120,112,.3)'; for (const [i, x] of ex.entries()) { g.beginPath(); g.ellipse(x + (i ? 1 : -1) * W * 0.035, ey + W * 0.135, W * 0.07, W * 0.042, 0, 0, 7); g.fill(); } g.fillStyle = INK;
  g.lineWidth = lw * 1.1; const by = ey - W * (o.occhiali || o.occhiali_sole ? 0.17 : 0.13) - (f === 'sorpreso' ? W * 0.03 : 0);   // sopracciglia
  for (const [i, x] of ex.entries()) { const s = i ? 1 : -1, tilt = f === 'arrabbiato' ? 0.045 : f === 'triste' ? -0.045 : f === 'furbo' && i ? -0.04 : f === 'annoiato' ? -0.012 : 0;
    g.beginPath(); g.moveTo(x - W * 0.07, by - s * tilt * W); g.lineTo(x + W * 0.07, by + s * tilt * W); g.stroke(); }
  const my = W * 0.73, mx = W * 0.5 + gx * 0.5; g.lineWidth = lw; g.beginPath();   // bocca
  if (f === 'sorriso' || f === 'felice') { g.arc(mx, my - W * 0.07, W * 0.11, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke(); if (f === 'felice') { g.fillStyle = '#ffffff'; g.fill(); g.stroke(); } }
  else if (f === 'furbo') { g.moveTo(mx - W * 0.08, my); g.quadraticCurveTo(mx + W * 0.03, my + W * 0.04, mx + W * 0.1, my - W * 0.045); g.stroke(); }
  else if (f === 'sorpreso') { g.ellipse(mx, my, W * 0.035, W * 0.05, 0, 0, 7); g.fill(); }
  else if (f === 'triste' || f === 'arrabbiato') { g.arc(mx, my + W * 0.07, W * 0.085, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); }
  else { g.moveTo(mx - W * 0.075, my); g.lineTo(mx + W * 0.075, my); g.stroke(); }
}

// ---- arti a due pezzi: il giunto (ginocchio, gomito) si calcola da dove sta l'attacco e dove deve arrivare la punta
const GEO = { c: new THREE.CylinderGeometry(1, 1, 1, 8), s: new THREE.SphereGeometry(1, 12, 9) }, Y = new THREE.Vector3(0, 1, 0), v1 = new THREE.Vector3();
function arto(parent, r, mat, fine) { const a = new THREE.Mesh(GEO.c, mat), b = new THREE.Mesh(GEO.c, mat), j = new THREE.Mesh(GEO.s, mat); j.scale.setScalar(r);
  for (const o of [a, b, j, fine]) { o.castShadow = true; parent.add(o); } return { a, b, j, fine, r }; }
function tratto(m, A, B, r) { v1.subVectors(B, A); const L = v1.length() || 1e-4; m.position.addVectors(A, B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, v1.divideScalar(L)); m.scale.set(r, L, r); }
function piega(A, B, l1, l2, polo) { const d = new THREE.Vector3().subVectors(B, A); let L = d.length(); const mx = (l1 + l2) * 0.995;
  if (L > mx) { d.multiplyScalar(mx / L); B.copy(A).add(d); L = mx; } if (L < 1e-4) { d.set(0, -1e-4, 0); L = 1e-4; }
  const a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)); d.divideScalar(L);
  const p = polo.clone().addScaledVector(d, -polo.dot(d)); if (p.lengthSq() < 1e-6) p.set(0, 0, 1); p.normalize();
  return new THREE.Vector3().copy(A).addScaledVector(d, a).addScaledVector(p, h); }
function posaArto(l, A, B, l1, l2, polo) { const J = piega(A, B, l1, l2, polo); tratto(l.a, A, J, l.r); tratto(l.b, J, B, l.r); l.j.position.copy(J); l.fine.position.copy(B); return J; }

export async function creaPersonaggio3D(root, nome, opt = {}) {
  if (globalThis.RICK_COMPARSA) return globalThis.RICK_COMPARSA(root, nome, opt);   // storia con "personaggi": "rick" (storia_disegnato.js)
  const C = (await cat())[nome]; if (!C) throw new Error('personaggio 3D sconosciuto: ' + nome + ' (vedi engine3d/personaggi3d/catalogo.json)');
  if (!cache[nome]) cache[nome] = (await new GLTFLoader().loadAsync('/personaggi3d/' + C.file)).scene;
  const g = cache[nome].clone(true), P = {}, mats = {}, col = {};
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const ft = new THREE.CanvasTexture(cv); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 8; ft.flipY = false;   // le UV del GLB (Blender) hanno v rovesciato: senza questo la faccia esce capovolta
  g.traverse(o => { if (o.name) P[o.name] = o; if (o.isMesh) col[o.material.name] = col[o.material.name] || smorza(o.material.color, o.material.name); });
  const om = P.omino || g, artiVecchi = ['anca_L', 'anca_R', 'spalla_L', 'spalla_R'].map(n => P[n]).filter(Boolean), gusci = [], viso = [];
  g.traverse(o => { if (!o.isMesh) return; let q = o; while (q && !artiVecchi.includes(q)) q = q.parent; if (q) return;   // gli arti del modello si sostituiscono con quelli a due pezzi
    if (o.name.startsWith('viso_') || (o.material && o.material.name.startsWith('viso_'))) { viso.push(o); return; }   // faccia con shape key (viso.py)
    const n = o.material.name;
    if (n === 'faccia') { o.material = new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); o.userData.ombra = true; o.renderOrder = 3; return; }
    if (o.name === 'corpo') sacco(o.geometry);
    sfuma(o.geometry); mats[n] = mats[n] || colore(col[n], { vc: true }); o.material = mats[n]; o.castShadow = true; o.receiveShadow = true; gusci.push(o); });
  const PR = viso.length ? await pres() : null, VL = { viso_guancia: 3, viso_sclera: 4, viso_bocca: 4, viso_denti: 5, viso_inchiostro: 6, viso_vetro: 7, viso_lenti: 8, viso_riflesso: 9 };
  for (const o of viso) { const mn = o.material.name, v = VL[mn] || 6;   // inchiostro, bocca, occhiali… sono tinte piatte, una sopra l'altra per livello
    o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(PR.materiali[mn] || '#3a2a2e'), side: THREE.DoubleSide, transparent: mn === 'viso_guancia' || mn === 'viso_vetro', opacity: mn === 'viso_guancia' ? 0.4 : mn === 'viso_vetro' ? 0.16 : 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -v, polygonOffsetUnits: -v });
    o.renderOrder = v; o.userData.ombra = true; o.castShadow = o.receiveShadow = false; }
  const V = { cur: 'neutro', prev: 'neutro', tcur: -9, tlast: -9 }, SEQ = ['A', 'E', 'O', 'A', 'MBP', 'E', 'U', 'A', 'FV', 'O'];
  const risolvi = n => { n = PR.alias[n] || n || 'neutro'; return PR.espressioni[n] ? n : 'neutro'; };
  const faccia3d = (s, t, sem) => {   // espressione + battito + sguardo + bocca che parla = peso delle shape key
    const e = risolvi(s.faccia ?? opt.faccia);
    if (e !== V.cur) { if (t - V.tlast > 0.25 || t < V.tlast) V.prev = e, V.tcur = t - 1; else V.prev = V.cur, V.tcur = t; V.cur = e; }   // dissolvenza di 0,14 s (salto netto se i fotogrammi non sono consecutivi)
    V.tlast = t; const k = Math.min(1, (t - V.tcur) / 0.14), w = k * k * (3 - 2 * k), W = {};
    if (V.cur !== 'neutro') W['e_' + V.cur] = w; if (V.prev !== V.cur && V.prev !== 'neutro') W['e_' + V.prev] = 1 - w;
    const ph = (t * 0.9 + sem * 0.713) % 3.4, occhiChiusi = (PR.espressioni[V.cur].chiusi ? w : 0);
    W.b_blink = (ph < 0.14 ? Math.sin(ph / 0.14 * Math.PI) : 0) * (1 - occhiChiusi);
    const gx = Math.max(-1, Math.min(1, (s.guarda || 0) * 0.9)); if (gx > 0) W.g_dx = gx; else if (gx < 0) W.g_sx = -gx;
    if (s.sguardo === 'su') W.g_su = 1; else if (s.sguardo === 'giu') W.g_giu = 1;
    if (s.parla) { const x = t * 9 + sem, f = x % 1; W['v_' + SEQ[Math.floor(x) % SEQ.length]] = 0.95 * Math.pow(Math.sin(Math.PI * f), 0.7); }
    for (const o of viso) { const d = o.morphTargetDictionary, inf = o.morphTargetInfluences; if (!d) continue; for (const n in d) inf[d[n]] = W[n] || 0; } };
  const gm = guscio(0.02); for (const o of gusci) { const h = new THREE.Mesh(o.geometry, gm); h.castShadow = h.receiveShadow = false; o.add(h); }
  if (P.corpo && P.corpo.isMesh) { const d = new THREE.Mesh(sacco(P.corpo.geometry), new THREE.MeshBasicMaterial({ map: vestito(nome), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); d.userData.ombra = true; d.renderOrder = 2; P.corpo.add(d); }
  for (const a of artiVecchi) a.visible = false;
  // testa che gira: testa, faccia, capelli e ciò che sta sopra il collo vanno in un gruppo con il perno al centro della testa
  const ov = new THREE.Group(); ov.add(g); root.add(ov); ov.updateMatrixWorld(true);
  const tg = new THREE.Group(), ty = P.testa ? P.testa.position.y : 1.64; tg.position.set(0, ty, 0); om.add(tg); tg.updateMatrixWorld(true);
  for (const o of [...om.children]) if (o !== tg && !artiVecchi.includes(o) && o.name !== 'corpo' && o.position.y > ty - 0.3) tg.attach(o);
  for (const o of om.children) if (o !== tg && o !== P.corpo && !artiVecchi.includes(o)) o.visible = false;   // cravatte, cinture e simili ora sono disegnati sul vestito
  if (col.capelli && C.capelli !== 'pelato') { const nuca = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18, Math.PI - 0.5, Math.PI + 1.0, 0, 2.3), colore(col.capelli));   // capelli su tutta la nuca
    nuca.scale.set(0.425, 0.45, 0.405); nuca.castShadow = true; nuca.add(new THREE.Mesh(nuca.geometry, guscio(0.04))); tg.add(nuca); }
  tg.scale.set(1.1, 0.93, 1.02);   // testa più larga che alta, come nel reference
  // arti nuovi: sottili e bruni, mani crema
  const hip = P.anca_L ? Math.abs(P.anca_L.position.x) : 0.14, ancaY = P.anca_L ? P.anca_L.position.y : 0.51, spX = Math.min(0.2, P.spalla_L ? Math.abs(P.spalla_L.position.x) : 0.3), spY = (P.spalla_L ? P.spalla_L.position.y : 1.07) + 0.02;
  const FR = 0.05, lg = (ancaY - FR) * 0.51, lb = 0.31, mG = colore('#3a2a2c', { e: 0.35 }), mB = mG, mP = colore(PELLE);
  const piede = () => { const m = new THREE.Mesh(GEO.s, mG); m.scale.set(0.055, 0.045, 0.085); return m; }, mano = () => { const m = new THREE.Mesh(GEO.s, mP); m.scale.setScalar(0.05); const h = new THREE.Mesh(GEO.s, guscio(0.22)); m.add(h); return m; };
  const A = [-1, 1].map(sx => ({ sx, gamba: arto(om, 0.026, mG, piede()), braccio: arto(om, 0.022, mB, mano()) }));
  const H = new THREE.Vector3(), F = new THREE.Vector3(), S = new THREE.Vector3(), B = new THREE.Vector3(), polo = new THREE.Vector3(), st = { key: '' };
  const stato = s => {   // s: { faccia, guarda, posa, passo, t, testa (giro della testa, rad), gesto: 'saluta', mani: [[x,y,z], …] punti del mondo da toccare }
    const t = s.t || 0, sem = opt.seme || 0, chiusi = ((t * 0.9 + sem * 0.713) % 3.4) < 0.1;
    const fo = { faccia: s.faccia ?? opt.faccia, guarda: s.guarda || 0, occhiali: C.occhiali, occhiali_sole: C.occhiali_sole, chiusi }, k = JSON.stringify(fo);
    if (viso.length) faccia3d(s, t, sem); else if (k !== st.key) { st.key = k; dipingiFaccia(cv.getContext('2d'), 512, fo); ft.needsUpdate = true; }
    const PA = s.clip ? posaClip(s.clip, s.clipT ?? (t - (s.clipDa || 0))) : null;   // animazione vera (animazioni.js): mani e piedi dal clip
    const seduto = s.posa === 'seduto', walk = s.posa === 'cammina', ph = (s.passo || 0) * Math.PI * 2, sc = ov.scale.y || 1;
    const gy = seduto ? (opt.seduta ?? 0.62) / sc - ancaY + 0.02 : walk ? -Math.abs(Math.sin(ph)) * 0.035 : 0;
    g.position.y = gy + (PA && !seduto ? (PA.bacino - 1) * ancaY : 0); if (PA) g.rotation.x = Math.max(-.4, Math.min(.5, PA.avanti * .8)); g.rotation.x = walk ? 0.07 : seduto && s.mani ? 0.1 : 0; g.scale.set(1, 1 + Math.sin(t * 2.1 + sem) * 0.01, 1);   if (!walk) { g.rotation.z = Math.sin(t * 0.7 + sem * 2.3) * 0.012; g.position.x = Math.sin(t * 0.5 + sem) * 0.012; }   // peso che passa da un piede all'altro   // respiro
    const vaga = s.testa ?? (walk ? 0 : Math.sin(t * 0.43 + sem * 1.9) * 0.2 * (0.6 + 0.4 * Math.sin(t * 0.17 + sem)) + Math.sin(t * 1.3 + sem) * 0.04);   // non sta mai fermo: la testa si gira piano a guardarsi attorno
    tg.rotation.set(walk ? -0.05 : 0, vaga, Math.sin(t * 1.1 + sem) * 0.035 + (walk ? Math.sin(ph * 2) * 0.025 : 0));
    ov.updateMatrixWorld(true);
    const terra = -gy + FR, pt = (s.mani || []).map(p => om.worldToLocal(new THREE.Vector3(...p))).sort((a, b) => a.x - b.x);
    for (const a of A) { const sx = a.sx; H.set(sx * hip, ancaY, 0);
      if (PA) { const q = PA.piedi[sx > 0 ? 'L' : 'R'], k = lg * 2; F.set(H.x + q.x * k * .6, Math.max(terra, H.y + q.y * k), q.z * k); polo.set(0, 0, 1); }
      else if (seduto) { const pend = H.y - lg * 0.98, fy = Math.max(terra, pend), basso = fy > pend + 0.01;   // seduta bassa: piedi a terra e ginocchia su; seduta alta: le gambe pendono
        F.set(H.x * (basso ? 1.3 : 1.05), fy, basso ? Math.sqrt(Math.max(0.01, lg * lg * 3.6 - (H.y - fy) ** 2)) * 0.75 : lg * 0.96 + Math.sin(t * 1.7 + sx + sem) * 0.02); polo.set(0, 1, 0.4); }
      else if (walk) { const p = ph + (sx > 0 ? Math.PI : 0); F.set(H.x, terra + Math.max(0, Math.cos(p)) * 0.07, Math.sin(p) * 0.17); polo.set(0, 0.15, 1); }
      else { F.set(H.x, terra, 0.01); polo.set(0, 0, 1); }
      posaArto(a.gamba, H, F, lg, lg, polo); a.gamba.fine.position.z += 0.03;
      S.set(sx * spX, spY, 0); const tocca = pt.length > 1 ? pt[sx < 0 ? 0 : 1] : pt.length === 1 && Math.sign(pt[0].x || 1) === sx ? pt[0] : null;
      if (PA && !tocca) { const q = PA.mani[sx > 0 ? 'L' : 'R'], k = lb * 2; B.set(S.x + q.x * k, S.y + q.y * k, S.z + q.z * k); polo.set(sx * 0.4, -0.4, -1); }
      else if (tocca) { B.copy(tocca); polo.set(sx * 0.5, -1, -0.3); }
      else if (s.gesto === 'saluta' && sx > 0) { B.set(sx * (spX + 0.2 + Math.sin(t * 9) * 0.07), spY + 0.42, 0.12); polo.set(sx, -0.5, -0.2); }
      else if (seduto) { B.set(sx * (hip + 0.04), ancaY + 0.09, lg * 0.75); polo.set(sx * 0.8, -0.2, -1); }
      else if (walk) { const p = ph + (sx > 0 ? 0 : Math.PI); B.set(sx * (spX + 0.06), spY - lb * 1.8, Math.sin(p) * 0.2); polo.set(sx * 0.3, 0, -1); }
      else { B.set(sx * (spX + 0.07), spY - lb * 1.93, 0.02 + Math.sin(t * 1.3 + sx) * 0.015); polo.set(sx * 0.3, 0, -1); }
      posaArto(a.braccio, S, B, lb, lb, polo); }
  };
  stato({ posa: 'fermo', t: 0 });
  return { obj: ov, stato, info: C };
}

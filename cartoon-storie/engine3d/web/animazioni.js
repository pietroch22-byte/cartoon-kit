// Animazioni vere (librerie CC0 di library/animati: UAL1, UAL2) trasferite sui nostri omini 3D.
// Si suona il clip su uno scheletro nascosto, si leggono le posizioni di bacino, mani e piedi, e si portano sulle proporzioni dell'omino
// (testa grande, gambe corte): le braccia e le gambe a due pezzi di personaggi3d.js raggiungono quei punti. Tempo deterministico.
// Nella storia: azione { "t": "@parola", "clip": "Idle_Talking_Loop" } (nome esatto o parte del nome: vedi library/animati/catalogo.json); "clip": null la toglie.
// NON ANCORA PROVATO sul render (11/11): da verificare orientamento (fronte del manichino) e scale sui primi video.
import * as THREE from 'three';
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
const LIB = {
  ual1: { file: '/animati/ual1.glb', b: { bacino: 'DEF-hips', testa: 'DEF-head', collo: 'DEF-neck', manoL: 'DEF-hand.L', manoR: 'DEF-hand.R', piedeL: 'DEF-foot.L', piedeR: 'DEF-foot.R', spallaL: 'DEF-upper_arm.L', spallaR: 'DEF-upper_arm.R', ancaL: 'DEF-thigh.L', ancaR: 'DEF-thigh.R' } },
  ual2: { file: '/animati/ual2.glb', b: { bacino: 'pelvis', testa: 'Head', collo: 'neck_01', manoL: 'hand_l', manoR: 'hand_r', piedeL: 'foot_l', piedeR: 'foot_r', spallaL: 'upperarm_l', spallaR: 'upperarm_r', ancaL: 'thigh_l', ancaR: 'thigh_r' } },
};
const R = {};   // libreria caricata: { scena, mixer, clip: {nome: AnimationClip}, ossa: {chiave: Bone}, riposo }
export async function preparaClip(nomi) {   // carica le librerie che contengono i clip usati dalla storia (prima del primo fotogramma)
  for (const [k, L] of Object.entries(LIB)) { if (R[k]) continue; const g = await new GLTFLoader().loadAsync(L.file); const sc = g.scene, ossa = {};
    sc.traverse(o => { for (const [c, n] of Object.entries(L.b)) if (o.name === n || o.name === n.replace(/\./g, '')) ossa[c] = o; });
    const clip = {}; for (const a of g.animations) clip[a.name] = a; R[k] = { sc, mixer: new THREE.AnimationMixer(sc), clip, ossa, azione: null, nome: null };
    const tp = g.animations.find(a => /tpose/i.test(a.name)); if (tp) { const r = R[k]; r.mixer.clipAction(tp).play(); r.mixer.setTime(0); sc.updateMatrixWorld(true); r.riposo = leggi(r); r.mixer.stopAllAction(); } }
  return nomi.filter(n => !trova(n)); }   // clip non trovati
function trova(nome) { if (!nome) return null; for (const [k, r] of Object.entries(R)) { const c = r.clip[nome] || Object.values(r.clip).find(a => a.name.toLowerCase().includes(String(nome).toLowerCase())); if (c) return [r, c]; } return null; }
const V = () => new THREE.Vector3();
function leggi(r) { const p = {}; for (const [c, o] of Object.entries(r.ossa)) p[c] = o.getWorldPosition(V()); return p; }
// posa normalizzata: tutto relativo al punto a terra sotto il bacino, diviso per l'altezza del bacino a riposo (gambe) o per la lunghezza del braccio (braccia)
export function posaClip(nome, t) { const f = trova(nome); if (!f) return null; const [r, c] = f;
  if (r.nome !== c.name) { r.mixer.stopAllAction(); r.azione = r.mixer.clipAction(c); r.azione.play(); r.nome = c.name; }
  r.mixer.setTime(((t % c.duration) + c.duration) % c.duration); r.sc.updateMatrixWorld(true); const p = leggi(r), q = r.riposo || p;
  const hb = Math.max(.1, q.bacino.y), braccio = Math.max(.1, q.spallaL.distanceTo(q.manoL)), base = new THREE.Vector3(p.bacino.x, 0, p.bacino.z);
  const rel = (a, o, k) => a.clone().sub(o).divideScalar(k);
  return { bacino: p.bacino.y / hb, avanti: (p.collo ? (p.collo.z - p.bacino.z) : 0) / hb,
    mani: { L: rel(p.manoL, p.spallaL, braccio), R: rel(p.manoR, p.spallaR, braccio) }, piedi: { L: rel(p.piedeL, p.ancaL, hb), R: rel(p.piedeR, p.ancaR, hb) }, base: rel(p.bacino, base, hb) }; }

// Carica un meccanismo dall'archivio library/vivi/ (porte, ventilatori, condizionatori…) e lo veste col look «disegnato».
// Uso nello script di un luogo:  OBJ.porta = await vivo(M, 'porta_scorrevole', { x: 0, z: -4, ry: 0, id: 'porta' })
// Il movimento lo decide il GLB (vedi library/vivi/genera_vivi.py) e lo esegue engine3d/web/vivo.js: niente altro da scrivere.
// opzioni: x y z ry s (scala), colori: { materiale: '#hex' } per ricolorare (es. { corpo: '#c8a03a' }).
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
const cache = {};
export async function vivo(M, nome, { x = 0, y = 0, z = 0, ry = 0, s = 1, colori = {} } = {}) {
  if (!cache[nome]) cache[nome] = (await new GLTFLoader().loadAsync('/vivi/' + nome + '.glb')).scene;
  const g = cache[nome].clone(true), mm = {}; g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  g.traverse(o => { if (!o.isMesh) return; const n = o.material.name, c = colori[n] || '#' + o.material.color.getHexString();
    if (!mm[n + c]) mm[n + c] = n === 'vetro' ? new M.THREE.MeshStandardMaterial({ color: c, roughness: .05, transparent: true, opacity: .22, emissive: c, emissiveIntensity: .1, depthWrite: false })
      : n.startsWith('luce') ? M.emi(c, 2.2) : (() => { const isMet = n === 'metallo' || n === 'oro' || n === 'ferro'; const isGem = n === 'gemma'; const m = M.std(c, isGem ? .18 : isMet ? .3 : .65, isMet ? .5 : isGem ? .15 : 0); m.emissive.set(c); m.emissiveIntensity = isGem ? .55 : n === 'interno' ? 0 : .22; return m; })();
    o.material = mm[n + c]; o.castShadow = n !== 'vetro'; o.receiveShadow = n !== 'vetro'; });
  M.root.add(g); return g;
}

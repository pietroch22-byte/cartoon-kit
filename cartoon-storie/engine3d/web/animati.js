// Modelli GIÀ ANIMATI dall'archivio library/animati (animali di Quaternius, CC0; personaggi KayKit; librerie di animazioni UAL1/UAL2).
// Uso nello script di un luogo:  const gatto = await animato(M, 'Cat', { x, z, ry, s: .5, anim: 'Walking', vel: 1 })
// anim = parte del nome del clip (Idle, Walk, Walking, Run, Jump, Flying…: vedi library/animati/catalogo.json). Il tempo segue la storia (stesso fotogramma = stessa posa).
// alt: altezza in metri (consigliato: i modelli hanno scale diverse). Gatto ~0,3, cane ~0,45, aquila ~0,4 di apertura… 
// percorso: [[x, z], …] + passo (m/s) = cammina avanti e indietro lungo i punti girandosi nella direzione giusta.
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
import { clone as cloneSk } from '/lib/jsm/utils/SkeletonUtils.js';
const cache = {};
// colori di base quando il modello non li ha (i nomi dei materiali dicono il colore): sempre sovrascrivibili con `colori`
const NOMI = { grey: '#8f8a86', gray: '#8f8a86', white: '#efe8dc', pink: '#e89aa0', black: '#2a2328', brown: '#8a5a3a', orange: '#e8862a', yellow: '#f2c230', dog: '#c89a62', wings: '#6a4a32', head: '#f2ece0', beak: '#f2c230', claws: '#3a2a20', red: '#c2382f', green: '#4f8a5e', blue: '#3a6ac0' };
export async function animato(M, nome, { x = 0, y = 0, z = 0, ry = 0, s = 1, alt = null, anim = 'Idle', vel = 1, fase = 0, colori = {}, percorso = null, passo = 0.6 } = {}) {
  const T = M.THREE; if (!cache[nome]) cache[nome] = await new GLTFLoader().loadAsync('/animati/' + nome + '.glb');
  const G = cache[nome], g = cloneSk(G.scene), mm = {}; g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  g.traverse(o => { if (!o.isMesh) return; const n = o.material.name, grigio = o.material.color.r > .55 && Math.abs(o.material.color.r - o.material.color.b) < .02, c = colori[n] || (grigio && NOMI[n.toLowerCase()]) || '#' + o.material.color.getHexString();
    const k = n + c + (o.material.map ? o.material.map.uuid : '') + (o.geometry.attributes.color ? 'vc' : '');
    if (!mm[k]) { const m = M.std(c, .7); m.emissive.set(c); m.emissiveIntensity = .22; if (o.material.map) { m.map = o.material.map; m.emissiveMap = o.material.map; } if (o.geometry.attributes.color) m.vertexColors = true; mm[k] = m; }
    o.material = mm[k]; o.castShadow = true; o.frustumCulled = false; });
  if (alt) { g.scale.setScalar(1); g.updateMatrixWorld(true); const b = new T.Box3().setFromObject(g), h = (b.max.y - b.min.y) || 1; g.scale.setScalar(alt / h); }   // alt = altezza in metri
  const mixer = new T.AnimationMixer(g), clip = G.animations.find(a => a.name.toLowerCase().endsWith(anim.toLowerCase())) || G.animations.find(a => a.name.toLowerCase().includes(anim.toLowerCase())) || G.animations[0];
  if (clip) mixer.clipAction(clip).play();
  g.userData.vivo = 'animato'; M.root.add(g); M.tick = M.tick || [];
  let L = 0; const seg = []; if (percorso) for (let i = 0; i < percorso.length - 1; i++) { const [a, b] = [percorso[i], percorso[i + 1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, d]); L += d; }
  M.tick.push(t => { if (clip) mixer.setTime(((t * vel + fase) % clip.duration + clip.duration) % clip.duration);
    if (L > 0) { let u = ((t * passo) % (2 * L) + 2 * L) % (2 * L), indietro = u > L; if (indietro) u = 2 * L - u;
      for (const [a, b, d] of seg) { if (u <= d) { const k = u / d; g.position.x = a[0] + (b[0] - a[0]) * k; g.position.z = a[1] + (b[1] - a[1]) * k; g.rotation.y = Math.atan2((b[0] - a[0]) * (indietro ? -1 : 1), (b[1] - a[1]) * (indietro ? -1 : 1)); break; } u -= d; } } });
  return g;
}

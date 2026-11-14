// Carica i modelli fatti in Blender e li veste col look «disegnato»: colori pieni, grafiche dipinte, emissiva leggera, contorno del motore.
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
const INK = '#3a2a2e', cache = {};
export function vestiti(M) {
  const T = M.THREE, mat = (c, e = .22, r = .6, m = 0) => { const x = M.std(c, r, m); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  const pan = (w, h, fn, e = .5) => { const t = M.tex(w, h, (g, W, H) => { fn(g, W, H); g.strokeStyle = INK; g.lineWidth = Math.max(6, W / 70); g.strokeRect(3, 3, W - 6, H - 6); }); t.wrapT = T.RepeatWrapping; t.repeat.y = -1; return M.dipinto(t, e); };
  const vert = (g, W, H, txt, size, col, y0, dy) => { g.fillStyle = col; g.font = `900 ${size}px sans-serif`; g.textAlign = 'center'; [...txt].forEach((c, i) => g.fillText(c, W / 2, y0 + i * dy)); };
  return {
    corpo: mat('#2c2540', .18, .5), scuro: mat('#15121c', .1, .5), cromo: mat('#c9ced8', .14, .22, .7), oro: mat('#d3a443', .4, .35, .4),
    rosso: mat('#c2182b', .3, .4), giallo: mat('#f2c230', .32, .5), legno: mat('#8a5a3a', .25), corpo_chiaro: mat('#c9c6d2', .25, .6),
    vetro: new T.MeshStandardMaterial({ color: '#cfe6ff', roughness: .04, transparent: true, opacity: .18, emissive: '#8ab4ff', emissiveIntensity: .12 }),
    vetro_bottiglia: Object.assign(mat('#7a4a22', .35, .2), { transparent: true, opacity: .85 }),
    luce_calda: M.emi('#ffcf7a', 1.3), lampadina: M.emi('#fff2b8', 2.0), luce_rosa: M.emi('#ff4fb0', 2.4), luce_ciano: M.emi('#38e0ff', 2.4),
    pannello_etichetta: pan(256, 40, (g, W, H) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, W, H); g.fillStyle = '#c2182b'; g.font = `bold ${H * .7}px sans-serif`; g.textAlign = 'center'; g.fillText('パチンコ玉  ¥4', W / 2, H * .78); }, .45),
    pannello_pachinko: pan(220, 1024, (g, W, H) => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#ff3fa6'); q.addColorStop(1, '#c0157a'); g.fillStyle = q; g.fillRect(0, 0, W, H);
      vert(g, W, H, 'パチンコ', 120, '#fff7d0', 150, 130); vert(g, W, H, 'PACHINKO', 70, '#ffe14a', 650, 46); }, 1.3),
    pannello_prizehall: pan(1024, 180, (g, W, H) => { g.fillStyle = '#4a2a1a'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d3a443'; g.lineWidth = 8; g.strokeRect(18, 14, W - 36, H - 28);
      g.fillStyle = '#f3c860'; g.font = `bold ${H * .48}px serif`; g.textAlign = 'center'; g.fillText('PRIZE HALL', W / 2, H * .6); g.font = `${H * .15}px sans-serif`; g.fillText('PACHINKO  ·  SLOTS', W / 2, H * .85); }, .9),
    pannello_newmachines: pan(768, 200, (g, W, H) => { g.fillStyle = '#5a1f6a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd9f4'; g.textAlign = 'center'; g.font = `bold ${H * .4}px sans-serif`; g.fillText('新台入替', W / 2, H * .48); g.font = `bold ${H * .24}px sans-serif`; g.fillText('NEW MACHINES', W / 2, H * .85); }, 1.0),
    pannello_dentro: pan(256, 460, (g, W, H) => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#ffe7b0'); q.addColorStop(1, '#c46a3a'); g.fillStyle = q; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { g.fillStyle = ['#2a6ad0', '#ff4fa0', '#ffd23f'][i % 3]; g.fillRect(16 + i * 38, 120, 26, 70); g.fillStyle = '#1a1420'; g.fillRect(16 + i * 38, 190, 26, 110); } g.fillStyle = '#8a1a22'; g.fillRect(0, 330, W, H - 330); }, .45),
    pannello_locandina: pan(256, 520, (g, W, H) => { g.fillStyle = '#16205a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ff3b4a'; g.font = `900 ${H * .45}px sans-serif`; g.textAlign = 'center'; g.fillText('7', W / 2, H * .55); g.fillStyle = '#ffe14a'; g.font = `bold ${H * .08}px sans-serif`; g.fillText('大海物語', W / 2, H * .82); }, .8),
    pannello_interno: pan(512, 400, (g, W, H) => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#fff0c4'); q.addColorStop(1, '#e8a85a'); g.fillStyle = q; g.fillRect(0, 0, W, H);
      g.fillStyle = '#9a6a3a'; for (const y of [120, 240]) g.fillRect(0, y, W, 10); for (let i = 0; i < 10; i++) { g.fillStyle = ['#d03a3a', '#3a7ac0', '#f2c230', '#5aa05a'][i % 4]; g.fillRect(20 + i * 48, 70, 30, 50); g.fillRect(30 + i * 46, 190, 26, 50); }
      g.fillStyle = '#fffbe8'; g.fillRect(W * .62, 40, 120, 160); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(W * .62, 40, 120, 160); }, .55),
    pannello_gatto: pan(128, 128, (g, W, H) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8862a'; g.beginPath(); g.arc(30, 40, 22, 0, 7); g.fill(); g.fillStyle = '#2a2020'; g.beginPath(); g.arc(90, 80, 16, 0, 7); g.fill(); }, .5),
    pannello_open: pan(256, 120, (g, W, H) => { g.fillStyle = '#c2182b'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = `bold ${H * .6}px sans-serif`; g.textAlign = 'center'; g.fillText('OPEN', W / 2, H * .72); }, 1.2),
    pannello_avviso: pan(200, 280, (g, W, H) => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, W, H); g.fillStyle = '#555'; for (let i = 0; i < 9; i++) g.fillRect(20, 40 + i * 24, W - 40 - (i % 3) * 20, 8); }, .4),
    pannello_griglia: pan(256, 256, (g, W, H) => { g.fillStyle = '#9a98a6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#55536a'; g.lineWidth = 5; for (let i = 10; i < W; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); } }, .35),
  };
}
// carica un GLB (una volta) e ne restituisce una copia vestita; mat = materiali del look (anche sovrascrivibili)
export async function modello(M, V, nome, { x = 0, y = 0, z = 0, ry = 0, s = 1, mats = {} } = {}) {
  if (!cache[nome]) cache[nome] = (await new GLTFLoader().loadAsync('/scena/' + nome + '.glb')).scene;
  const g = cache[nome].clone(true); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  g.traverse(o => { if (!o.isMesh) return; const n = o.material.name, m = mats[n] || V[n]; if (m) o.material = m; o.castShadow = o.receiveShadow = n !== 'vetro'; });
  M.root.add(g); return g;
}

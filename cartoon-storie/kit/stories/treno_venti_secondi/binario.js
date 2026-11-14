// Binario della stazione di giorno: banchina, treno con porte scorrevoli vere (library/vivi), orologio digitale che conta i secondi, tabellone, piccioni.
// Banchina x -3..3, binario x 3.5..8 (più basso), treno lungo z; la camera guarda verso -z.
import { vivo } from '/web/vivi.js';
import * as ST from '/web/oggetti_stazione.js';   // treno, banchina, pensilina, cartelli, specchio: costruiti in three.js e riusabili
const PARTE = 17.7;   // «il treno parte» (secondi della voce)
export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE, mat = (c, e = .2, r = .7) => { const x = M.std(c, r); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  ST.banchina(M, { x0: -3.2, x1: 3.1, z0: 9, z1: -21 });
  M.box(5, .3, 30, mat('#5a5048', .12), 5.6, -1.3, -6); for (const x of [4.6, 6.6]) M.box(.12, .14, 30, mat('#9aa0b0', .2, .3), x, -1.08, -6);
  for (let z = 8; z > -21; z -= .7) M.box(2.6, .08, .25, mat('#6a4a32', .15), 5.6, -1.13, z);
  ST.pensilina(M, { x0: -2.9, x1: 2.4, z0: 7, z1: -19, h: 4.1 });
  ST.cartelloAppeso(M, { x: .2, y: 3.45, z: 1.5, testo: '1  TOKYO', sotto: '1番線 秋葉原方面' }); ST.cartelloAppeso(M, { x: -1.6, y: 3.45, z: -7, w: 1.3, testo: 'USCITA →', sotto: '出口', fondo: '#f2c230', colore: '#1a1a24' });
  ST.specchio(M, { x: 2.2, z: -9.5, y: 2.4, ry: -2.3 }); ST.altoparlante(M, { x: -.4, y: 3.85, z: -3.8, ry: .5 });
  for (const dz of [5, 0, -5]) ST.segniAttesa(M, { x: 2.0, z: -4 + dz });
  M.box(.3, 3.5, 30, mat('#b8ab98', .18), -3.35, 1.75, -6);   // muro di fondo della banchina
  // panchina, distributore, cestino, cartello della stazione
  M.box(1.8, .08, .5, mat('#8a5a3a', .25), -2.4, .48, -.5); M.box(1.8, .5, .06, mat('#8a5a3a', .25), -2.62, .75, -.5); for (const dz of [-.7, .7]) M.box(.08, .48, .45, mat('#3a3a48', .2), -2.4, .24, -.5 + dz);
  M.box(.9, 1.85, .7, mat('#2a6ad0', .32, .3), -2.75, .925, -6.2); M.box(.6, .8, .02, M.emi('#e8f4ff', 1.0), -2.39, 1.2, -6.2); M.box(.4, .6, .4, mat('#5a9a5a', .25), -2.8, .3, 1.8);
  M.pannello({ w: 2.4, h: .7, x: -.2, y: 3.4, z: -2.6, px: 512, emissiva: .5, dipingi: (g, W, H) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, H); g.fillStyle = '#1d3a8a'; g.font = `900 ${H * .4}px sans-serif`; g.textAlign = 'center'; g.fillText('南流山', W / 2, H * .5); g.font = `700 ${H * .2}px sans-serif`; g.fillText('MINAMI-NAGAREYAMA', W / 2, H * .82); } });
  // tabellone e orologio digitale che conta davvero i secondi (sulla voce: «venti» = 9:44:20)
  const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return [c, t]; };
  const [cv, tx] = tela(512, 256), tab = new T.Mesh(new T.PlaneGeometry(2.0, 1.0), new T.MeshBasicMaterial({ map: tx, toneMapped: false })); tab.position.set(-.2, 2.55, -2.6); M.root.add(tab);
  M.box(2.15, 1.15, .1, mat('#1a1a24', .1), -.2, 2.55, -2.67);
  let ultimo = '';
  M.tick = M.tick || []; M.tick.push(t => { const s = Math.floor(4.3 + t), mm = 44 + Math.floor(s / 60), ss = s % 60, ora = `9:${mm}:${String(ss).padStart(2, '0')}`, dopo = t > PARTE + .6, k = ora + dopo;
    if (k === ultimo) return; ultimo = k; const g = cv.getContext('2d'); g.fillStyle = '#10141e'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffb030'; g.font = '700 46px monospace'; g.textAlign = 'left'; g.fillText(dopo ? 'PROSSIMO' : 'PARTENZA', 24, 66); g.fillText(dopo ? '9:48:40' : '9:44:40', 290, 66);
    g.fillStyle = '#7cff9a'; g.font = '700 30px monospace'; g.fillText(dopo ? 'TRA 4 MINUTI' : 'PER TOKYO', 24, 120);
    g.fillStyle = '#ffffff'; g.font = '700 84px monospace'; g.textAlign = 'center'; g.fillText(ora, 256, 222); tx.needsUpdate = true; });
  // il treno (oggetti_stazione.js): cassa smussata, tetto, fasce, finestrini con riflesso, interni con sedili e maniglie, tre porte scorrevoli vere
  const TR = await ST.treno(M, { x: 5.1, z: -4, porte: [5, 0, -5] }), treno = TR.gruppo; OBJ.porte = TR.porte;
  M.tick.push(t => { const u = Math.max(0, t - PARTE); treno.position.z = -0.6 * u * u; });   // parte e accelera verso il fondo
  // piccioni che beccano e saltellano (mondo vivo)
  const pic = []; for (const [x, z] of [[-1.2, 2.2], [-.6, 2.6], [.4, 1.8]]) { const g = new T.Group(); g.position.set(x, 0, z); M.root.add(g);
    const c = new T.Mesh(new T.SphereGeometry(.12, 10, 8), mat('#8a8aa0', .25)); c.scale.set(1, .8, 1.4); c.position.y = .12; g.add(c); const h = new T.Mesh(new T.SphereGeometry(.06, 8, 6), mat('#6a6a88', .25)); h.position.set(0, .22, .12); g.add(h); pic.push([g, h, x * 3.1]); }
  M.tick.push(t => { for (const [g, h, f] of pic) { const b = Math.max(0, Math.sin(t * 2.2 + f)); h.position.y = .22 - .1 * b * b; g.position.y = Math.max(0, Math.sin(t * 1.3 + f * 2)) ** 8 * .12; g.rotation.y = Math.sin(t * .4 + f) * 1.2; } });
  M.luce('#fff2d8', 6, -.2, 3.6, -2, 10); M.luce('#fff2d8', 5, -.2, 3.6, 3, 10);
}

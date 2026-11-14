import { orologio, cartello } from '/web/buon_senso.js';

export async function costruisci(M, D, S, OBJ) {
  const { THREE, root, std, emi, box, luce } = M;
  const XR = 2.4, XL = 2.4;
  const str = m => { m.traverse(c => { c.userData.struttura = 1; }); m.userData.struttura = 1; return m; };

  // Acciottolato opaco notturno
  str(box(4.8, 0.1, 34, std('#4a4e5c', 0.9), 0, -0.05, -6));

  // Case laterali sinistra e destra con colori caldi
  const colsL = ['#c9885a', '#b8684c', '#d8a670', '#c27a56'];
  const colsR = ['#d69c68', '#c67252', '#caa276', '#b86848'];
  for (let i = 0; i < 4; i++) {
    const z = 4 - i * 6.0;
    str(box(4.5, 9.5, 5.8, std(colsL[i], 0.88), -XL - 2.25, 4.75, z));
    str(box(4.5, 9.5, 5.8, std(colsR[i], 0.88), XR + 2.25, 4.75, z));
  }

  // Soglie/usci di casa al piano terra davanti alle finestre illuminate così nonna e vicina dialogano da uscio a uscio
  box(0.45, 0.08, 1.35, std('#7a7068', 0.88), -XL + 0.22, 0.04, 2.5);
  box(0.45, 0.08, 1.35, std('#7a7068', 0.88), XR - 0.22, 0.04, 2.5);
  box(0.08, 1.95, 1.05, emi('#ffd888', 1.20), -XL + 0.04, 1.05, 2.5).name = 'finestra_nonna';
  const fv = box(0.08, 1.95, 1.05, emi('#ffd888', 1.20), XR - 0.04, 1.05, 2.5);
  fv.name = 'finestra_vicina'; OBJ.finestra_vicina = fv;

  // 4 finestre che si accendono a catena lungo il vicolo
  const posWin = [
    [-XL + 0.04, 2.7, -2.5], [XR - 0.04, 2.7, -3.5],
    [-XL + 0.04, 2.7, -8.5], [XR - 0.04, 2.7, -9.5]
  ];
  posWin.forEach(([wx, wy, wz], idx) => {
    const w = box(0.08, 1.2, 0.95, emi('#ffcf78', 1.25), wx, wy, wz);
    w.name = `win${idx}`; OBJ[`win${idx}`] = w;
  });

  // Campanile in fondo allo sbocco della piazza (21:00)
  str(box(3.8, 18, 3.8, std('#b85c44', 0.88), -1.8, 9, -22));
  orologio(M, { x: -1.8, y: 12.5, z: -20.0, r: 0.9, ora: '21:00' });

  // Lampioni e fioriera di primo piano
  for (const [lx, lz] of [[-XL + 0.3, 1.0], [XR - 0.3, -4.5], [-XL + 0.3, -10.5], [XR - 0.3, -15.0]]) {
    box(0.24, 0.32, 0.24, emi('#ffdf9e', 1.3), lx, 4.1, lz).name = 'lampione_vicolo';
    luce('#ffd488', 5.0, lx * 0.65, 3.9, lz, 9);
  }
  cartello(M, { testo: 'VIA DELLE NONNE', x: -XL + 0.06, y: 2.3, z: 4.5, ry: Math.PI / 2, w: 0.85, h: 0.24, fondo: '#f4eee0', colore: '#222228' });

  // Gruppo 4 teglie segnaposto che avanzano con le zie
  const fila = new THREE.Group(); fila.position.set(0, 0, 2.0); root.add(fila);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.4), std('#c89c54', 0.8));
    t.position.set((i % 2 ? -0.4 : 0.4), 1.1, -i * 1.35);
    fila.add(t);
  }
  OBJ.fila_teglie = fila;
}


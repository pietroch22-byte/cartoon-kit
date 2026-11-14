import { orologio, cartello } from '/web/buon_senso.js';

export async function costruisci(M, D, S, OBJ) {
  const { THREE, root, std, emi, box, luce } = M;
  const str = m => { m.traverse(c => { c.userData.struttura = 1; }); m.userData.struttura = 1; return m; };

  // Piazza pavimentata
  str(box(24, 0.14, 30, std('#585d6e', 0.88), 0, -0.07, -3));
  // Portici sinistra e destra (segnaposto volumetrici)
  str(box(4.5, 10, 26, std('#c87654', 0.88), -12, 5, -3));
  str(box(4.5, 10, 26, std('#d89c68', 0.88), 12, 5, -3));
  // Palazzo Municipio sul fondo
  str(box(20, 12, 5, std('#d8ba92', 0.88), 0, 6, -18));
  cartello(M, { testo: 'MUNICIPIO', x: 0, y: 6.2, z: -15.4, w: 4.5, h: 0.9, fondo: '#283c2e', colore: '#f2d482' });

  // Torre campanaria sinistra con orologio 21:00
  str(box(4.0, 24, 4.0, std('#b85842', 0.88), -9.5, 12, -17));
  orologio(M, { x: -9.5, y: 16.5, z: -14.9, r: 1.1, ora: '21:00' });

  // Fontana a destra del centro
  const vasca = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.6, 24), std('#d8ccb8', 0.82));
  vasca.position.set(4.8, 0.3, -6.5); root.add(vasca); vasca.name = 'fontana';

  // Lampioni piazza notturna
  for (const [lx, lz] of [[-7.5, -1], [7.5, -1], [-7.5, -10], [7.5, -10]]) {
    box(0.16, 3.8, 0.16, std('#2a2a32', 0.7), lx, 1.9, lz);
    box(0.35, 0.42, 0.35, emi('#ffe0a0', 1.3), lx, 4.0, lz).name = 'lampione_piazza';
    luce('#ffd488', 7.0, lx, 3.8, lz, 14);
  }

  // Elicottero segnaposto che cala la forma di Parmigiano gigante al centro piazza
  const eli = new THREE.Group(); eli.position.set(0, 7.6, -4.5); root.add(eli);
  const fus = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.8), std('#c8343a', 0.72)); eli.add(fus);
  const coda = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 2.2), std('#c8343a', 0.72)); coda.position.set(0, 0.2, 2.2); eli.add(coda);
  const rotore = new THREE.Group(); rotore.position.set(0, 0.7, 0); eli.add(rotore);
  rotore.add(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 0.2), std('#2c2e38', 0.7)));
  rotore.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 4.4), std('#2c2e38', 0.7)));
  const faretto = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.3, 12), emi('#fff2cc', 1.5)); faretto.position.set(0, -0.55, -0.5); eli.add(faretto);
  eli.name = 'elicottero'; OBJ.elicottero = eli;

  // Cavo + forma gigante di Parmigiano sospesa sotto l'elicottero
  const parma = new THREE.Group(); parma.position.set(0, 4.6, -4.5); root.add(parma);
  const cavo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8), std('#2a2a32', 0.7)); cavo.position.y = 1.5; parma.add(cavo);
  const forma = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.65, 24), std('#e6bf52', 0.78)); parma.add(forma);
  const badge = M.tex(256, 96, (g, W, H) => { g.fillStyle = '#e6bf52'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a2614'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARMIGIANO', W / 2, H / 2); });
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.36), M.dipinto(badge, 0.25, 0.8)); lbl.position.set(0, 0, 0.96); parma.add(lbl);
  parma.name = 'parmigiano'; OBJ.parmigiano = parma;

  // Rotazione continua del rotore e oscillazione lieve della forma
  M.tick.push(t => {
    rotore.rotation.y = t * 18;
    eli.position.y = 7.4 + Math.sin(t * 2.1) * 0.15;
    parma.rotation.y = Math.sin(t * 1.4) * 0.2;
  });
}


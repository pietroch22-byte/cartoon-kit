import { orologio, cartello } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';

export async function costruisci(M) {
  const { THREE, root, std, emi, box, luce } = M;
  const W = 5.6, X = W / 2, ZF = -3.8, ZB = 4.0, H = 3.1;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) / 2;
  const str = m => { m.traverse(c => { c.userData.struttura = 1; }); m.userData.struttura = 1; return m; };

  const mPav = std('#cab89e', 0.85), mMuro = std('#efe3cc', 0.88), mLegno = std('#6e4628', 0.78), mTapp = std('#9c2c2c', 0.9);
  // Pavimento top a +0.015 e passatoia a +0.03 per eliminare ogni z-fighting con D.road a y=0
  str(box(W + 0.4, 0.14, ZLEN, mPav, 0, -0.055, ZMID));
  str(box(W + 0.4, 0.14, ZLEN, mMuro, 0, H + 0.07, ZMID));
  str(box(0.16, H, ZLEN, mMuro, -X, H / 2, ZMID));
  str(box(0.16, H, ZLEN, mMuro, X, H / 2, ZMID));
  str(box(W + 0.4, H, 0.16, mMuro, 0, H / 2, ZB + 0.08));
  // Parete cucina in fondo con varco arco centrale (x in [-0.95, 0.95], y < 2.25) + alcova chiusa dietro l'arco (nessuno sfondo/vuoto dietro)
  str(box(1.85, H, 0.18, mMuro, -1.88, H / 2, ZF));
  str(box(1.85, H, 0.18, mMuro, 1.88, H / 2, ZF));
  str(box(2.0, H - 2.25, 0.18, mMuro, 0, 2.25 + (H - 2.25) / 2, ZF));
  str(box(3.4, H, 0.16, std('#e6caa2', 0.88), 0, H / 2, ZF - 1.6));
  str(box(0.16, H, 1.8, std('#e6caa2', 0.88), -1.6, H / 2, ZF - 0.8));
  str(box(0.16, H, 1.8, std('#e6caa2', 0.88), 1.6, H / 2, ZF - 0.8));
  str(box(3.4, 0.14, 1.8, mMuro, 0, H + 0.07, ZF - 0.8));
  str(box(3.4, 0.14, 1.8, std('#a85d44', 0.85), 0, -0.055, ZF - 0.8));
  // Passatoia rossa al centro dell'ingresso
  str(box(1.25, 0.02, 6.4, mTapp, 0, 0.025, 0.0));

  // Porta d'ingresso segnaposto a filo z = +3.92 (chiusa di base; non invade la camera nella scena finale)
  const porta = box(1.05, 2.15, 0.08, mLegno, 0, 1.08, ZB - 0.06);
  porta.name = 'porta_ingresso';
  cartello(M, { testo: 'MAI DIRE:\nHO GIA MANGIATO', x: -1.45, y: 1.65, z: ZB - 0.12, ry: Math.PI, w: 0.9, h: 0.6, fondo: '#f5ebd6', colore: '#8a2622', bordo: '#6e4628' });

  // Quadro ricamato "MAI DIRE HO GIA MANGIATO" visibile vicino all'arco (loop 0s / 36s)
  cartello(M, { testo: 'MAI DIRE:\nHO GIA MANGIATO', x: 1.75, y: 1.65, z: ZF + 0.12, w: 0.95, h: 0.65, fondo: '#f5ebd6', colore: '#8a2622', bordo: '#6e4628' });

  // Segnaposto mobili: consolle sinistra, appendiabiti destra, scarpiera, orologio 20:00
  box(0.45, 0.85, 1.2, mLegno, -X + 0.35, 0.42, -1.2).name = 'consolle';
  box(0.45, 0.65, 1.0, mLegno, X - 0.35, 0.32, 0.5).name = 'scarpiera';
  box(0.28, 1.85, 0.28, mLegno, X - 0.45, 0.92, -1.3).name = 'appendiabiti';
  orologio(M, { x: -1.72, y: 2.05, z: ZF + 0.12, r: 0.26, ora: '20:00' });

  // Luce calda visibile in ingresso (plafoniera soffitto + luce dall'arco cucina)
  box(0.45, 0.12, 0.45, emi('#fff0cc', 1.15), 0, H - 0.08, 0.0).name = 'plafoniera';
  luce('#ffe2b4', 5.5, 0, H - 0.35, 0.2, 10);
  luce('#ffd498', 3.5, 0, 2.1, ZF + 0.5, 7);
}

// Ufficio della compagnia ferroviaria: scrivania, comunicato di scuse appeso, ventilatore a pale e orologio veri (library/vivi), finestra luminosa.
import { vivo } from '/web/vivi.js';
export async function costruisci(M, D, S, OBJ) {
  const mat = (c, e = .2, r = .7) => { const x = M.std(c, r); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  M.box(8, .1, 8, mat('#8a7a68', .2), 0, -.05, -2); M.box(8, 3.2, .2, mat('#bfae94', .18), 0, 1.6, -5); for (const s of [-1, 1]) M.box(.2, 3.2, 8, mat('#b3a38a', .18), s * 4, 1.6, -2); M.box(8, .1, 8, mat('#b8b0a2', .15), 0, 3.2, -2);
  M.box(2.6, .08, 1.0, mat('#6a4a32', .25), 0, .78, -2.6); for (const x of [-1.2, 1.2]) M.box(.08, .78, .9, mat('#4a3424', .2), x, .39, -2.6);
  M.box(.5, .32, .04, M.emi('#cfe6ff', 1.0), .6, 1.0, -2.75); M.box(.5, .02, .3, mat('#2a2a34', .2), .6, .83, -2.55);   // computer
  for (let i = 0; i < 5; i++) M.box(.28, .02, .36, mat('#f4f0e6', .3), -.7 + i * .03, .83 + i * .015, -2.5);   // fogli
  M.pannello({ w: 2.2, h: 1.3, x: 0, y: 2.0, z: -4.88, px: 512, emissiva: .45, dipingi: (g, W, H) => { g.fillStyle = '#fbf7ee'; g.fillRect(0, 0, W, H); g.fillStyle = '#b8242c'; g.font = `900 ${H * .14}px sans-serif`; g.textAlign = 'center';
    g.fillText('COMUNICATO', W / 2, H * .2); g.fillStyle = '#2a2020'; g.font = `700 ${H * .095}px sans-serif`; ['Ci scusiamo profondamente', "per l'enorme disagio:", 'il treno delle 9:44:40', 'è partito 20 secondi prima.'].forEach((l, i) => g.fillText(l, W / 2, H * (.4 + i * .15))); } });
  M.box(1.6, 1.4, .05, M.emi('#bcd4f0', .8), -2.4, 1.8, -4.88); M.box(1.7, .06, .06, mat('#ffffff', .3), -2.4, 1.8, -4.86);
  await vivo(M, 'ventilatore_soffitto', { x: 0, y: 3.15, z: -1.5 }); await vivo(M, 'orologio', { x: 2.4, y: 2.3, z: -4.86 });
  await vivo(M, 'ventilatore_tavolo', { x: -1.0, y: .82, z: -2.7, s: .7 });
  M.box(.5, 1.2, .5, mat('#5a8a5a', .25), 3.3, .6, -4.3); M.box(.7, 1.9, .5, mat('#9a9aa8', .2), -3.4, .95, -4.3);
  M.luce('#fff0d8', 2.5, 0, 2.8, -1, 10);
}

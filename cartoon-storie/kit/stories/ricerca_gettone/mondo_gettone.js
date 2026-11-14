// Orchestratore leggero della storia ricerca_gettone
// Smista la scena corrente su una delle 3 location Fortnite × Rick e compone l'overlay cinetico.
import { camera, renderer } from '/web/look_disegnato.js';
import { costruisciTempioScalinata } from './location_tempio.js';
import { costruisciSalaTattica } from './location_hub.js';
import { costruisciBunkerBottino } from './location_bunker.js';
import { disegnaGraficaScena } from './grafica_montaggio.js';

export async function costruisci(M, D, S, OBJ) {
  const { THREE: T } = M;
  const scIdx = +(new URLSearchParams(window.location.search).get('scena') || 0);
  const sc = (S.scene && S.scene[scIdx]) || {};
  const scDa = sc.da || 0;
  const scA = sc.a || (scDa + 2);
  window._rCam = camera;
  window._rObj = OBJ;
  window._rGetActors = () => M.root.children.filter(c => c.userData && c.userData.vivo === 'attore');

  const compCv = document.createElement('canvas');
  compCv.width = 1080;
  compCv.height = 1920;
  const compCtx = compCv.getContext('2d');
  const sharedState = {
    attRef: OBJ && OBJ.cacciatore,
    apexPos: new T.Vector3(0, 4.75, -7.8),
    holdScale: 1.0,
    preFrame: null
  };

  let _origRF = null;
  let _wrappedRF = null;
  Object.defineProperty(window, 'renderFrame', {
    configurable: true,
    enumerable: true,
    get() { return _wrappedRF; },
    set(fn) {
      _origRF = fn;
      _wrappedRF = async (f, N, fps = 30) => {
        window._rCam = camera;
        if (sharedState.preFrame) sharedState.preFrame(scDa + f / fps);
        const r = await _origRF(f, N, fps);
        const src = window.mossoCanvas || renderer.domElement;
        compCtx.clearRect(0, 0, 1080, 1920);
        compCtx.drawImage(src, 0, 0, 1080, 1920);
        disegnaGraficaScena(compCtx, scIdx, f, fps, scDa, scA, T, camera, sharedState);
        window.mossoCanvas = compCv;
        return r;
      };
    }
  });

  const luogo = sc.luogo || 'tempio_scalinata';
  if (luogo === 'tempio_scalinata') {
    await costruisciTempioScalinata(M, D, OBJ, sc, sharedState);
  } else if (luogo === 'bunker_bottino') {
    await costruisciBunkerBottino(M, D, OBJ, sc, sharedState);
  } else {
    await costruisciSalaTattica(M, D, OBJ, sc, sharedState);
  }
}

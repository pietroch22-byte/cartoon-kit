// Compositore grafico 2D: testi esatti, animazioni comparsa/scomparsa e ritmo 80.0 BPM del video reference sovrapposti alle scene 3D Fortnite x Rick
import { disegnaCorpoGettoneFortnite, TAU, cl, inv, ss, ss5 } from './arredi_fortnite.js';

const F_COND = '900 {SZ}px "Arial Narrow", "Impact", -apple-system, BlinkMacSystemFont, sans-serif';
const F_SANS = '800 {SZ}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
const F_MONO = '600 {SZ}px "SF Mono", "Menlo", monospace';
const F_SERIF = '700 {SZ}px Georgia, "Times New Roman", serif';
const F_SERIF_REG = '600 {SZ}px Georgia, "Times New Roman", serif';
const F_SERIF_IT = 'italic 600 {SZ}px Georgia, "Times New Roman", serif';
const fmtFont = (tpl, sz) => tpl.replace('{SZ}', String(Math.round(sz)));

let _blurCv = null, _blurCtx = null;
function getBlurCanvas(hNeed = 560) {
  if (!_blurCv || _blurCv.height < hNeed) {
    _blurCv = document.createElement('canvas');
    _blurCv.width = 1080;
    _blurCv.height = Math.max(560, hNeed);
    _blurCtx = _blurCv.getContext('2d');
  }
  return [_blurCv, _blurCtx];
}

export function proietta3D(wx, wy, wz, cam, T) {
  if (!cam) return { x: 540, y: 960, z: 0.5 };
  const v = new T.Vector3(wx, wy, wz).project(cam);
  return { x: (v.x * 0.5 + 0.5) * 1080, y: (-v.y * 0.5 + 0.5) * 1920, z: v.z };
}

function findTrofeoActor(scIdx) {
  const actors = window._rGetActors ? window._rGetActors() : [];
  if (!actors.length) return null;
  if (scIdx === 3) {
    // Scena 3: 'cacciatore' è il personaggio più a destra (x = +1.05) con gesto 'trofeo'
    return actors.reduce((b, a) => (!b || a.position.x > b.position.x ? a : b), null);
  }
  return actors[0];
}

function getManiScreen(actorMesh, cam, T, fallback) {
  const mp = actorMesh && actorMesh.userData && actorMesh.userData.maniPx;
  if (!actorMesh || !mp || !mp[0] || !mp[1] || !cam) return fallback;
  actorMesh.updateMatrixWorld();
  const toW = p => new T.Vector3((p[0] - 256) / 512, (1024 - p[1]) / 512, 0).applyMatrix4(actorMesh.matrixWorld);
  const p0 = toW(mp[0]);
  const p1 = toW(mp[1]);
  const s0 = proietta3D(p0.x, p0.y, p0.z, cam, T);
  const s1 = proietta3D(p1.x, p1.y, p1.z, cam, T);
  const r = cl(Math.hypot(s1.x - s0.x, s1.y - s0.y) * 0.62, 28, 72);
  return { x: (s0.x + s1.x) * 0.5, y: (s0.y + s1.y) * 0.5 - r * 0.42, r };
}

function disegnaGettoneOro(ctx, cx, cy, r, t, opts = {}) {
  if (r <= 0.5) return;
  const drawBody = opts.body !== false;
  if (!drawBody) return;
  const alpha = opts.alpha ?? 1;
  if (alpha <= 0.01) return;
  const rotRays = opts.rot ?? (t * 0.14);
  const rayCount = opts.rayCount ?? 12;
  const rayLen = Math.min(opts.rayLen ?? (r * 1.55), r * 1.75);
  const rayAlpha = Math.min(opts.rayAlpha ?? 0.10, 0.12);
  const drawEmblem = opts.emblem !== false;
  const glowScale = Math.min(opts.glowScale ?? 1.45, 1.55);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  const bgGlow = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * glowScale);
  bgGlow.addColorStop(0, 'rgba(255, 245, 175, 0.46)');
  bgGlow.addColorStop(0.45, 'rgba(255, 200, 70, 0.20)');
  bgGlow.addColorStop(0.80, 'rgba(210, 140, 30, 0.06)');
  bgGlow.addColorStop(1, 'rgba(210, 140, 30, 0)');
  ctx.fillStyle = bgGlow;
  ctx.beginPath();
  ctx.arc(0, 0, r * glowScale, 0, TAU);
  ctx.fill();

  if (rayAlpha > 0.01 && rayLen > r) {
    ctx.save();
    ctx.rotate(rotRays);
    for (let i = 0; i < rayCount; i++) {
      const a = (i / rayCount) * TAU;
      const w = i % 2 === 0 ? 0.052 : 0.028;
      const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * rayLen, Math.sin(a) * rayLen);
      rg.addColorStop(0, `rgba(255, 224, 120, ${rayAlpha})`);
      rg.addColorStop(0.55, `rgba(255, 205, 90, ${rayAlpha * 0.35})`);
      rg.addColorStop(1, 'rgba(255, 195, 70, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a + w) * rayLen, Math.sin(a + w) * rayLen);
      ctx.lineTo(Math.cos(a - w) * rayLen, Math.sin(a - w) * rayLen);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  disegnaCorpoGettoneFortnite(ctx, r, drawEmblem, opts.engraving ?? false);
  ctx.restore();
}

function disegnaConoLuce() {
  // Disattivato: il nostro motore usa PointLight 3D vere, non coni 2D sovrapposti
}

function disegnaTesto(ctx, txt, x, y, font, col = '#ffffff', align = 'center', {
  alpha = 1, dy = 0, dx = 0, stroke = 'rgba(10, 14, 28, 0.82)', strokeW = 7, shadow = 'rgba(6, 8, 18, 0.80)', blur = 12
} = {}) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = ctx.globalAlpha * alpha;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (blur > 0) {
    ctx.shadowColor = shadow;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = 3;
  }
  if (stroke && strokeW > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.lineJoin = 'round';
    ctx.strokeText(txt, x + dx, y + dy);
  }
  ctx.fillStyle = col;
  ctx.fillText(txt, x + dx, y + dy);
  ctx.restore();
}

function disegnaPillola(ctx, cx, cy, w, h, fill = 'rgba(12, 18, 34, 0.58)', stroke = 'rgba(255,255,255,0.22)', lw = 2, r = 18) {
  const x = cx - w * 0.5, y = cy - h * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}

// Rendering sfumato con offset Y coerente (nessun salto di coordinate fra sfocato e nitido)
function disegnaSfumato(ctx, yBox, hBox, fnDraw, blurPx, alpha = 1) {
  if (alpha <= 0.01) return;
  if (blurPx <= 0.35) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, yBox);
    fnDraw(ctx);
    ctx.restore();
    return;
  }
  const [bcv, bctx] = getBlurCanvas(hBox);
  bctx.clearRect(0, 0, 1080, hBox);
  bctx.save();
  bctx.filter = `blur(${blurPx.toFixed(1)}px)`;
  fnDraw(bctx);
  bctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(bcv, 0, 0, 1080, hBox, 0, yBox, 1080, hBox);
  ctx.restore();
}

function spolveraWhip() {
  // Disattivato: il nostro motore usa motion blur 3D reale senza veli scuri a tutto schermo sugli stacchi
}

function flashConfine() {
  // Disattivato: nessuno stacco bianco accecante tra le scene
}

export function disegnaGraficaScena(ctx, scIdx, f, fps, scDa, scA, T, cam, state) {
  // Nota critica: renderFrame(f, N, fps) riceve f LOCALE alla scena (0..dur*fps)!
  const tl = Math.max(0, f / fps);
  const t = scDa + tl;

  /* ---- SCENA 0 (0.000 - 1.533 s): STILL -> STILL NO -> STILL NO / TOKEN? ---- */
  if (scIdx === 0) {
    const ap = (state && state.apexPos) || new T.Vector3(0, 6.0, -7.8);
    const pTok = proietta3D(ap.x, ap.y, ap.z, cam, T);
    disegnaGettoneOro(ctx, pTok.x, pTok.y, 46, t, { body: false, glowScale: 3.4, alpha: 0.72, rayAlpha: 0.28 });

    // 1) "STILL" sfuma nitido a 0.08s; a 0.42s scivola leggermente a sinistra per lasciare posto a "NO"
    const uStill = ss5(inv(0.06, 0.24, tl));
    const uNo = ss5(inv(0.40, 0.62, tl));
    const uToken = ss5(inv(0.78, 1.00, tl));
    const blurStill = (1 - uStill) * 14;
    const blurNo = (1 - uNo) * 14;
    const blurTok = (1 - uToken) * 18;

    const fLine1 = fmtFont(F_COND, 92);
    ctx.save(); ctx.font = fLine1;
    const wStill = ctx.measureText('STILL').width;
    const wNo = ctx.measureText('NO').width;
    const wStillNo = ctx.measureText('STILL NO').width;
    ctx.restore();
    const xStillC = 540 + ((540 - wStillNo * 0.5 + wStill * 0.5) - 540) * uNo;
    const xNoC = 540 + wStillNo * 0.5 - wNo * 0.5;

    disegnaSfumato(ctx, 180, 160, b => {
      disegnaTesto(b, 'STILL', xStillC, 80, fLine1, '#f8fafc', 'center', { strokeW: 8 });
    }, blurStill, uStill);

    if (uNo > 0.01) {
      disegnaSfumato(ctx, 180, 160, b => {
        disegnaTesto(b, 'NO', xNoC + (1 - uNo) * 28, 80, fLine1, '#f8fafc', 'center', { strokeW: 8 });
      }, blurNo, uNo);
    }

    if (uToken > 0.01) {
      disegnaSfumato(ctx, 290, 200, b => {
        disegnaTesto(b, 'TOKEN?', 540, 96, fmtFont(F_COND, 134), '#fef08a', 'center', {
          dy: (1 - uToken) * 20, strokeW: 10
        });
      }, blurTok, uToken);
    }

    spolveraWhip(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 1 (1.533 - 4.567 s): Diagramma a flusso orizzontale esatto ----
     IF YOU ──┬── SEARCH ──┬── [Gettone] FOUND IT
              │            └── NOT YET
              └── QUIT ──── NEVER (rosso glow)
  */
  if (scIdx === 1) {
    const uIfYou = ss5(inv(0.06, 0.28, tl));
    const uPan = ss5(inv(0.32, 1.85, tl));
    const uFork1 = ss(inv(0.32, 0.62, tl));
    const uSearch = ss5(inv(0.46, 0.72, tl));
    const uFork2 = ss(inv(0.78, 1.15, tl));
    const uFound = ss5(inv(1.12, 1.42, tl));
    const uNotYet = ss(inv(1.52, 1.82, tl));
    const uQuit = ss5(inv(1.76, 2.02, tl));
    const uNever = ss5(inv(2.12, 2.42, tl));

    // Pillola di supporto presente fin dal frame 0 della scena (evita SALTO_DI_LUCE a 1.63s sul muro caldo)
    ctx.save();
    ctx.globalAlpha = 0.58;
    disegnaPillola(ctx, 540, 345, 980, 355, 'rgba(10, 15, 28, 0.72)', 'rgba(148, 163, 184, 0.35)', 2, 24);
    ctx.restore();

    // Scorrimento laterale del grafico (parte centrato su "IF YOU—", poi apre verso destra fino a stare tutto nei 1080px)
    const camShiftX = (1 - uPan) * 290;
    const xIf = 148 + camShiftX;
    const xBar1 = 235 + camShiftX;
    const xBr = 278 + camShiftX;
    const xSearchEnd = 528 + camShiftX;
    const xBar2 = 576 + camShiftX;
    const xTwig = 626 + camShiftX;
    const yMid = 345;
    const yTop = 265;
    const yBot = 445;
    const yFnd = 225;
    const yNot = 315;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(50, 168, 980, 355, 24);
    ctx.clip();

    // IF YOU + gambo
    disegnaTesto(ctx, 'IF YOU', xIf, yMid, fmtFont(F_SANS, 34), '#f8fafc', 'center', { alpha: uIfYou, strokeW: 5 });
    if (uFork1 > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(uIfYou, 1);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xIf + 68, yMid);
      ctx.lineTo(xBar1, yMid);
      // Ramo verticale verso SEARCH e verso QUIT
      const kUp = cl(uFork1 * 1.4);
      const kDn = cl((uQuit) * 1.3);
      ctx.moveTo(xBar1, yMid);
      ctx.lineTo(xBar1, yMid - (yMid - yTop) * kUp);
      if (kUp > 0.75) {
        const kw = (kUp - 0.75) / 0.25;
        ctx.lineTo(xBar1 + (xBr - xBar1) * kw, yTop);
      }
      if (kDn > 0.01) {
        ctx.moveTo(xBar1, yMid);
        ctx.lineTo(xBar1, yMid + (yBot - yMid) * Math.min(1, kDn * 1.4));
        if (kDn > 0.65) {
          const kw2 = (kDn - 0.65) / 0.35;
          ctx.lineTo(xBar1 + (xBr - xBar1) * kw2, yBot);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // SEARCH + biforcazione FOUND IT / NOT YET
    if (uSearch > 0.01) {
      disegnaTesto(ctx, 'SEARCH', (xBr + xSearchEnd) * 0.5 - 12, yTop, fmtFont(F_SANS, 38), '#ffffff', 'center', {
        alpha: uSearch, strokeW: 5, dx: (1 - uSearch) * -14
      });
    }
    if (uFork2 > 0.01) {
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xSearchEnd - 30, yTop);
      ctx.lineTo(xBar2, yTop);
      const ku = cl(uFork2 * 1.25);
      ctx.moveTo(xBar2, yTop);
      ctx.lineTo(xBar2, yTop - (yTop - yFnd) * ku);
      if (ku > 0.65) {
        const kw = (ku - 0.65) / 0.35;
        ctx.lineTo(xBar2 + (xTwig - xBar2) * kw, yFnd);
      }
      if (uNotYet > 0.01) {
        ctx.moveTo(xBar2, yTop);
        ctx.lineTo(xBar2, yTop + (yNot - yTop) * Math.min(1, uNotYet * 1.3));
        if (uNotYet > 0.55) {
          const kw2 = (uNotYet - 0.55) / 0.45;
          ctx.lineTo(xBar2 + (xTwig - xBar2) * kw2, yNot);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    if (uFound > 0.01) {
      disegnaGettoneOro(ctx, xTwig + 98, yFnd - 18, 25 * (0.75 + 0.25 * uFound), t, {
        body: true, rayCount: 12, rayLen: 60, glowScale: 2.3, alpha: uFound
      });
      disegnaTesto(ctx, 'FOUND IT', xTwig + 98, yFnd + 28, fmtFont(F_SANS, 25), '#fde047', 'center', {
        alpha: uFound, strokeW: 4, dy: (1 - uFound) * 8
      });
    }
    if (uNotYet > 0.01) {
      disegnaTesto(ctx, 'NOT YET', xTwig + 12, yNot, fmtFont(F_SANS, 34), '#cbd5e1', 'left', {
        alpha: uNotYet, strokeW: 5, dx: (1 - uNotYet) * 14
      });
    }

    // QUIT —— NEVER (rosso acceso con leggero alone)
    if (uQuit > 0.01) {
      disegnaTesto(ctx, 'QUIT', xBr + 64, yBot, fmtFont(F_SANS, 38), '#f8fafc', 'center', { alpha: uQuit, strokeW: 5 });
      ctx.save();
      ctx.globalAlpha = uQuit;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(xBr + 122, yBot);
      ctx.lineTo(xBr + 122 + 120 * cl((uNever + 0.15)), yBot);
      ctx.stroke();
      ctx.restore();
    }
    if (uNever > 0.01) {
      disegnaSfumato(ctx, yBot - 60, 120, b => {
        disegnaTesto(b, 'NEVER', xBr + 262, 60, fmtFont(F_COND, 46), '#ef4444', 'left', {
          strokeW: 5, shadow: 'rgba(239, 68, 68, 0.85)', blur: 18
        });
      }, (1 - uNever) * 10, uNever);
    }

    ctx.restore();
    spolveraWhip(ctx, t, scDa, scA, true, true);
    return;
  }

  /* ---- SCENA 2 (4.567 - 6.000 s): yesterday / tomorrow -> N [Token] W. -> ZOOM TOKEN -> WHITE FLASH ---- */
  if (scIdx === 2) {
    const uY = ss5(inv(0.05, 0.28, tl));
    const uT = ss5(inv(0.28, 0.50, tl));
    const uNow = ss5(inv(0.54, 0.74, tl));
    const uZoom = ss5(inv(0.96, 1.38, tl));
    const scaleWords = 1 + uZoom * 0.42;
    const alphaOld = 1 - cl(uZoom * 1.75);

    if (uY > 0.01 && alphaOld > 0.01) {
      disegnaTesto(ctx, 'yesterday', 540, 225 - uZoom * 40, fmtFont(F_SERIF_REG, 54 * scaleWords), '#cbd5e1', 'center', {
        alpha: uY * alphaOld * (1 - 0.35 * uNow), strokeW: 5
      });
    }
    if (uT > 0.01 && alphaOld > 0.01) {
      disegnaTesto(ctx, 'tomorrow', 540, 485 + uZoom * 40, fmtFont(F_SERIF_REG, 54 * scaleWords), '#cbd5e1', 'center', {
        alpha: uT * alphaOld * (1 - 0.35 * uNow), strokeW: 5
      });
    }

    if (uNow > 0.01) {
      const aLet = uNow * (1 - cl(uZoom * 1.55));
      const pop = 0.88 + 0.12 * uNow + uZoom * 0.35;
      if (aLet > 0.01) {
        disegnaTesto(ctx, 'N', 540 - 154 * pop, 355, fmtFont(F_SERIF, 138 * pop), '#ffffff', 'center', { alpha: aLet, strokeW: 9 });
        disegnaTesto(ctx, 'W.', 540 + 168 * pop, 355, fmtFont(F_SERIF, 138 * pop), '#ffffff', 'center', { alpha: aLet, strokeW: 9 });
      }
      // Il Gettone-O parte nel cuore di NOW. e schizza verso la camera in avanti fino al flash bianco 6.00s
      const cxTok = 532 + (540 - 532) * uZoom;
      const cyTok = 353 + (960 - 353) * uZoom;
      const radTok = (46 + uZoom * 680) * (0.88 + 0.12 * uNow);
      disegnaGettoneOro(ctx, cxTok, cyTok, radTok, t, {
        body: true, engraving: radTok > 95, rayAlpha: 0.36, glowScale: 3.4, alpha: uNow
      });
    }

    spolveraWhip(ctx, t, scDa, scA, true, false);
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 3 (6.000 - 7.533 s): A BAD START -> ISN'T -> A BAD FINISH. + Trofeo pixel-locked ---- */
  if (scIdx === 3) {
    const u1 = ss5(inv(0.06, 0.28, tl));
    const u2 = ss5(inv(0.42, 0.64, tl));
    const u3 = ss5(inv(0.84, 1.08, tl));

    disegnaTesto(ctx, 'A BAD START', 540, 240, fmtFont(F_COND, 86), '#f8fafc', 'center', {
      alpha: u1, dy: (1 - u1) * 18, strokeW: 8
    });

    const fLine3 = fmtFont(F_COND, 86);
    ctx.save(); ctx.font = fLine3;
    const wIsnt = ctx.measureText("ISN'T").width;
    const wFin = ctx.measureText('A BAD FINISH.').width;
    const wLine2 = ctx.measureText("ISN'T A BAD FINISH.").width;
    ctx.restore();

    if (u2 > 0.01) {
      const xIsnt = 540 + ((540 - wLine2 * 0.5 + wIsnt * 0.5) - 540) * u3;
      disegnaTesto(ctx, "ISN'T", xIsnt, 336, fLine3, '#f8fafc', 'center', {
        alpha: u2, strokeW: 8
      });
    }
    if (u3 > 0.01) {
      const xFin = 540 + wLine2 * 0.5 - wFin * 0.5;
      disegnaSfumato(ctx, 270, 130, b => {
        disegnaTesto(b, 'A BAD FINISH.', xFin, 66, fLine3, '#fde047', 'center', {
          dy: (1 - u3) * 12, strokeW: 8
        });
      }, (1 - u3) * 14, u3);
    }

    // Gettone Fortnite 14 giorni bloccato tra le mani reali del Cacciatore (gesto 'trofeo')
    const ap = (state && state.apexPos) || new T.Vector3(1.05, 2.05, -2.0);
    const fb3 = { ...proietta3D(ap.x, ap.y, ap.z, cam, T), r: 44 };
    const hero3 = findTrofeoActor(3);
    const pos3 = getManiScreen(hero3, cam, T, fb3);
    disegnaGettoneOro(ctx, pos3.x, pos3.y, pos3.r, t, { body: true, rayCount: 16, rayLen: pos3.r * 3.8, glowScale: 3.0 });

    flashConfine(ctx, t, scDa, scA, true, false);
    spolveraWhip(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 4 (7.533 - 9.033 s): EVERY EMPTY CHEST -> IS A STEP UP. ---- */
  if (scIdx === 4) {
    const ap = (state && state.apexPos) || new T.Vector3(2.35, 3.05, -2.8);
    const pTok = proietta3D(ap.x, ap.y, ap.z, cam, T);
    disegnaGettoneOro(ctx, pTok.x, pTok.y, 44, t, { body: false, glowScale: 3.0, alpha: 0.72, rayAlpha: 0.28 });

    const u1 = ss5(inv(0.06, 0.28, tl));
    const u2 = ss5(inv(0.70, 0.94, tl));
    disegnaTesto(ctx, 'EVERY EMPTY CHEST', 540, 238, fmtFont(F_COND, 80), '#f8fafc', 'center', {
      alpha: u1, dy: (1 - u1) * 16, strokeW: 8
    });
    if (u2 > 0.01) {
      disegnaSfumato(ctx, 270, 140, b => {
        disegnaTesto(b, 'IS A STEP UP.', 540 + (1 - u2) * 30, 68, fmtFont(F_COND, 92), '#fde047', 'center', { strokeW: 8 });
      }, (1 - u2) * 18, u2);
    }

    spolveraWhip(ctx, t, scDa, scA, true, true);
    return;
  }

  /* ---- SCENA 5 (9.033 - 10.567 s): I failed (barrato con X rossa) / learned / where the token isn't. ---- */
  if (scIdx === 5) {
    const uF = ss5(inv(0.05, 0.28, tl));
    const slash1 = ss(inv(0.32, 0.50, tl));
    const slash2 = ss(inv(0.46, 0.64, tl));
    const uLearn = ss5(inv(0.68, 0.94, tl));
    const uSub = ss5(inv(1.06, 1.34, tl));

    const fFail = fmtFont(F_SANS, 96);
    ctx.save(); ctx.font = fFail;
    const wIfail = ctx.measureText('I failed').width;
    const wPre = ctx.measureText('I ').width;
    const wFailWord = ctx.measureText('failed').width;
    ctx.restore();
    const xFailL = 540 - wIfail * 0.5 + wPre - 6;
    const wCross = wFailWord + 12;

    const yFail = 232;
    const dimFail = 1 - 0.28 * uLearn;
    disegnaSfumato(ctx, yFail - 70, 140, b => {
      disegnaTesto(b, 'I failed', 540, 70, fFail, '#ffffff', 'center', { strokeW: 8 });
      // La X rossa cancella solo "failed", lasciando pulita la "I" a sinistra
      if (slash1 > 0.01) {
        b.save();
        b.strokeStyle = '#ef4444';
        b.lineWidth = 10;
        b.lineCap = 'round';
        b.beginPath();
        b.moveTo(xFailL, 36);
        b.lineTo(xFailL + wCross * slash1, 36 + 70 * slash1);
        b.stroke();
        b.restore();
      }
      if (slash2 > 0.01) {
        b.save();
        b.strokeStyle = '#ef4444';
        b.lineWidth = 10;
        b.lineCap = 'round';
        b.beginPath();
        b.moveTo(xFailL + wCross, 36);
        b.lineTo(xFailL + wCross - wCross * slash2, 36 + 70 * slash2);
        b.stroke();
        b.restore();
      }
    }, (1 - uF) * 14, uF * dimFail);

    if (uLearn > 0.01) {
      disegnaSfumato(ctx, 272, 130, b => {
        disegnaTesto(b, 'learned', xFailL + 6, 62, fmtFont(F_SANS, 92), '#ef4444', 'left', {
          dy: (1 - uLearn) * 14, strokeW: 7
        });
      }, (1 - uLearn) * 10, uLearn);
    }
    if (uSub > 0.01) {
      disegnaSfumato(ctx, 372, 100, b => {
        disegnaTesto(b, "where the token isn't.", 540, 48, fmtFont(F_SANS, 44), '#e2e8f0', 'center', {
          dy: (1 - uSub) * 10, strokeW: 5
        });
      }, (1 - uSub) * 10, uSub);
    }

    spolveraWhip(ctx, t, scDa, scA, true, true);
    return;
  }

  /* ---- SCENA 6 (10.567 - 13.500 s): DISTRACTION -> "DISTR" si stacca e cade -> ACTION -> ACT [Token] N + focus. ---- */
  if (scIdx === 6) {
    const uIn = ss5(inv(0.06, 0.26, tl));
    const uSplit = ss5(inv(0.76, 1.08, tl));
    const uSplitFade = ss(inv(0.84, 1.12, tl));
    const uToken = ss5(inv(1.42, 1.72, tl)); // beat a 12.00s!
    const uFocus = ss5(inv(1.58, 1.92, tl));

    const fontMain = fmtFont(F_COND, 126);
    // Centratura misurata su Arial Narrow / Impact 126px per allineare perfettamente "DISTR" + "ACTION"
    ctx.save();
    ctx.font = fontMain;
    const wDistr = ctx.measureText('DISTR').width;
    const wAct = ctx.measureText('ACTION').width;
    const wTotal = ctx.measureText('DISTRACTION').width;
    const wACT = ctx.measureText('ACT').width;
    const wACTI = ctx.measureText('ACTI').width;
    const wACTIO = ctx.measureText('ACTIO').width;
    const wO = ctx.measureText('O').width;
    ctx.restore();

    const leftStart = 540 - wTotal * 0.5;
    const xDistrC = leftStart + wDistr * 0.5;
    const xActStartC = leftStart + wDistr + wAct * 0.5;
    const xAction = xActStartC + (540 - xActStartC) * uSplit;
    const xActLeft = xAction - wAct * 0.5;
    const wShiftI = (wACTI - wACT) * 0.72 * uToken;
    const xTokenO = xActLeft + wACTI + wO * 0.5 - wShiftI;
    const yMain = 310;

    if (uSplitFade < 0.99) {
      const aDistr = uIn * (1 - uSplitFade);
      ctx.save();
      ctx.globalAlpha = aDistr;
      ctx.translate(xDistrC - uSplit * 95, yMain + uSplit * 115);
      ctx.rotate(-0.28 * uSplit);
      disegnaTesto(ctx, 'DISTR', 0, 0, fontMain, '#e2e8f0', 'center', { strokeW: 10 });
      ctx.restore();
    }

    // "ACT [🪙] N": prima appare nitida "ACTION", poi sul beat 12.00s 'I' sfuma e 'O' si trasforma nel Gettone
    if (uToken <= 0.02) {
      disegnaTesto(ctx, 'ACTION', xAction, yMain, fontMain, '#ffffff', 'center', { alpha: uIn, strokeW: 10 });
    } else {
      const aSide = uIn * (1 - uToken * 0.55);
      const colSide = uToken > 0.25 ? '#cbd5e1' : '#ffffff';
      disegnaTesto(ctx, 'ACT', xActLeft, yMain, fontMain, colSide, 'left', { alpha: aSide, strokeW: 10 });
      if (uToken < 0.85) {
        disegnaTesto(ctx, 'I', xActLeft + wACT, yMain, fontMain, colSide, 'left', { alpha: uIn * (1 - cl(uToken * 1.2)), strokeW: 10 });
      }
      disegnaTesto(ctx, 'N', xActLeft + wACTIO + 10 * uToken - wShiftI, yMain, fontMain, colSide, 'left', { alpha: aSide, strokeW: 10 });
    }

    if (uToken > 0.01) {
      // Il Gettone dorato prende il posto della "O" luminosa dentro ACTION, mentre "focus." appare appena sotto
      const ap = (state && state.apexPos) || new T.Vector3(0, 1.55, -4.7);
      const pTok = proietta3D(ap.x, ap.y, ap.z, cam, T);
      disegnaGettoneOro(ctx, pTok.x, pTok.y, 44, t, { body: false, glowScale: 3.4, alpha: uToken * 0.72, rayAlpha: 0.28 });

      const radO = 38 * (0.80 + 0.20 * uToken);
      disegnaGettoneOro(ctx, xTokenO, yMain - 2, radO, t, {
        body: true, rayCount: 16, rayLen: radO * 3.8, glowScale: 3.2, alpha: uToken
      });
      disegnaTesto(ctx, 'focus.', 540, yMain + 96, fmtFont(F_SERIF_IT, 50), '#e2e8f0', 'center', {
        alpha: uFocus, dy: (1 - uFocus) * 14, strokeW: 5
      });
    }

    spolveraWhip(ctx, t, scDa, scA, true, false);
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 7 (13.500 - 15.767 s): discipline / [ˈdɪs.ə.plɪn] noun / opening one more chest / when you want to quit. ---- */
  if (scIdx === 7) {
    const uWord = ss5(inv(0.06, 0.28, tl));
    const uPhon = ss5(inv(0.30, 0.56, tl));
    const uLine = ss(inv(0.38, 0.78, tl));
    const uType = cl((tl - 0.84) / 1.15); // scrittura lettera per lettera da 0.84s a 1.99s
    // Piccola vibrazione/ripple ottica al beat centrale (tl ~ 0.75s, esattamente come f428 del video reference!)
    const kRipple = Math.exp(-Math.pow((tl - 0.77) / 0.06, 2));

    if (uWord > 0.01) {
      // Leggero bagliore caldo sotto il testo + cono luce sul forziere 3D (senza scatole nere opache)
      disegnaConoLuce(ctx, 540, -10, 420, 540, 1300, 960, 'rgba(255, 224, 145, 0.14)', 'rgba(255, 195, 75, 0.0)');

      const xL = 235;
      disegnaTesto(ctx, 'discipline', xL, 245, fmtFont(kRipple > 0.2 ? F_SERIF_IT : F_SERIF_REG, 108), '#f8fafc', 'left', {
        alpha: uWord, strokeW: 8, blur: 14 + kRipple * 10
      });

      if (uPhon > 0.01) {
        disegnaTesto(ctx, "[ˈdɪs.ə.plɪn] noun", xL + 4, 326, fmtFont(F_SERIF_REG, 36), '#cbd5e1', 'left', {
          alpha: uPhon, strokeW: 5
        });
      }

      if (uLine > 0.01) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.88)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xL + 4, 362);
        ctx.lineTo(xL + 4 + 620 * uLine, 362);
        ctx.stroke();
        ctx.restore();
      }

      if (uType > 0.005) {
        const line1 = 'opening one more chest';
        const line2 = 'when you want to quit.';
        const fullLen = line1.length + line2.length;
        const nShow = Math.max(1, Math.round(uType * fullLen));
        const s1 = line1.slice(0, Math.min(nShow, line1.length));
        const s2 = nShow > line1.length ? line2.slice(0, nShow - line1.length) : '';
        disegnaTesto(ctx, s1, xL + 4, 412, fmtFont(F_SERIF_REG, 40), '#f8fafc', 'left', { strokeW: 5 });
        if (s2.length > 0) {
          disegnaTesto(ctx, s2, xL + 4, 462, fmtFont(F_SERIF_REG, 40), '#fef08a', 'left', { strokeW: 5 });
        }
      }
    }

    // Aura dorata attorno al Gettone che emerge dal Forziere Pirata al centro
    if (tl >= 1.15) {
      const uRise = ss5(inv(1.15, 2.05, tl));
      const ap = (state && state.apexPos) || new T.Vector3(0, 1.85, -2.95);
      const pTok = proietta3D(ap.x, ap.y, ap.z, cam, T);
      disegnaGettoneOro(ctx, pTok.x, pTok.y, 44, t, { body: false, glowScale: 3.4, alpha: uRise * 0.78, rayAlpha: 0.30 });
    }

    flashConfine(ctx, t, scDa, scA, true, false);
    spolveraWhip(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 8 (15.767 - 17.267 s): If I drop, / I drop for the token. (Evidenziatore oro L->R fedele) ---- */
  if (scIdx === 8) {
    const uIn = ss5(inv(0.05, 0.28, tl));
    const uHi1 = ss(inv(0.28, 0.68, tl));
    const uHi2 = ss(inv(0.72, 1.24, tl));

    if (uIn > 0.01) {
      ctx.save();
      ctx.globalAlpha = uIn;
      // Cartoncino semi-trasparente solo dietro le due righe così il contrasto scuro/oro è fedele ma 85% del bunker resta visibile
      disegnaPillola(ctx, 540, 310, 820, 210, 'rgba(226, 232, 240, 0.78)', 'rgba(255, 255, 255, 0.45)', 2, 18);

      // Evidenziatori oro caldo L->R esattamente dietro "If I drop," e "I drop for the token."
      if (uHi1 > 0.01) {
        ctx.fillStyle = 'rgba(218, 168, 36, 0.90)';
        ctx.fillRect(365, 224, 350 * uHi1, 66);
      }
      if (uHi2 > 0.01) {
        ctx.fillStyle = 'rgba(218, 168, 36, 0.92)';
        ctx.fillRect(190, 318, 700 * uHi2, 66);
      }

      disegnaTesto(ctx, 'If I drop,', 540, 258, fmtFont(F_SERIF_REG, 62), '#1e293b', 'center', { stroke: null, blur: 0 });
      disegnaTesto(ctx, 'I drop for the token.', 540, 352, fmtFont(F_SERIF_REG, 62), '#1e293b', 'center', { stroke: null, blur: 0 });
      ctx.restore();
    }

    spolveraWhip(ctx, t, scDa, scA, true, true);
    return;
  }

  /* ---- SCENA 9 (17.267 - 19.500 s): Don't / quit. -> sfuma "n't" e "qu" lasciando brillare "Do / it [Token]" ---- */
  if (scIdx === 9) {
    const uDon = ss5(inv(0.06, 0.30, tl));
    const uQuit = ss5(inv(0.38, 0.64, tl));
    const uMorph = ss5(inv(0.88, 1.48, tl)); // beat 18.00s -> sfumatura fino a 19.50s

    // Riga 1: "Do" (rimane bianco luminoso) + "n't" (si sfoca e si attenua)
    // Riga 2: "qu" (si sfoca e si attenua) + "it" (rimane bianco luminoso) + Gettone come punto finale
    const fBig = fmtFont(F_SERIF_REG, 146);
    const y1 = 262, y2 = 408;
    ctx.save();
    ctx.font = fBig;
    const wDont = ctx.measureText("Don't").width;
    const wDo = ctx.measureText('Do').width;
    const wQuit = ctx.measureText('quit').width;
    const wQu = ctx.measureText('qu').width;
    ctx.restore();

    const x1Left = 540 - wDont * 0.5;
    const x2Left = 540 - (wQuit + 34) * 0.5;

    if (uDon > 0.01) {
      const aDim = uDon * (1 - uMorph * 0.78);
      const blurDim = (1 - uDon) * 14 + uMorph * 7;
      disegnaTesto(ctx, 'Do', x1Left, y1, fBig, '#ffffff', 'left', { alpha: uDon, strokeW: 9 });
      disegnaSfumato(ctx, y1 - 90, 180, b => {
        disegnaTesto(b, "n't", x1Left + wDo, 90, fBig, '#94a3b8', 'left', { strokeW: 6 });
      }, blurDim, aDim);
    }

    if (uQuit > 0.01) {
      const aDimQ = uQuit * (1 - uMorph * 0.78);
      const blurDimQ = (1 - uQuit) * 14 + uMorph * 7;
      disegnaSfumato(ctx, y2 - 90, 180, b => {
        disegnaTesto(b, 'qu', x2Left, 90, fBig, '#94a3b8', 'left', { strokeW: 6 });
      }, blurDimQ, aDimQ);
      disegnaTesto(ctx, 'it', x2Left + wQu, y2, fBig, '#ffffff', 'left', { alpha: uQuit, strokeW: 9 });

      const dotR = 16 + 10 * uMorph;
      disegnaGettoneOro(ctx, x2Left + wQuit + 30, y2 + 34, dotR, t, {
        body: true, rayCount: 14, rayLen: dotR * 3.8, glowScale: 3.2, alpha: uQuit
      });
    }

    spolveraWhip(ctx, t, scDa, scA, true, false);
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 10 (19.500 - 21.000 s): VITTORIA — THE TOKEN / WON'T FIND ITSELF. + keep searching. + Trofeo alzato ---- */
  if (scIdx === 10) {
    const ap = (state && state.apexPos) || new T.Vector3(0, 7.2, -7.8);
    const fb10 = { ...proietta3D(ap.x, ap.y, ap.z, cam, T), r: 46 };
    const hero10 = findTrofeoActor(10);
    const pos10 = getManiScreen(hero10, cam, T, fb10);
    const tx = pos10.x, ty = pos10.y, tr = pos10.r;

    disegnaConoLuce(ctx, 540, -20, 220, tx, ty + 780, 1100, 'rgba(255, 224, 145, 0.20)', 'rgba(255, 195, 75, 0.0)');
    disegnaGettoneOro(ctx, tx, ty, tr, t, { body: true, glowScale: 3.0, rayAlpha: 0.30, rayLen: 640 });

    // Particelle dorate attorno al gettone alzato a coppa
    ctx.save();
    for (let i = 0; i < 32; i++) {
      const ang = i * 2.39996 + t * (0.12 + (i % 5) * 0.015);
      const rad = 75 + ((i * 37) % 300) + Math.sin(t * 1.2 + i) * 10;
      const px = tx + Math.cos(ang) * rad * 1.1;
      const py = ty + Math.sin(ang) * rad * 0.72;
      if (py < 480 || py > 1360) continue;
      ctx.globalAlpha = 0.30 + 0.14 * Math.sin(t * 1.6 + i);
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#ffe27a';
      ctx.beginPath();
      ctx.arc(px, py, 2.2 + (i % 4) * 1.1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const uHead = ss5(inv(0.06, 0.32, tl));
    const uSub = ss5(inv(0.32, 0.62, tl));
    disegnaSfumato(ctx, 145, 160, b => {
      disegnaTesto(b, 'THE TOKEN', 540, 80, fmtFont(F_COND, 92), '#f8fafc', 'center', {
        dy: (1 - uHead) * 18, strokeW: 8
      });
    }, (1 - uHead) * 14, uHead);
    if (uSub > 0.01) {
      disegnaSfumato(ctx, 238, 160, b => {
        disegnaTesto(b, "WON'T FIND ITSELF.", 540, 80, fmtFont(F_COND, 90), '#fde047', 'center', {
          dy: (1 - uSub) * 16, strokeW: 8
        });
      }, (1 - uSub) * 14, uSub);
    }

    if (tl >= 0.72) {
      const uKeep = ss5(inv(0.72, 1.05, tl));
      ctx.save();
      ctx.globalAlpha = uKeep;
      disegnaPillola(ctx, 540, 1685, 430, 68, 'rgba(15, 23, 42, 0.56)', 'rgba(255, 255, 255, 0.25)', 1.5, 16);
      disegnaTesto(ctx, 'keep searching.', 540, 1685, fmtFont(F_SERIF_IT, 44), '#f8fafc', 'center', { strokeW: 5 });
      ctx.restore();
    }

    flashConfine(ctx, t, scDa, scA, true, false);
    return;
  }
}

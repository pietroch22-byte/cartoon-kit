"""Sottotitoli a karaoke e caricamento della voce per film_disegnato.py (gli unici pezzi dei vecchi motori 2D che servono ancora).
Unico stile (scelta dell'utente): karaoke, 1-3 parole in maiuscolo, bianche con bordo scuro, la parola detta in giallo."""
import os
import subprocess

import numpy as np
import skia

W, H = 1080, 1920
_FONT_DIRS = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts"),
              "/System/Library/Fonts/Supplemental", "/System/Library/Fonts", "/Library/Fonts",
              os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")]
_tf = None


def _col(hexstr, a=1.0):
    h = hexstr.lstrip("#")
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _paint(color, stroke=None, blur=None):
    p = skia.Paint(AntiAlias=True)
    p.setColor(color if not isinstance(color, str) else _col(color))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def _typeface():
    global _tf
    if _tf is None:
        for n in ("Fredoka-Bold.ttf", "Arial Rounded Bold.ttf", "arialbd.ttf"):
            for d in _FONT_DIRS:
                p = os.path.join(d, n)
                if os.path.exists(p):
                    _tf = skia.Typeface.MakeFromFile(p)
                    break
            if _tf:
                break
        _tf = _tf or skia.Typeface.MakeDefault()
    return _tf


def _back_out(x):
    x = max(0.0, min(1.0, x)); c1 = 1.9
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def _clean(w):
    return w.strip('"\'«»“”…').rstrip(",.;:!?…»").lstrip("«").replace("*", "")


def _misura_font(words, max_w=920, base_size=96.0):
    """Restituisce (font, widths, space, total, size) evitando testo fuori banda sicura."""
    tf = _typeface()
    size = float(base_size)
    font = skia.Font(tf, size)
    space = font.measureText(" ") + size * 0.22
    widths = [font.measureText(w) for w in words]
    total = sum(widths) + space * max(0, len(words) - 1)
    if total > max_w and total > 0:
        size *= max_w / total
        font = skia.Font(tf, size)
        space = font.measureText(" ") + size * 0.22
        widths = [font.measureText(w) for w in words]
        total = sum(widths) + space * max(0, len(words) - 1)
    return font, widths, space, total, size


def _finestra_blocco(chunks, idx, total=None, lead=0.03, tail=0.60):
    """Calcola [t0, t1] effettivi in cui `chunks[idx]` resta visibile sullo schermo."""
    blk = chunks[idx]
    t0 = max(0.0, blk[0][1] - lead)
    nxt = chunks[idx + 1][0][1] - lead if idx + 1 < len(chunks) else 1e9
    t1 = min(nxt, blk[-1][2] + tail)
    if total is not None:
        t1 = min(float(total), t1)
    return t0, max(t0, t1)


def _puo_unire(a, b, max_words=4, max_chars=22, min_font=68.0, max_w=920, max_gap=0.35):
    """Verifica se due blocchi adiacenti si possono fondere mantenendo leggibilita in una riga."""
    if len(a) + len(b) > max_words:
        return False
    gap = b[0][1] - a[-1][2]
    if gap > max_gap:
        return False
    txt = " ".join(x[0] for x in a + b)
    if len(txt) > max_chars:
        return False
    _, _, _, tot, sz = _misura_font([x[0] for x in a + b], max_w=max_w)
    return sz >= min_font and tot <= max_w + 1.0


def blocchi(words, max_words=3, max_chars=16, maiuscolo=True, leggibile=False, total=None):
    """words = [(parola, inizio, fine)] -> blocchi di 1-3 parole; se `leggibile=True`, evita lampi < 0.70 s."""
    out, cur, fine_frase = [], [], []
    for raw, st, en in words:
        w = _clean(raw).upper() if maiuscolo else _clean(raw)
        if not w:
            continue
        if cur and (len(cur) >= max_words or len(" ".join(x[0] for x in cur)) + 1 + len(w) > max_chars):
            out.append(cur); fine_frase.append(False); cur = []
        cur.append((w, st, en))
        tail = raw.rstrip("»\"'*")[-1:]
        if tail in ".?!,:;…":
            out.append(cur); fine_frase.append(tail in ".?!…"); cur = []
    if cur:
        out.append(cur); fine_frase.append(True)
    if not leggibile or len(out) < 2:
        return out
    changed = True
    while changed and len(out) >= 2:
        changed = False
        for i in range(len(out)):
            t0, t1 = _finestra_blocco(out, i, total=total)
            hold = t1 - t0
            chars = sum(len(x[0]) for x in out[i])
            if hold >= 0.70 and (chars / max(hold, 0.01)) <= 19.5:
                continue
            cand_next = i + 1 < len(out) and (not fine_frase[i] or hold < 0.48) and _puo_unire(out[i], out[i + 1])
            cand_prev = i > 0 and (not fine_frase[i - 1] or hold < 0.48) and _puo_unire(out[i - 1], out[i])
            if cand_next and cand_prev:
                # Preferisci unire con il vicino che non attraversa fine frase e minimizza i caratteri.
                if not fine_frase[i] and fine_frase[i - 1]:
                    cand_prev = False
                elif fine_frase[i] and not fine_frase[i - 1]:
                    cand_next = False
                else:
                    ln_n = sum(len(x[0]) for x in out[i + 1])
                    ln_p = sum(len(x[0]) for x in out[i - 1])
                    if ln_p <= ln_n:
                        cand_next = False
                    else:
                        cand_prev = False
            if cand_next:
                out[i] = out[i] + out[i + 1]
                fine_frase[i] = fine_frase[i + 1]
                del out[i + 1]; del fine_frase[i + 1]
                changed = True; break
            if cand_prev:
                out[i - 1] = out[i - 1] + out[i]
                fine_frase[i - 1] = fine_frase[i]
                del out[i]; del fine_frase[i]
                changed = True; break
            if i + 1 < len(out) and len(out[i + 1]) >= 2 and (not fine_frase[i] or hold < 0.48) and _puo_unire(out[i], [out[i + 1][0]]):
                rem = [out[i + 1][1:]]
                rem_t0 = max(0.0, rem[0][0][1] - 0.03)
                rem_nxt = out[i + 2][0][1] - 0.03 if i + 2 < len(out) else 1e9
                rem_t1 = min(rem_nxt, rem[0][-1][2] + 0.60)
                if total is not None:
                    rem_t1 = min(float(total), rem_t1)
                if (rem_t1 - rem_t0) >= 0.68:
                    out[i] = out[i] + [out[i + 1].pop(0)]
                    changed = True; break
    return out


def controlla_leggibilita(chunks, total=None, max_w=920, min_hold=0.65, max_cps=20.0, min_font=66.0, t_min=None, t_max=None):
    """Audit dei blocchi karaoke: durata visibile, velocita di lettura (car/s), scala font e taglio finale."""
    righe, problemi = [], []
    min_h_found, max_cps_found, min_f_found = 999.0, 0.0, 999.0
    n_chk = 0
    for i, blk in enumerate(chunks):
        words = [x[0] for x in blk]
        txt = " ".join(words)
        t0, t1 = _finestra_blocco(chunks, i, total=total)
        if t_min is not None and t1 <= float(t_min):
            continue
        if t_max is not None and t0 >= float(t_max):
            continue
        n_chk += 1
        hold = max(0.0, t1 - t0)
        chars = sum(len(w) for w in words)
        cps = chars / hold if hold > 0.01 else 999.0
        _, _, _, width_px, font_sz = _misura_font(words, max_w=max_w)
        flags = []
        if hold < min_hold:
            flags.append(f"LAMPO({hold:.2f}s<{min_hold:.2f}s)")
        if cps > max_cps and hold < 1.1:
            flags.append(f"VELOCE({cps:.1f}>{max_cps:.0f}c/s)")
        if font_sz < min_font:
            flags.append(f"PICCOLO({font_sz:.0f}px<{min_font:.0f}px)")
        if total is not None and i == len(chunks) - 1 and (t1 - blk[-1][2]) < 0.35 and (float(total) - blk[-1][2]) < 0.35:
            flags.append(f"TAGLIATO_FINE(+{max(0.0, t1 - blk[-1][2]):.2f}s)")
        min_h_found = min(min_h_found, hold)
        max_cps_found = max(max_cps_found, cps)
        min_f_found = min(min_f_found, font_sz)
        row = {
            "idx": i, "t0": round(t0, 3), "t1": round(t1, 3), "hold": round(hold, 3),
            "chars": chars, "cps": round(cps, 1), "font_px": round(font_sz, 1),
            "width_px": round(width_px, 1), "text": txt, "flags": flags, "ok": not flags,
        }
        righe.append(row)
        if flags:
            problemi.append(row)
    return {
        "ok": len(problemi) == 0,
        "chunks": n_chk,
        "bad": len(problemi),
        "min_hold": round(min_h_found, 3) if n_chk else 0.0,
        "max_cps": round(max_cps_found, 1) if n_chk else 0.0,
        "min_font": round(min_f_found, 1) if n_chk else 0.0,
        "problemi": problemi,
        "righe": righe,
    }


def al_tempo(chunks, t):
    """Il blocco da mostrare al tempo t: (parole, indice della parola detta, età del blocco) oppure None."""
    lead, cur = 0.03, None
    for blk in chunks:
        if blk[0][1] - lead <= t:
            cur = blk
        else:
            break
    if cur is None or t >= cur[-1][2] + 0.6:
        return None
    return [w[0] for w in cur], max(i for i, w in enumerate(cur) if w[1] - lead <= t), t - cur[0][1]


def disegna(c, words, hot, age, y=1385, max_w=920):
    font, widths, space, total, size = _misura_font(words, max_w=max_w)
    pop = 0.85 + 0.15 * _back_out(min(1.0, age / 0.12))
    c.save(); c.translate(W / 2, y); c.scale(pop, pop)
    x = -total / 2
    for i, (w, wd) in enumerate(zip(words, widths)):
        blob = skia.TextBlob(w, font)
        c.drawTextBlob(blob, x + 5, 9, _paint(_col("#000000", 0.45), blur=7))
        c.drawTextBlob(blob, x, 0, _paint("#2A1730", stroke=size * 0.19))
        c.drawTextBlob(blob, x, 0, _paint("#FFCE40" if i == hot else "#FFFFFF"))
        x += wd + space
    c.restore()


def carica_voce(path, sr):
    """La voce dell'utente così com'è (mono, sr Hz): non si modifica mai."""
    import imageio_ffmpeg
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


if __name__ == "__main__":
    import argparse, json
    ap = argparse.ArgumentParser(description="Controllo leggibilita sottotitoli karaoke (Punto 2).")
    ap.add_argument("words_json", help="Percorso di words.json")
    ap.add_argument("--total", type=float, default=None, help="Durata totale del video (s)")
    ap.add_argument("--da", type=float, default=None, help="Filtra blocchi da questo secondo")
    ap.add_argument("--a", type=float, default=None, help="Filtra blocchi fino a questo secondo")
    ap.add_argument("--min-hold", type=float, default=0.65, help="Durata minima di un blocco (s)")
    ap.add_argument("--max-cps", type=float, default=20.0, help="Massimo caratteri/secondo")
    ap.add_argument("--leggibile", action="store_true", help="Raggruppa blocchi evitando lampi < 0.70 s")
    ap.add_argument("--json", action="store_true", help="Stampa risultato in JSON")
    args = ap.parse_args()
    raw = json.loads(open(args.words_json, encoding="utf-8").read())
    wlist = [(w["word"], w["start"], w["end"]) if isinstance(w, dict) else (w[2], w[0], w[1]) for w in raw]
    chs = blocchi(wlist, leggibile=args.leggibile, total=args.total)
    res = controlla_leggibilita(chs, total=args.total, min_hold=args.min_hold, max_cps=args.max_cps, t_min=args.da, t_max=args.a)
    if args.json:
        print(json.dumps(res, ensure_ascii=False))
    else:
        print(f"sottotitoli: {res['chunks']} blocchi, {res['bad']} problemi (hold min {res['min_hold']:.2f} s, picco {res['max_cps']:.1f} car/s, font min {res['min_font']:.0f} px)")
        for r in res["problemi"]:
            print(f"  BAD [{r['t0']:.2f}->{r['t1']:.2f}s {r['hold']:.2f}s {r['cps']:.1f}c/s] \"{r['text']}\" -> {', '.join(r['flags'])}")
    raise SystemExit(0 if res["ok"] else 1)

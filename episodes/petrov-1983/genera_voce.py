import sys, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d, script, voice, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 0.95
limit = int(sys.argv[6]) if len(sys.argv) > 6 else 10**9
k = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
sr = 24000
parts = []; n = 0
for line in open(script, encoding="utf-8"):
    line = line.strip()
    if not line: continue
    if line.startswith("#"):
        if line.startswith("## ") and parts: parts.append(np.zeros(int(sr*0.9)))
        continue
    for s in re.split(r"(?<=[.!?…])\s+", line):
        s = s.strip()
        if not s: continue
        t = s.replace("…", "...")
        for x, y in {"New York": "Niu Iork", "RYAN": "Ràian"}.items(): t = t.replace(x, y)
        a, sr = k.create(t, voice=voice, speed=speed, lang="it")
        parts.append(a); parts.append(np.zeros(int(sr*0.32)))
        n += 1
        if n >= limit: break
    parts.append(np.zeros(int(sr*0.25)))
    if n >= limit: break
audio = np.concatenate(parts)
sf.write(out, audio, sr)
print(out, round(len(audio)/sr, 1), "s")

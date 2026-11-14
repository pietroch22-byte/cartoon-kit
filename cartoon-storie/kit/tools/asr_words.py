"""Word timestamps of the user's recorded voice (faster-whisper).
Usage: python tools/asr_words.py voice.mp3 work/words.json [--lang it] [--model small]
Output: JSON [[start, end, word, probability], ...]. Put its path in the story: "voice": {"file": ..., "words": ...}.
Install once: pip install faster-whisper   (the model downloads on first run; if offline, ask the user for the
exact script text and let the engine spread the words, which is less precise)."""
import argparse, json, subprocess
import numpy as np
from faster_whisper import WhisperModel
ap = argparse.ArgumentParser(); ap.add_argument("audio"); ap.add_argument("out"); ap.add_argument("--lang", default="it"); ap.add_argument("--model", default="small")
a = ap.parse_args()
import imageio_ffmpeg
raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32).copy()
segs, _ = WhisperModel(a.model, device="cpu", compute_type="int8").transcribe(audio, language=a.lang, beam_size=5, word_timestamps=True, condition_on_previous_text=False)
out = [[round(w.start, 3), round(w.end, 3), w.word.strip(), round(w.probability, 2)] for s in segs for w in s.words]
json.dump(out, open(a.out, "w"), ensure_ascii=False)
print(f"{len(out)} words -> {a.out}. Low-confidence words (<0.6): " + ", ".join(w[2] for w in out if w[3] < 0.6))

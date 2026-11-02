"""Ramage · serveur Perch v2 complet (Google DeepMind, Apache 2.0).
Reçoit 5 s de son (PCM 16 bits mono, 32 kHz), renvoie les espèces les plus probables.
Aucun son n'est gardé : il est analysé en mémoire puis oublié."""
import json, os, time, urllib.request
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import numpy as np, onnxruntime as ort

MODEL_URL = "https://huggingface.co/justinchuby/Perch-onnx/resolve/main/perch_v2_no_dft.onnx"
LABELS_URL = "https://huggingface.co/cgeorgiaw/Perch/resolve/main/assets/labels.csv"
DIR = os.environ.get("PERCH_DIR", "/tmp/perch")
os.makedirs(DIR, exist_ok=True)

def fetch(url, path):
    if not os.path.exists(path):
        print("téléchargement", url, flush=True)
        urllib.request.urlretrieve(url, path + ".part"); os.rename(path + ".part", path)
    return path

LABELS = [l.strip().strip('"') for l in open(fetch(LABELS_URL, DIR + "/labels.csv"), encoding="utf-8").read().splitlines()[1:] if l.strip()]
SESS = ort.InferenceSession(fetch(MODEL_URL, DIR + "/perch_v2_no_dft.onnx"), providers=["CPUExecutionProvider"])
INP = SESS.get_inputs()[0].name
ALLOW = os.environ.get("ALLOW_ORIGIN", "*")
print("Perch prêt :", len(LABELS), "classes", flush=True)

def analyse(pcm16, top):
    x = np.frombuffer(pcm16, dtype="<i2").astype(np.float32) / 32768.0
    x = np.pad(x[:160000], (0, max(0, 160000 - len(x))))
    lg = SESS.run(["label"], {INP: x[None]})[0][0].astype(np.float64)
    p = np.exp(lg - lg.max()); p /= p.sum()          # softmax sur les 14 795 classes, comme à l'entraînement
    idx = np.argsort(-p)[:top]
    return [{"la": LABELS[i], "p": round(float(p[i]), 5)} for i in idx]

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", ALLOW)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
    def _json(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code); self._cors()
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self): self._json(200, {"ok": True, "modele": "Perch v2 complet (413 Mo)", "classes": len(LABELS)})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        if n <= 0 or n > 400000: return self._json(400, {"erreur": "envoie 5 s de PCM 16 bits mono 32 kHz (≤ 400 ko)"})
        t = time.time(); res = analyse(self.rfile.read(n), 30)
        self._json(200, {"top": res, "ms": int((time.time() - t) * 1000)})
    def log_message(self, *a): pass

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", 7860))), H).serve_forever()

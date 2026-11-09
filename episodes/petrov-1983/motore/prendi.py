import json, sys, os, time, struct, zlib, urllib.request
D = os.path.dirname(os.path.abspath(__file__)); KIT = f"{D}/asset-kit"
B = "https://github.com/pietroch22-byte/cartoon-kit/releases/download/v1/"
class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(NoRedir)
signed = {}
def url_of(z):
    if z not in signed or time.time() - signed[z][1] > 200:
        for i in range(8):
            try: op.open(B + z + ".zip")
            except urllib.error.HTTPError as e:
                if e.code in (301, 302, 307) and e.headers.get("Location"): signed[z] = (e.headers["Location"], time.time()); break
                print("attendo", e.code, flush=True); time.sleep(5 * 2 ** i)
    return signed[z][0]
def get(z, a, b):
    for i in range(6):
        try: return urllib.request.urlopen(urllib.request.Request(url_of(z), headers={"Range": f"bytes={a}-{b}"})).read()
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 503): signed.pop(z, None); time.sleep(2 ** i); continue
            raise
    raise SystemExit("download fallito")
models = sys.argv[1].split(","); tex = sys.argv[2].split(","); hdr = sys.argv[3].split(",")
tot = 0
for z in ["kit-texture-cieli-indice", "kit-modelli-1", "kit-modelli-2"]:
    L = sorted(json.load(open(f"{D}/kitdl/{z}.list.json")), key=lambda e: e["off"])
    offs = [e["off"] for e in L] + [None]
    for i, e in enumerate(L): e["end"] = offs[i+1]
    W = [e for e in L if not e["name"].endswith("/") and not os.path.exists(f"{KIT}/{e['name']}") and (
        any(e["name"].startswith(f"modelli/{m}/") for m in models) or any(e["name"].startswith(f"texture/{t}/") for t in tex) or e["name"] in [f"hdri/{h}.hdr" for h in hdr])]
    # gruppi contigui
    groups = []
    for e in W:
        if groups and groups[-1][-1]["end"] == e["off"] and e["off"] - groups[-1][0]["off"] < 60e6: groups[-1].append(e)
        else: groups.append([e])
    for g in groups:
        a = g[0]["off"]; last = g[-1]; b = (last["end"] - 1) if last["end"] else a + 10**9
        if not last["end"]: b = last["off"] + last["csz"] + 4096
        blob = get(z, a, b)
        for e in g:
            p = e["off"] - a; nl, el = struct.unpack("<HH", blob[p+26:p+30]); s = p + 30 + nl + el
            data = blob[s:s+e["csz"]]
            if e["meth"] == 8: data = zlib.decompress(data, -15)
            path = f"{KIT}/{e['name']}"; os.makedirs(os.path.dirname(path), exist_ok=True); open(path, "wb").write(data)
            tot += e["usz"]
    print(z, len(W), "file in", len(groups), "richieste", flush=True)
print("scaricati", round(tot/1e6, 1), "MB")

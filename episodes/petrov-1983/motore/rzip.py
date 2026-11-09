"""Lettore zip remoto via HTTP Range: elenca ed estrae singoli file."""
import sys, struct, zlib, urllib.request, json, os
def get(url, a, b):
    r = urllib.request.Request(url, headers={"Range": f"bytes={a}-{b}"})
    return urllib.request.urlopen(r).read()
def size(url):
    r = urllib.request.Request(url, headers={"Range": "bytes=0-0"}); return int(urllib.request.urlopen(r).headers["Content-Range"].split("/")[1])
def listing(url):
    n = size(url); tail = get(url, max(0, n-70000), n-1)
    i = tail.rfind(b"PK\x05\x06"); cd_size, cd_off = struct.unpack("<II", tail[i+12:i+20]); entries = struct.unpack("<H", tail[i+10:i+12])[0]
    j = tail.rfind(b"PK\x06\x07")
    if cd_off == 0xFFFFFFFF or j >= 0:  # zip64
        loc = struct.unpack("<Q", tail[j+8:j+16])[0]; rec = get(url, loc, loc+56)
        cd_size, cd_off = struct.unpack("<QQ", rec[40:56])
    cd = get(url, cd_off, cd_off+cd_size-1); out = []; p = 0
    while p < len(cd) and cd[p:p+4] == b"PK\x01\x02":
        meth, = struct.unpack("<H", cd[p+10:p+12]); csz, usz = struct.unpack("<II", cd[p+20:p+28])
        nl, el, cl = struct.unpack("<HHH", cd[p+28:p+34]); off, = struct.unpack("<I", cd[p+42:p+46])
        name = cd[p+46:p+46+nl].decode("utf-8", "replace"); extra = cd[p+46+nl:p+46+nl+el]
        q = 0
        while q < len(extra):
            hid, hl = struct.unpack("<HH", extra[q:q+4])
            if hid == 1:
                vals = extra[q+4:q+4+hl]; k = 0
                if usz == 0xFFFFFFFF: usz, = struct.unpack("<Q", vals[k:k+8]); k += 8
                if csz == 0xFFFFFFFF: csz, = struct.unpack("<Q", vals[k:k+8]); k += 8
                if off == 0xFFFFFFFF: off, = struct.unpack("<Q", vals[k:k+8]); k += 8
            q += 4 + hl
        out.append({"name": name, "meth": meth, "csz": csz, "usz": usz, "off": off}); p += 46+nl+el+cl
    return out
def extract(url, e, dest):
    h = get(url, e["off"], e["off"]+29); nl, el = struct.unpack("<HH", h[26:30])
    s = e["off"]+30+nl+el; data = get(url, s, s+e["csz"]-1) if e["csz"] else b""
    if e["meth"] == 8: data = zlib.decompress(data, -15)
    path = os.path.join(dest, e["name"]); os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "wb").write(data)
if __name__ == "__main__":
    url = sys.argv[1]; L = listing(url)
    json.dump(L, open(sys.argv[2], "w")); print(len(L), "file", round(sum(e["usz"] for e in L)/1e6), "MB")

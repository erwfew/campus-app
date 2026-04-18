import struct, zlib, os

def make_png(r, g, b, s=48):
    def ck(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    h = b'\x89PNG\r\n\x1a\n'
    ih = ck(b'IHDR', struct.pack('>IIBBBBB', s, s, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(s):
        raw += b'\x00' + bytes([r, g, b]) * s
    return h + ih + ck(b'IDAT', zlib.compress(raw)) + ck(b'IEND', b'')

d = os.path.dirname(os.path.abspath(__file__))
os.makedirs(d, exist_ok=True)

icons = {
    'home-active.png': (67, 97, 238),
    'nav.png': (67, 233, 123),
    'nav-active.png': (67, 233, 123),
    'study.png': (102, 126, 234),
    'study-active.png': (102, 126, 234),
    'sport.png': (240, 147, 251),
    'sport-active.png': (240, 147, 251),
    'profile.png': (250, 112, 154),
    'profile-active.png': (250, 112, 154),
}

for n, (r, g, b) in icons.items():
    with open(os.path.join(d, n), 'wb') as f:
        f.write(make_png(r, g, b))

print('Done. Files:', sorted(os.listdir(d)))

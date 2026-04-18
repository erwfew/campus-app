import struct, zlib, os, json, base64

def make_png(r, g, b, s=48):
    def ck(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = ck(b'IHDR', struct.pack('>IIBBBBB', s, s, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(s):
        raw += b'\x00' + bytes([r, g, b]) * s
    idat = ck(b'IDAT', zlib.compress(raw))
    iend = ck(b'IEND', b'')
    return sig + ihdr + idat + iend

base_dir = os.path.dirname(os.path.abspath(__file__))

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

output = {}
for name, (r, g, b) in icons.items():
    data = make_png(r, g, b)
    path = os.path.join(base_dir, name)
    with open(path, 'wb') as f:
        f.write(data)
    output[name] = len(data)

# Write results to a log file
log_path = os.path.join(base_dir, 'gen_log.txt')
with open(log_path, 'w') as f:
    f.write(json.dumps(output))
    f.write('\n')
    f.write('Files in dir: ' + str(sorted(os.listdir(base_dir))))

print('Done:', json.dumps(output))

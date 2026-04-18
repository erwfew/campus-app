import struct, zlib, os

def make_png(r, g, b, size=48):
    """Create a minimal solid-color PNG."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))

    raw = b''
    for y in range(size):
        raw += b'\x00' + bytes([r, g, b]) * size

    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

icons = {
    'home': (67, 97, 238),        # #4361ee blue
    'home-active': (67, 97, 238),
    'nav': (67, 233, 123),        # #43e97b green
    'nav-active': (67, 233, 123),
    'study': (102, 126, 234),     # #667eea purple-blue
    'study-active': (102, 126, 234),
    'sport': (240, 147, 251),     # #f093fb pink
    'sport-active': (240, 147, 251),
    'profile': (250, 112, 154),   # #fa709a rose
    'profile-active': (250, 112, 154),
}

outdir = os.path.join(os.path.dirname(__file__), 'static')
os.makedirs(outdir, exist_ok=True)

for name, (r, g, b) in icons.items():
    path = os.path.join(outdir, f'{name}.png')
    with open(path, 'wb') as f:
        f.write(make_png(r, g, b))
    print(f'Created {path}')

print('Done! Files:', os.listdir(outdir))

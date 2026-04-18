#!/usr/bin/env python3
"""Generate campus map marker icons (PNG)"""
import struct
import zlib
import math

def create_png(width, height, pixels):
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            idx = (y * width + x) * 4
            raw += bytes(pixels[idx:idx+4])
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def make_marker(size, fill_color):
    pixels = [0] * (size * size * 4)
    cx = size // 2
    cy_top = size // 3
    radius = size // 3

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            dx = x - cx
            dy = y - cy_top

            # Circle part
            dist = math.sqrt(dx*dx + dy*dy)

            # Teardrop tail
            in_tail = False
            if y > cy_top + radius // 2:
                tail_width = max(0, int(radius * 0.6 - (y - cy_top - radius//2) * 0.8))
                if abs(dx) <= tail_width:
                    in_tail = True

            if dist <= radius or in_tail:
                # White border
                if dist > radius - 3 and dist <= radius and not in_tail:
                    pixels[idx:idx+4] = [255, 255, 255, 255]
                elif in_tail and dist > radius - 3:
                    pixels[idx:idx+4] = [255, 255, 255, 255]
                else:
                    # Inner white circle
                    inner_r = radius * 0.35
                    if math.sqrt(dx*dx + dy*dy) <= inner_r:
                        pixels[idx:idx+4] = [255, 255, 255, 255]
                    else:
                        pixels[idx:idx+4] = list(fill_color)
            else:
                pixels[idx:idx+4] = [0, 0, 0, 0]

    return pixels

colors = {
    'teach': (66, 165, 245, 255),
    'library': (126, 87, 194, 255),
    'food': (239, 83, 80, 255),
    'dorm': (255, 152, 0, 255),
    'playground': (102, 187, 106, 255),
    'gym': (171, 71, 188, 255),
    'lab': (38, 166, 154, 255),
    'admin': (92, 107, 192, 255),
    'activity': (255, 112, 154, 255),
}

size = 64
for name, color in colors.items():
    pixels = make_marker(size, color)
    png_data = create_png(size, size, pixels)
    filename = f'marker-{name}.png'
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Generated {filename}')

print('Done!')

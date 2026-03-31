import struct, zlib, os

def create_png(size, filename):
    width = height = size
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            cx, cy = width / 2, height / 2
            r = size * 0.4
            dx, dy = abs(x - cx), abs(y - cy)
            in_rect = dx <= r and dy <= r
            dist_center = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            key_r = size * 0.2
            key_handle = dist_center < key_r and y < cy + size * 0.05
            key_shaft = abs(x - cx) < size * 0.04 and cy - size * 0.05 < y < cy + size * 0.3
            key_bit1 = cy + size * 0.15 < y < cy + size * 0.22 and cx < x < cx + size * 0.12
            key_bit2 = cy + size * 0.23 < y < cy + size * 0.30 and cx < x < cx + size * 0.08
            if in_rect:
                if key_handle or key_shaft or key_bit1 or key_bit2:
                    raw += bytes([255, 255, 255, 255])
                else:
                    raw += bytes([124, 131, 255, 255])
            else:
                raw += bytes([0, 0, 0, 0])

    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    compressed = zlib.compress(raw)

    with open(filename, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))

d = os.path.dirname(os.path.abspath(__file__))
create_png(48, os.path.join(d, 'icon48.png'))
create_png(128, os.path.join(d, 'icon128.png'))
print('Icons created')

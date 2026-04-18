import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { gzip } from 'zlib';

const base = dirname(new URL(import.meta.url).pathname);

function makePng(r, g, b, s = 48) {
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xEDB88320 & (-(c & 1)));
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const raw = Buffer.alloc(1 + s * 3 * s);
  let off = 0;
  for (let y = 0; y < s; y++) {
    raw[off++] = 0; // filter none
    for (let x = 0; x < s; x++) {
      raw[off++] = r;
      raw[off++] = g;
      raw[off++] = b;
    }
  }

  const compressed = require('zlib').deflateSync(raw);

  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), iend]);
}

const icons = {
  'home-active.png': [67, 97, 238],
  'nav.png': [67, 233, 123],
  'nav-active.png': [67, 233, 123],
  'study.png': [102, 126, 234],
  'study-active.png': [102, 126, 234],
  'sport.png': [240, 147, 251],
  'sport-active.png': [240, 147, 251],
  'profile.png': [250, 112, 154],
  'profile-active.png': [250, 112, 154],
};

for (const [name, [r, g, b]] of Object.entries(icons)) {
  const png = makePng(r, g, b);
  writeFileSync(join(base, name), png);
  console.log(`Created: ${name} (${png.length} bytes)`);
}
console.log('All done.');

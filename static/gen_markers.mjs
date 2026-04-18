import { writeFileSync } from 'fs';
import zlib from 'zlib';

function createPNG(width, height, pixels) {
  function chunk(type, data) {
    const c = Buffer.concat([type, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32ZlibCrc32(c);
    // Manual CRC32
    let crcVal = 0xFFFFFFFF;
    for (let i = 0; i < c.length; i++) {
      crcVal ^= c[i];
      for (let j = 0; j < 8; j++) {
        crcVal = (crcVal >>> 1) ^ (crcVal & 1 ? 0xEDB88320 : 0);
      }
    }
    crcVal = (crcVal ^ 0xFFFFFFFF) >>> 0;
    crc.writeUInt32BE(crcVal);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return Buffer.concat([len, c, crc]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk(Buffer.from('IHDR'), ihdrData);

  let raw = Buffer.alloc(0);
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      row[1 + x * 4] = pixels[idx];
      row[1 + x * 4 + 1] = pixels[idx + 1];
      row[1 + x * 4 + 2] = pixels[idx + 2];
      row[1 + x * 4 + 3] = pixels[idx + 3];
    }
    raw = Buffer.concat([raw, row]);
  }

  const compressed = zlib.deflateSync(raw);
  const idat = chunk(Buffer.from('IDAT'), compressed);
  const iend = chunk(Buffer.from('IEND'), Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

function makeMarker(size, fillColor) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = Math.floor(size / 2);
  const cyTop = Math.floor(size / 3);
  const radius = Math.floor(size / 3);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cyTop;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let inTail = false;
      if (y > cyTop + Math.floor(radius / 2)) {
        const tailWidth = Math.max(0, Math.floor(radius * 0.6 - (y - cyTop - radius / 2) * 0.8));
        if (Math.abs(dx) <= tailWidth) inTail = true;
      }

      if (dist <= radius || inTail) {
        // Inner white circle
        const innerR = radius * 0.35;
        if (Math.sqrt(dx * dx + dy * dy) <= innerR) {
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
          pixels[idx + 3] = 255;
        } else {
          pixels[idx] = fillColor[0];
          pixels[idx + 1] = fillColor[1];
          pixels[idx + 2] = fillColor[2];
          pixels[idx + 3] = fillColor[3];
        }
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  return pixels;
}

const colors = {
  teach: [66, 165, 245, 255],
  library: [126, 87, 194, 255],
  food: [239, 83, 80, 255],
  dorm: [255, 152, 0, 255],
  playground: [102, 187, 106, 255],
  gym: [171, 71, 188, 255],
  lab: [38, 166, 154, 255],
  admin: [92, 107, 192, 255],
  activity: [255, 112, 154, 255],
};

const size = 64;
for (const [name, color] of Object.entries(colors)) {
  const pixels = makeMarker(size, color);
  const png = createPNG(size, size, pixels);
  writeFileSync(`marker-${name}.png`, png);
  console.log(`Generated marker-${name}.png`);
}
console.log('Done!');

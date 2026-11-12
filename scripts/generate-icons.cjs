const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#78350F" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="190" fill="#FFFFFF" fill-opacity="0.2"/>
  <path d="M280 84L170 272H264L236 428L352 232H256L280 84Z" fill="#FFFFFF" filter="url(#shadow)"/>
  <path d="M276 96L182 260H264L242 396L336 244H256L276 96Z" fill="#FEF08A"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// PNG Generator helper
function createPNG(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Point in polygon helper for lightning bolt
function insidePolygon(point, vs) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Rounded rect distance
function roundedRectSDF(x, y, w, h, r) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.abs(x - cx) - (w / 2 - r);
  const dy = Math.abs(y - cy) - (h / 2 - r);
  const mx = Math.max(dx, 0);
  const my = Math.max(dy, 0);
  return Math.sqrt(mx * mx + my * my) + Math.min(Math.max(dx, dy), 0) - r;
}

function renderDayPopIcon(w, h, isMaskable) {
  // Lightning bolt coordinates in 0..1 space
  // Base polygon: [280, 84], [170, 272], [264, 272], [236, 428], [352, 232], [256, 232] scaled to 512
  const scale = isMaskable ? 0.65 : 0.82;
  const boltNorm = [
    [0.55, 0.16],
    [0.33, 0.53],
    [0.51, 0.53],
    [0.46, 0.84],
    [0.69, 0.45],
    [0.50, 0.45]
  ];
  
  // Transform to current resolution
  const bolt = boltNorm.map(([nx, ny]) => {
    const cx = 0.5;
    const cy = 0.5;
    const sx = (nx - cx) * scale + cx;
    const sy = (ny - cy) * scale + cy;
    return [sx * w, sy * h];
  });

  const cornerRadius = isMaskable ? 0 : w * 0.22;

  return createPNG(w, h, (x, y) => {
    // Check if inside rounded card (for non-maskable)
    if (!isMaskable) {
      const d = roundedRectSDF(x, y, w, h, cornerRadius);
      if (d > 0) return [0, 0, 0, 0]; // transparent outside
    }

    // Gradient background: #FBBF24 (251, 191, 36) -> #D97706 (217, 119, 6)
    const t = (x + y) / (w + h);
    let r = Math.round(251 * (1 - t) + 217 * t);
    let g = Math.round(191 * (1 - t) + 119 * t);
    let b = Math.round(36 * (1 - t) + 6 * t);
    let a = 255;

    // Soft inner glow circle in center
    const dx = x - w / 2;
    const dy = y - h / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const circleR = (w * 0.38) * (isMaskable ? 0.75 : 1);
    if (dist < circleR) {
      const blend = 0.25 * (1 - dist / circleR);
      r = Math.min(255, Math.round(r * (1 - blend) + 255 * blend));
      g = Math.min(255, Math.round(g * (1 - blend) + 255 * blend));
      b = Math.min(255, Math.round(b * (1 - blend) + 255 * blend));
    }

    // Lightning bolt with shadow
    const shadowDist = w * 0.025;
    const inShadow = insidePolygon([x, y - shadowDist], bolt);
    const inBolt = insidePolygon([x, y], bolt);

    if (inBolt) {
      // Warm bright yellow / white
      return [254, 240, 138, 255];
    } else if (inShadow) {
      // Soft warm drop shadow
      return [
        Math.round(r * 0.6),
        Math.round(g * 0.5),
        Math.round(b * 0.4),
        255
      ];
    }

    return [r, g, b, a];
  });
}

console.log('Generating PWA icons...');
const icon192 = renderDayPopIcon(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = renderDayPopIcon(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = renderDayPopIcon(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleIcon = renderDayPopIcon(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icon192);

console.log('Icons generated successfully in /public!');

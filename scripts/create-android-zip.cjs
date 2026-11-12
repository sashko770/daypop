const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function createZip(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8');
    const compressed = zlib.deflateRawSync(content);
    const uncompressedSize = content.length;
    const compressedSize = compressed.length;
    const fileCrc = crc32(content);

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general purpose flags
    localHeader.writeUInt16LE(8, 8); // compression method (deflate)
    localHeader.writeUInt16LE(0, 10); // time
    localHeader.writeUInt16LE(0, 12); // date
    localHeader.writeUInt32LE(fileCrc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    localChunks.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // deflate
    centralHeader.writeUInt16LE(0, 12); // time
    centralHeader.writeUInt16LE(0, 14); // date
    centralHeader.writeUInt32LE(fileCrc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk start
    centralHeader.writeUInt16LE(0, 36); // internal attr
    centralHeader.writeUInt32LE(0, 38); // external attr
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header

    centralChunks.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const b of centralChunks) centralDirSize += b.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localChunks, ...centralChunks, eocd]);
}

const publicDir = path.join(__dirname, '..', 'public');
const androidDir = path.join(publicDir, 'android');

const filesToZip = [
  {
    name: 'AndroidManifest.xml',
    content: fs.readFileSync(path.join(androidDir, 'AndroidManifest.xml')),
  },
  {
    name: 'twa-manifest.json',
    content: fs.readFileSync(path.join(androidDir, 'twa-manifest.json')),
  },
  {
    name: 'README-HEBREW.txt',
    content: fs.readFileSync(path.join(androidDir, 'README-HEBREW.txt')),
  },
  {
    name: 'res/drawable/pwa-192x192.png',
    content: fs.readFileSync(path.join(publicDir, 'pwa-192x192.png')),
  },
  {
    name: 'res/drawable/pwa-512x512.png',
    content: fs.readFileSync(path.join(publicDir, 'pwa-512x512.png')),
  },
  {
    name: 'res/drawable/pwa-maskable-512x512.png',
    content: fs.readFileSync(path.join(publicDir, 'pwa-maskable-512x512.png')),
  },
  {
    name: 'manifest.webmanifest',
    content: fs.readFileSync(path.join(publicDir, 'manifest.webmanifest')),
  },
];

const zipBuffer = createZip(filesToZip);
const zipPath = path.join(androidDir, 'daypop-android-package.zip');
fs.writeFileSync(zipPath, zipBuffer);
console.log('Successfully created daypop-android-package.zip! Size:', zipBuffer.length, 'bytes');

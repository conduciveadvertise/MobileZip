import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Standard CRC32 table for PNG generation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([len, payload, crc]);
}

function createPNG(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw PhoneZip Icon (Folder + Zipper + Wi-Fi Transfer arrow)
function drawPhoneZipIcon(x, y, w, h) {
  // Normalize coordinates (0..1)
  const nx = x / w;
  const ny = y / h;

  // Background gradient: #0a63f5 to #0243b3
  const bgR = Math.round(10 - ny * 8);
  const bgG = Math.round(99 - ny * 30);
  const bgB = Math.round(245 - ny * 60);

  // Check if inside main folder outline
  // Folder body: nx 0.2..0.8, ny 0.28..0.75
  // Folder tab: nx 0.2..0.48, ny 0.20..0.28
  const inTab = nx >= 0.22 && nx <= 0.48 && ny >= 0.20 && ny <= 0.30;
  const inBody = nx >= 0.22 && nx <= 0.78 && ny >= 0.28 && ny <= 0.75;
  const inFolder = inTab || inBody;

  // Zipper center line: nx 0.48..0.52, ny 0.32..0.68
  const inZipperStem = nx >= 0.485 && nx <= 0.515 && ny >= 0.32 && ny <= 0.65;
  
  // Zipper teeth (horizontal bars along zipper)
  const zipStep = Math.floor(ny * 40) % 2 === 0;
  const inZipTeeth = zipStep && nx >= 0.45 && nx <= 0.55 && ny >= 0.34 && ny <= 0.60;

  // Zipper pull slider (circle or rounded box at ny 0.60..0.68)
  const distSlider = Math.hypot(nx - 0.5, ny - 0.62);
  const inSlider = distSlider <= 0.05;

  // Wi-Fi / Transfer arcs at top right
  const distArc1 = Math.hypot(nx - 0.65, ny - 0.25);
  const inArc1 = distArc1 >= 0.08 && distArc1 <= 0.10 && ny <= 0.25;
  const distArc2 = Math.hypot(nx - 0.65, ny - 0.25);
  const inArc2 = distArc2 >= 0.13 && distArc2 <= 0.15 && ny <= 0.25;

  if (inSlider) {
    return [255, 255, 255, 255]; // White slider
  }
  if (inZipTeeth || inZipperStem) {
    return [56, 189, 248, 255]; // Cyan zipper teeth (#38bdf8)
  }
  if (inArc1 || inArc2) {
    return [56, 189, 248, 255]; // Cyan Wi-Fi arc
  }
  if (inFolder) {
    // Semi-transparent / bright folder fill
    return [255, 255, 255, 240];
  }

  return [bgR, bgG, bgB, 255];
}

// Generate assets directory
const assetsDir = path.resolve('assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Generating 1024x1024 assets/icon.png...');
const iconBuf = createPNG(1024, 1024, drawPhoneZipIcon);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuf);
fs.writeFileSync(path.join(assetsDir, 'logo.png'), iconBuf);
fs.writeFileSync(path.resolve('public/phonezip-logo.png'), iconBuf);
fs.writeFileSync(path.resolve('src/assets/phonezip-logo.png'), iconBuf);

console.log('Generating 128x128 favicon.png...');
const favBuf = createPNG(128, 128, drawPhoneZipIcon);
fs.writeFileSync(path.resolve('public/favicon.png'), favBuf);

console.log('Generating 2732x2732 assets/splash.png...');
// Splash screen: centered PhoneZip icon on brand dark background
function drawSplash(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background #020617 (slate-950)
  const bgR = 2;
  const bgG = 6;
  const bgB = 23;

  // Center logo bounding box: nx 0.35..0.65, ny 0.35..0.65
  if (nx >= 0.35 && nx <= 0.65 && ny >= 0.35 && ny <= 0.65) {
    const localX = (nx - 0.35) / 0.3;
    const localY = (ny - 0.35) / 0.3;
    return drawPhoneZipIcon(localX * 500, localY * 500, 500, 500);
  }

  return [bgR, bgG, bgB, 255];
}

const splashBuf = createPNG(1024, 1024, drawSplash);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashBuf);

console.log('All PNG assets generated successfully!');

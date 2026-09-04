import { readFileSync, writeFileSync, mkdirSync } from "fs";
import sharp from "sharp";

const icoPath = "C:\\Users\\user\\Downloads\\IMG-20260625-WA0003.ico";
const buf = readFileSync(icoPath);

const count = buf.readUInt16LE(4);

let bestOffset = 0;
let bestSize = 0;
let bestW = 0;
let bestH = 0;

for (let i = 0; i < count; i++) {
  const offset = 6 + i * 16;
  const w = buf[offset];
  const h = buf[offset + 1];
  const size = buf.readUInt32LE(offset + 8);
  const dataOffset = buf.readUInt32LE(offset + 12);
  const actualW = w === 0 ? 256 : w;
  const actualH = h === 0 ? 256 : h;

  if (actualW >= bestW && actualH >= bestH) {
    bestW = actualW;
    bestH = actualH;
    bestOffset = dataOffset;
    bestSize = size;
  }
}

const imageData = buf.subarray(bestOffset, bestOffset + bestSize);
const outDir = "android/app/src/main/res";
const dirs = ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];
for (const d of dirs) mkdirSync(`${outDir}/${d}`, { recursive: true });

// Android icon sizes: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
// Foreground for adaptive icon: same sizes but with padding (use as-is, Android scales)

const sizeMap = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

if (imageData[0] === 0x89 && imageData[1] === 0x50) {
  for (const [dir, size] of Object.entries(sizeMap)) {
    const resized = await sharp(imageData).resize(size, size).png().toBuffer();
    writeFileSync(`${outDir}/${dir}/ic_launcher.png`, resized);
    writeFileSync(`${outDir}/${dir}/ic_launcher_round.png`, resized);
    writeFileSync(`${outDir}/${dir}/ic_launcher_foreground.png`, resized);
  }
} else {
  const bmpHeaderSize = imageData.readUInt32LE(0);
  const pixelOffset = 14 + bmpHeaderSize;
  const width = imageData.readInt32LE(4);
  const height = imageData.readInt32LE(8) / 2;
  const bpp = imageData.readUInt16LE(14);

  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = pixelOffset + (height - 1 - y) * (width * (bpp / 8)) + x * (bpp / 8);
      const dstIdx = (y * width + x) * 4;
      raw[dstIdx + 2] = imageData[srcIdx];
      raw[dstIdx + 1] = imageData[srcIdx + 1];
      raw[dstIdx] = imageData[srcIdx + 2];
      raw[dstIdx + 3] = bpp === 32 ? imageData[srcIdx + 3] : 255;
    }
  }

  for (const [dir, size] of Object.entries(sizeMap)) {
    const resized = await sharp(raw, { raw: { width, height, channels: 4 } })
      .resize(size, size)
      .png()
      .toBuffer();
    writeFileSync(`${outDir}/${dir}/ic_launcher.png`, resized);
    writeFileSync(`${outDir}/${dir}/ic_launcher_round.png`, resized);
    writeFileSync(`${outDir}/${dir}/ic_launcher_foreground.png`, resized);
  }
}

console.log("Icons regenerated successfully");

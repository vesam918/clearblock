import sharp from "sharp";
import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(import.meta.dirname, "../src/icons");
await mkdir(output, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const radius = Math.round(size * 0.24);
  const stroke = Math.max(1, Math.round(size * 0.07));
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#6D5EF7"/><path d="M${size*.28} ${size*.52}l${size*.14} ${size*.14} ${size*.31}-${size*.34}" fill="none" stroke="white" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(resolve(output, `icon-${size}.png`));
}
console.log("Generated ClearBlock icons");

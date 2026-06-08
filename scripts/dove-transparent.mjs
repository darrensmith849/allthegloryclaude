// One-off: read public/media/logo-dove.jpg, build an alpha mask from
// the luminance (dark → transparent, bright → opaque), and write a
// transparent PNG so the dove + golden sunburst can sit on any
// background without the black square showing.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const SRC = "/Users/danieljenkins/allthegloryclaude/public/media/logo-dove.jpg";
const OUT_PNG = "/Users/danieljenkins/allthegloryclaude/public/media/logo-dove.png";

const img = sharp(SRC);
const { width, height } = await img.metadata();

// 1. Pull raw RGB
const { data: rgb } = await sharp(SRC)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// 2. Build an alpha channel from luminance with a soft knee so edges
//    on the sunburst halo don't look chopped.
const px = width * height;
const alpha = Buffer.alloc(px);
for (let i = 0; i < px; i++) {
  const r = rgb[i * 3];
  const g = rgb[i * 3 + 1];
  const b = rgb[i * 3 + 2];
  // Rec. 601 luma — closest match to perceived brightness on this asset
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  // Smoothstep over [12, 64] — pixels under 12 fully transparent,
  // over 64 fully opaque, with a gentle ramp between so glow edges
  // taper instead of clipping.
  let a;
  if (l <= 12) a = 0;
  else if (l >= 64) a = 255;
  else {
    const t = (l - 12) / (64 - 12);
    a = Math.round(t * t * (3 - 2 * t) * 255);
  }
  alpha[i] = a;
}

// 3. Recombine into an RGBA PNG.
const rgba = Buffer.alloc(px * 4);
for (let i = 0; i < px; i++) {
  rgba[i * 4]     = rgb[i * 3];
  rgba[i * 4 + 1] = rgb[i * 3 + 1];
  rgba[i * 4 + 2] = rgb[i * 3 + 2];
  rgba[i * 4 + 3] = alpha[i];
}

await sharp(rgba, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(OUT_PNG);

console.log("Wrote", OUT_PNG);

import fs from "node:fs";
import path from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage: node scripts/import-media.mjs /Users/danieljenkins/Desktop");
  process.exit(1);
}

const destDir = path.join(process.cwd(), "public", "media");
fs.mkdirSync(destDir, { recursive: true });

const map = [
  { fromContains: "dad", to: "dad.jpg" },
  { fromContains: "tunnel", to: "tunnel.jpg" },
  { fromContains: "cover", to: "cover.jpg" },
];

const files = fs.readdirSync(srcDir);

for (const m of map) {
  const match = files.find((f) => f.toLowerCase().includes(m.fromContains));
  if (!match) continue;
  fs.copyFileSync(path.join(srcDir, match), path.join(destDir, m.to));
  console.log(`Copied ${match} -> public/media/${m.to}`);
}

console.log("Done. Now: git add public/media && git commit && git push");

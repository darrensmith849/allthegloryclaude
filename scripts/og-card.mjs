// Builds public/og-card.jpg — the 1200x630 link preview that social
// apps show when alltheglory.co.za is pasted into WhatsApp, Facebook,
// iMessage etc.
//
// The design mirrors the Brevo album email (Marketing/Email Campaign/
// template.html): sand field, cream card inside a double gold frame,
// dove mark, the artwork, and the album title set in Georgia. Palette
// and type are lifted from that template so the email and the shared
// link read as one piece.
//
// Two deliberate departures from the email:
//  - Landscape, so the artwork sits beside the title rather than above it.
//  - The dove is a dark medallion. The email drops the white-on-black
//    dove straight onto cream, where it all but disappears; circle-
//    cropping the original black-field JPEG keeps the sunburst glowing.
//
// Run: node scripts/og-card.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ART = path.join(ROOT, "public/media/ocean.jpg");
const DOVE = path.join(ROOT, "public/media/logo-dove.jpg");
const OUT = path.join(ROOT, "public/og-card.jpg");

// Palette — copied from the email template.
const SAND = "#efe7d8";
const CREAM = "#fbf6ec";
const FRAME = "#b89a5e";
const RULE = "#dcc79c";
const GOLD = "#a7822b";
const MUTED = "#a99a78";
const INK = "#2a241c";

const W = 1200;
const H = 630;

// Frame geometry.
const MARGIN = 14; // sand showing around the card
const PAD = 12; // cream between the outer frame and the inner rule
const INNER = MARGIN + PAD; // inner rule inset

// Content box, inside the inner rule.
const CX0 = 64;
const CY0 = 62;
const CY1 = H - 62;
const CH = CY1 - CY0;

// Left column: the painting.
const ART_W = 486;
const ART_H = Math.round((528 / 717) * ART_W); // keep the painting's aspect
const CAP_GAP = 11;
const CAP_H = 15;
const ART_BLOCK = ART_H + CAP_GAP + CAP_H;
const ART_X = CX0;
const ART_Y = CY0 + Math.round((CH - ART_BLOCK) / 2);

// Right column: the masthead + title stack.
const COL_X = ART_X + ART_W + 50;
const COL_W = W - 64 - COL_X;
const MID = COL_X + COL_W / 2;

const DOVE_D = 92;

// The dove only fills the middle ~40% of its 1254px source; the rest is
// black field. Crop to a square around the mark itself so the medallion
// reads as a crest rather than a dark dot. Sized so the dove stands at
// ~65% of the disc, which keeps its wingtips clear of the curve.
const DOVE_SRC = { left: 186, top: 136, width: 940, height: 940 };

// librsvg adds the letter-spacing after the final glyph too, which drags
// centred text left by half a space. Nudge it back.
const track = (ls) => ls / 2;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const art = await sharp(ART)
  .resize(ART_W, ART_H, { fit: "cover", position: "centre" })
  .toBuffer();

// Circle-crop the black-field dove into a medallion.
const mask = Buffer.from(
  `<svg width="${DOVE_D}" height="${DOVE_D}"><circle cx="${DOVE_D / 2}" cy="${
    DOVE_D / 2
  }" r="${DOVE_D / 2}" fill="#fff"/></svg>`,
);
const dove = await sharp(DOVE)
  .extract(DOVE_SRC)
  .resize(DOVE_D, DOVE_D, { fit: "cover" })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

// Walk the right-hand stack down from a cursor, then centre the whole
// run against the painting so neither column floats.
const GAPS = { eyebrow: 40, kicker: 30, title: 76, title2: 58, meta: 44, rule: 32, url: 36 };
const STACK_H =
  DOVE_D + Object.values(GAPS).reduce((a, b) => a + b, 0) + 6; // +6 descender
const doveY = CY0 + Math.round((CH - STACK_H) / 2);

const eyebrowY = doveY + DOVE_D + GAPS.eyebrow;
const kickerY = eyebrowY + GAPS.kicker;
const titleY = kickerY + GAPS.title;
const titleY2 = titleY + GAPS.title2;
const metaY = titleY2 + GAPS.meta;
const ruleY = metaY + GAPS.rule;
const urlY = ruleY + GAPS.url;

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${SAND}"/>

  <!-- Cream card inside the outer gold frame -->
  <rect x="${MARGIN + 0.5}" y="${MARGIN + 0.5}" width="${W - MARGIN * 2 - 1}" height="${
    H - MARGIN * 2 - 1
  }" fill="${CREAM}" stroke="${FRAME}" stroke-width="1"/>

  <!-- Inner gold rule -->
  <rect x="${INNER + 0.5}" y="${INNER + 0.5}" width="${W - INNER * 2 - 1}" height="${
    H - INNER * 2 - 1
  }" fill="none" stroke="${RULE}" stroke-width="1"/>

  <!-- Hairline around the painting -->
  <rect x="${ART_X - 0.5}" y="${ART_Y - 0.5}" width="${ART_W + 1}" height="${
    ART_H + 1
  }" fill="none" stroke="${RULE}" stroke-width="1"/>

  <text x="${ART_X + ART_W / 2}" y="${ART_Y + ART_H + CAP_GAP + 11}" text-anchor="middle"
        font-family="Helvetica, Arial" font-size="13" fill="${MUTED}">Artwork by <tspan fill="${GOLD}">Debbie Clark</tspan></text>

  <text x="${MID + track(7)}" y="${eyebrowY}" text-anchor="middle" font-family="Georgia"
        font-size="20" letter-spacing="7" fill="${GOLD}">ALL THE GLORY</text>

  <text x="${MID + track(4)}" y="${kickerY}" text-anchor="middle" font-family="Helvetica, Arial"
        font-size="13" letter-spacing="4" fill="${MUTED}">THE NEW ALBUM &#183; OUT NOW</text>

  <text x="${MID}" y="${titleY}" text-anchor="middle" font-family="Georgia"
        font-size="54" fill="${INK}">${esc("From Darkness")}</text>
  <text x="${MID}" y="${titleY2}" text-anchor="middle" font-family="Georgia"
        font-size="54" fill="${INK}">${esc("To Light")}</text>

  <text x="${MID + track(1)}" y="${metaY}" text-anchor="middle" font-family="Helvetica, Arial"
        font-size="16" letter-spacing="1" fill="${MUTED}">A worship album &#160;&#183;&#160; 7 songs</text>

  <line x1="${MID - 40}" y1="${ruleY}" x2="${MID + 40}" y2="${ruleY}" stroke="${RULE}" stroke-width="1"/>

  <text x="${MID + track(2)}" y="${urlY}" text-anchor="middle" font-family="Georgia"
        font-size="19" letter-spacing="2" fill="${INK}">alltheglory.co.za</text>
</svg>`;

const info = await sharp(Buffer.from(svg))
  .composite([
    { input: art, top: ART_Y, left: ART_X },
    { input: dove, top: doveY, left: Math.round(MID - DOVE_D / 2) },
  ])
  .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(OUT);

console.log(`og-card.jpg  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);

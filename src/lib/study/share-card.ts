// "Share this day": a 1080 x 1350 picture card of one of the owner's days
// in the album flyer's style - cream paper, gold frame, the dove, the day,
// its title and takeaway - drawn in the browser on a canvas.

export interface DayCard {
  dayNumber: number;
  dateLabel: string; // e.g. "Monday 28 September"
  title: string;
  takeaway?: string;
  author?: string;
}

const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, y: number, spacing: number) {
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = (W - total) / 2;
  [...text].forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function drawDayCard(card: DayCard, serif: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  await Promise.all([
    document.fonts?.load(`76px ${serif}`).catch(() => {}),
    document.fonts?.load(`italic 44px ${serif}`).catch(() => {}),
  ]);

  // Paper and the gold frame.
  ctx.fillStyle = "#efe6d6";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fbf8f1";
  ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "#c9aa64";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.strokeStyle = "#dcc58e";
  ctx.lineWidth = 1;
  ctx.strokeRect(72, 72, W - 144, H - 144);

  // The dove.
  try {
    const dove = await loadImage("/media/logo-dove.png");
    const crop = 700;
    ctx.drawImage(dove, (dove.width - crop) / 2 + 36, (dove.height - crop) / 2 - 22, crop, crop, W / 2 - 90, 120, 180, 180);
  } catch {
    // no dove - the card still works
  }

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#a8842c";
  ctx.font = `34px ${serif}`;
  spaced(ctx, "ALL THE GLORY", 360, 14);
  ctx.fillStyle = "#857967";
  ctx.font = `20px ${serif}`;
  spaced(ctx, "THE STUDY", 404, 10);

  // The day, title, takeaway and name - measured first, then centred in
  // the space between the heading and the footer.
  ctx.textAlign = "center";
  ctx.font = `76px ${serif}`;
  const titleLines = wrap(ctx, card.title, 860).slice(0, 4);
  ctx.font = `italic 44px ${serif}`;
  const quoteLines = card.takeaway ? wrap(ctx, `“${card.takeaway}”`, 800).slice(0, 7) : [];
  const height =
    40 + 34 + titleLines.length * 90 + (quoteLines.length ? 70 + quoteLines.length * 62 : 0) + (card.author ? 60 : 0);
  let y = Math.max(470, 450 + (1180 - 450 - height) / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#a8842c";
  ctx.font = `600 28px ${serif}`;
  spaced(ctx, `DAY ${card.dayNumber}  ·  ${card.dateLabel.toUpperCase()}`, y + 28, 5);
  y += 40 + 34 + 60;

  ctx.textAlign = "center";
  ctx.fillStyle = "#1e1813";
  ctx.font = `76px ${serif}`;
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, y);
    y += 90;
  }

  if (quoteLines.length) {
    ctx.fillStyle = "#c9aa64";
    ctx.fillRect(W / 2 - 44, y - 34, 88, 2);
    y += 40;
    ctx.fillStyle = "#4a4136";
    ctx.font = `italic 44px ${serif}`;
    for (const line of quoteLines) {
      ctx.fillText(line, W / 2, y);
      y += 62;
    }
  }
  if (card.author) {
    ctx.fillStyle = "#857967";
    ctx.font = `30px ${serif}`;
    ctx.fillText(`- ${card.author}`, W / 2, y + 14);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#95711f";
  ctx.font = `26px ${serif}`;
  ctx.fillText("Read along at alltheglory.co.za/the-study", W / 2, 1236);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
}

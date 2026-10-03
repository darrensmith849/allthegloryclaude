// A note's text: "•", "-" or "*" lines become bullets; everything else
// keeps its line breaks. Shared by Study Notes and the reader view.

export function NoteText({ text }: { text: string }) {
  const blocks: { bullet: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const bullet = /^\s*(?:[•●▪◦*]|-(?=\s))\s*/.test(line);
    const clean = line.replace(/^\s*(?:[•●▪◦*]|-(?=\s))\s*/, "");
    const last = blocks[blocks.length - 1];
    if (last && last.bullet === bullet) last.lines.push(clean);
    else blocks.push({ bullet, lines: [clean] });
  }
  return (
    <div className="dash-note-text">
      {blocks.map((b, i) =>
        b.bullet ? (
          <ul key={i}>
            {b.lines.map((l, j) => (
              <li key={j}>{l}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines.join("\n")}</p>
        ),
      )}
    </div>
  );
}

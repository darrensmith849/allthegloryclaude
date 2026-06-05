// Proxies bible-api.com (KJV/WEB, no key required) so the client never
// has to think about CORS or rate limits. Returns a normalised shape.

import { NextResponse } from "next/server";

export const runtime = "edge";

interface RawVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface RawResponse {
  reference: string;
  verses: RawVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
  error?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim();
  const translation = url.searchParams.get("t") || "web";
  if (!ref) {
    return NextResponse.json({ error: "Pass ?ref=John+3:16" }, { status: 400 });
  }
  try {
    const r = await fetch(
      `https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!r.ok) {
      const err = await r.text().catch(() => "");
      return NextResponse.json({ error: err || `Upstream ${r.status}` }, { status: 502 });
    }
    const data = (await r.json()) as RawResponse;
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 404 });
    }
    return NextResponse.json({
      reference: data.reference,
      translation: data.translation_name,
      verses: data.verses.map((v) => ({
        ref: `${v.book_name} ${v.chapter}:${v.verse}`,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.replace(/\s+/g, " ").trim(),
      })),
      text: data.text.replace(/\s+/g, " ").trim(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

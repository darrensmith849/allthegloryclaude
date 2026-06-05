// AI word study. Strategy:
//  1) Try the curated offline Strong's lexicon first — instant, no network.
//  2) If a richer answer is wanted (or the word isn't curated), and an
//     ANTHROPIC_API_KEY is in the env, call Claude for a Greek/Hebrew study.
//  3) If no key is present, return the offline matches plus a friendly hint.
//
// The Claude call returns a strict JSON shape so the client can render it
// the same way as a curated entry.

import { NextResponse } from "next/server";
import { searchStrongs } from "@/lib/dashboard/strongs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StudyEntry {
  number: string;
  language: "greek" | "hebrew";
  translit: string;
  original: string;
  gloss: string;
  usage: string;
  english: string[];
  examples: { ref: string; quote?: string }[];
  source: "curated" | "ai";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body?.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const curated = searchStrongs(query).map((e) => ({ ...e, source: "curated" as const }));
  const wantsAi = body?.useAi !== false;
  const key = process.env.ANTHROPIC_API_KEY;

  if (!wantsAi || !key) {
    return NextResponse.json({
      results: curated,
      aiAvailable: Boolean(key),
      note: !key
        ? "Curated results only. Add ANTHROPIC_API_KEY to .env.local for a live Greek/Hebrew lookup powered by Claude."
        : undefined,
    });
  }

  // Ask Claude for a structured study.
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 1100,
        system:
          "You are a careful biblical-languages reference. For the user's word, " +
          "return a JSON object with a `results` array of up to 3 entries " +
          "covering the most likely Greek or Hebrew terms. Each entry has: " +
          "number (Strong's, like G26 or H2617), language ('greek'|'hebrew'), " +
          "translit, original (the original script), gloss (short), usage " +
          "(2-4 sentences, pastoral and accurate), english (array of common " +
          "translations), examples (array of {ref, quote?}). Be sober and " +
          "biblical. Do not invent numbers — leave the number field empty if " +
          "unsure. Return ONLY JSON, no prose.",
        messages: [
          {
            role: "user",
            content: `Search term: ${query}`,
          },
        ],
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json(
        { results: curated, aiError: `Claude ${r.status}: ${txt.slice(0, 200)}` },
        { status: 200 },
      );
    }
    const raw = await r.json();
    const text: string = raw?.content?.[0]?.text ?? "";
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    let parsed: { results: StudyEntry[] } = { results: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Couldn't parse — fall back to curated.
      return NextResponse.json({
        results: curated,
        aiError: "Could not parse Claude response.",
      });
    }
    const ai = (parsed.results ?? []).map((e) => ({ ...e, source: "ai" as const }));
    // Curated entries first (faster trust), then AI for any extra surface area.
    const seen = new Set(curated.map((c) => c.translit.toLowerCase()));
    const merged = [...curated, ...ai.filter((a) => !seen.has(a.translit?.toLowerCase()))];
    return NextResponse.json({ results: merged, aiAvailable: true });
  } catch (e) {
    return NextResponse.json({
      results: curated,
      aiError: e instanceof Error ? e.message : "AI lookup failed",
    });
  }
}

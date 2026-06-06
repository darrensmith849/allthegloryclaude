// AI + lexicon word study.
//
// Three layers:
//   1. Curated lexicon (instant, pastoral) — ~40 of the most-studied words.
//   2. Full Strong's lexicon (5,523 Greek + 8,674 Hebrew) — exhaustive.
//   3. Anthropic Claude (optional) — adds a pastoral synthesis if a key
//      is set in ANTHROPIC_API_KEY.
//
// Layer 2 is the new fallback that ensures EVERY word search returns
// something useful. No API key is required for the lookup to work.

import { NextResponse } from "next/server";
import { searchStrongs } from "@/lib/dashboard/strongs";
import { searchFullLexicon } from "@/lib/dashboard/full-strongs";

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
  source: "curated" | "lexicon" | "ai";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body?.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  // 1. Curated — always fastest and best-written.
  const curated = searchStrongs(query).map((e) => ({ ...e, source: "curated" as const }));

  // 2. Full lexicon — fills the long tail.
  const seenNums = new Set(curated.map((c) => c.number));
  const fullLex = searchFullLexicon(query, 20)
    .filter((e) => !seenNums.has(e.number))
    .map((e) => ({ ...e, source: "lexicon" as const }));

  const baseResults = [...curated, ...fullLex];
  const wantsAi = body?.useAi !== false;
  const key = process.env.ANTHROPIC_API_KEY;

  if (!wantsAi || !key) {
    return NextResponse.json({
      results: baseResults,
      aiAvailable: Boolean(key),
      note:
        baseResults.length === 0
          ? "No matches in the Strong's lexicon for that query. Try a different spelling, or a Strong's number like G26 / H2617."
          : !key
          ? "Curated + Strong's results. Add ANTHROPIC_API_KEY to .env.local for a pastoral synthesis from Claude on top."
          : undefined,
    });
  }

  // 3. AI synthesis — adds context, doesn't replace the lexicon hits.
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
      return NextResponse.json({
        results: baseResults,
        aiError: `Claude ${r.status}: ${txt.slice(0, 200)}`,
      });
    }
    const raw = await r.json();
    const text: string = raw?.content?.[0]?.text ?? "";
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    let parsed: { results: StudyEntry[] } = { results: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        results: baseResults,
        aiError: "Could not parse Claude response.",
      });
    }
    const ai = (parsed.results ?? []).map((e) => ({ ...e, source: "ai" as const }));
    const seen = new Set(baseResults.map((c) => c.translit.toLowerCase()));
    const merged = [
      ...baseResults,
      ...ai.filter((a) => a.translit && !seen.has(a.translit.toLowerCase())),
    ];
    return NextResponse.json({ results: merged, aiAvailable: true });
  } catch (e) {
    return NextResponse.json({
      results: baseResults,
      aiError: e instanceof Error ? e.message : "AI lookup failed",
    });
  }
}

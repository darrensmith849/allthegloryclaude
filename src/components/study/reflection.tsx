"use client";

// One of the owner's weekly reflections: the words, signed by him, and the
// week's memory verse. Used on the Community page (this week, and earlier
// weeks by date) and in a member's journal on the day it was posted.

import Link from "next/link";
import { NoteText } from "@/components/dashboard/note-text";

export interface Reflection {
  id: string;
  title: string;
  body: string;
  question: string | null;
  memoryVerse?: string | null;
  publishedAt: number;
}

export const reflectionDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// The local calendar day it was posted (YYYY-MM-DD).
export const reflectionDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA");

export function ReflectionBody({ r, author, current = false }: { r: Reflection; author: string; current?: boolean }) {
  return (
    <div className="dash-reflection">
      <div className="dash-community-body">
        <NoteText text={r.body} />
      </div>
      <p className="dash-reflection-sign">- {author}</p>
      {r.memoryVerse && (
        <Link href="/study" className="dash-community-memory">
          Memory verse {current ? "this week" : "that week"}: <strong>{r.memoryVerse}</strong>
          {current ? " - on your home page →" : ""}
        </Link>
      )}
    </div>
  );
}

"use client";

import { MemberOnly } from "@/components/study/shell";
import { WordJournal } from "@/components/study/word-journal";

export default function WordsPage() {
  return (
    <MemberOnly>
      <WordJournal />
    </MemberOnly>
  );
}

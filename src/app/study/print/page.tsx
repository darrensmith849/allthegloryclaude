"use client";

import { MemberOnly, useMe } from "@/components/study/shell";
import { JournalPrint } from "@/components/study/journal-print";

// A member's journal, a month or a year at a time, ready to print or save as PDF.
export default function PrintPage() {
  const me = useMe();
  return (
    <MemberOnly>
      <JournalPrint name={me.member?.name} />
    </MemberOnly>
  );
}

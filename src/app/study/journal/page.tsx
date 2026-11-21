"use client";

import { MemberOnly } from "@/components/study/shell";
import { StudyNotes } from "@/components/study/study-notes";

export default function JournalPage() {
  return (
    <MemberOnly>
      <StudyNotes />
    </MemberOnly>
  );
}

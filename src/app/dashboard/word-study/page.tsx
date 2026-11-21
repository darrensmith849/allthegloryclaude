"use client";

import { WordJournal } from "@/components/study/word-journal";
import { memberClient, StudyClientProvider } from "@/lib/study/client";
import { useDashUser } from "@/lib/dashboard/who";

// The owner's Word Journal (the study client defaults to the owner's).
// Family, on her own dashboard, gets her own words instead.
export default function WordJournalPage() {
  const user = useDashUser();
  if (user === undefined) return null;
  if (user?.role === "personal") {
    return (
      <StudyClientProvider value={memberClient(user.memberId, { canReadStudy: true, author: "Daniel" })}>
        <WordJournal />
      </StudyClientProvider>
    );
  }
  return <WordJournal />;
}

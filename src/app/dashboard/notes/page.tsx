"use client";

import { StudyNotes } from "@/components/study/study-notes";
import { memberClient, StudyClientProvider } from "@/lib/study/client";
import { useDashUser } from "@/lib/dashboard/who";

// The owner's Study Notes (the study client defaults to the owner's). A team
// member gets their own private journal here instead - the same tools, kept
// to themselves (not shown to members) - with Daniel's study alongside.
export default function StudyNotesPage() {
  const user = useDashUser();
  if (user === undefined) return null;
  if (user?.role === "team") {
    return (
      <StudyClientProvider value={memberClient(user.memberId, { canReadStudy: true, author: "Daniel" })}>
        <StudyNotes />
      </StudyClientProvider>
    );
  }
  return <StudyNotes />;
}

"use client";

import { useEffect } from "react";
import { useMe } from "@/components/study/shell";
import { SharedNotes } from "@/components/study/shared-notes";
import { catchInvite } from "@/lib/study/shared-groups";

// Shared notes, and where a group's link lands. Someone without an account
// joins or logs in first; the key waits on this device until they're back.
export default function StudySharedPage() {
  const me = useMe();
  useEffect(() => {
    const invited = catchInvite();
    if (me.loaded && !me.member) {
      window.location.replace(`/the-study?${invited ? "group" : "login"}=1&next=${encodeURIComponent("/study/shared")}`);
    }
  }, [me.loaded, me.member]);
  if (!me.member) return <p className="dash-reader-empty">{me.loaded ? "Taking you to log in…" : "Opening…"}</p>;
  return <SharedNotes memberId={me.member.id} memberName={me.member.name} />;
}

"use client";

// The owner's study on its own page - for visitors, when it's open to them.
// Members read it inside My journal (it sits in each day, next to their own
// notes), so a link here - an old one, or "log in to read" from a shared day -
// takes them straight to that day in their journal.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Reader } from "@/components/study/reader";
import { useMe } from "@/components/study/shell";
import { STUDY_START } from "@/lib/study/plan";

export default function ReadStudyPage() {
  const me = useMe();
  const router = useRouter();
  useEffect(() => {
    if (!me.member) return;
    const day = new URLSearchParams(window.location.search).get("day");
    const inJournal = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? `day=${STUDY_START.slice(0, 4)}${day.slice(4)}&` : "";
    router.replace(`/study/journal?${inJournal}daniel=1`);
  }, [me.member, router]);
  if (me.member) return <p className="dash-reader-empty">Opening your journal…</p>;
  return <Reader basePath="/study/read" member={false} />;
}

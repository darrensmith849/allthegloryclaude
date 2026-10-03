"use client";

import { Reader } from "@/components/study/reader";
import { useMe } from "@/components/study/shell";

export default function ReadStudyPage() {
  const me = useMe();
  return (
    <Reader
      basePath="/study/read"
      back={
        me.member
          ? { href: (d) => (d ? `/study/journal?day=${d.replace(/^\d{4}/, String(new Date().getFullYear()))}` : "/study/journal"), label: "← My journal for this day" }
          : undefined
      }
    />
  );
}

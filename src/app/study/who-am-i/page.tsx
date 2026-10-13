"use client";

// "Who am I?" for members - the owner's welcome, in front of their study
// every time they open it: the 25 truths (BSB) over the painting, full
// screen, then "Open my study" - with "Don't show this every time".

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WhoAmI } from "@/components/dashboard/who-am-i";
import { useMe } from "@/components/study/shell";
import { IDENTITY_STATEMENTS_BSB } from "@/lib/study/identity-bsb";
import { markShownThisVisit, setWhoAmIOff, whoAmIOff } from "@/lib/study/who-am-i";

export default function StudyWhoAmIPage() {
  const me = useMe();
  const memberId = me.member?.id;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [on, setOn] = useState(true);
  useEffect(() => {
    markShownThisVisit();
    if (memberId) setOn(!whoAmIOff(memberId));
  }, [memberId]);
  const set = (next: boolean) => {
    setOn(next);
    if (memberId) setWhoAmIOff(memberId, !next);
  };
  // Full screen over the menu: the page behind stays still.
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div className="dash-welcome-root study-welcome">
      <WhoAmI
        statements={IDENTITY_STATEMENTS_BSB}
        version="BSB"
        open={{ href: "/study", label: "Open my study" }}
        everyTime={memberId ? { on, set, where: "The Study", menu: "Who am I?" } : undefined}
      />
    </div>,
    document.body,
  );
}

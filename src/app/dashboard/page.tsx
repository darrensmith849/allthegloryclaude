"use client";

// The dashboard opens on "Who am I?" - unless it's set not to open every
// time (on this device); then it goes straight to Today. The menu's
// "Who am I?" (/dashboard?show=1) always shows it, with the switch to turn
// it back on.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WhoAmI } from "@/components/dashboard/who-am-i";
import { IDENTITY_STATEMENTS } from "@/lib/dashboard/identity";

const OFF_KEY = "atg:dash:whoAmIOff";

export default function WhoAmIPage() {
  const router = useRouter();
  const [on, setOn] = useState(true);
  useEffect(() => {
    let off = false;
    try {
      off = window.localStorage.getItem(OFF_KEY) === "1";
    } catch {
      // private window
    }
    setOn(!off);
    if (off && !new URLSearchParams(window.location.search).has("show")) router.replace("/dashboard/today");
  }, [router]);
  const set = (next: boolean) => {
    setOn(next);
    try {
      if (next) window.localStorage.removeItem(OFF_KEY);
      else window.localStorage.setItem(OFF_KEY, "1");
    } catch {
      // private window
    }
  };
  return (
    <WhoAmI
      statements={IDENTITY_STATEMENTS}
      open={{ href: "/dashboard/today", label: "Open Dashboard" }}
      everyTime={{ on, set, where: "my dashboard", menu: "Who am I?" }}
    />
  );
}

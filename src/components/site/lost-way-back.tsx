"use client";

// The 404 page under /study or /dashboard. Those areas skip the night-sky
// backdrop (sticky-backdrop.tsx) and their own styles aren't loaded here,
// so the white 404 text sat on a blank white page. This puts the night
// colour behind it (on <body>, clear of the page fade-in's transform), and
// adds a button back to The Study or the dashboard.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function LostWayBack({ button = false }: { button?: boolean }) {
  const pathname = usePathname() ?? "";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dashboard = pathname.startsWith("/dashboard");
  if (!dashboard && !pathname.startsWith("/study")) return null;
  if (!button) {
    return mounted
      ? createPortal(<div className="fixed inset-0 -z-40 bg-[var(--colour-bg)]" aria-hidden />, document.body)
      : null;
  }
  return (
    <Link href={dashboard ? "/dashboard" : "/study"} className="btn btn-primary">
      {dashboard ? "Back to my dashboard →" : "Back to The Study →"}
    </Link>
  );
}

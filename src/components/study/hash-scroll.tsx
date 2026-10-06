"use client";

// Links to a spot on a page - /study#invite, /study/account#reminder,
// /study/community#questions. Those sections are drawn once the page's data
// has loaded, so the browser's own jump finds nothing and stays at the top.
// This waits (up to 5 seconds) for the spot to appear and the page above it
// to stop moving, then scrolls to it.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function HashScroll() {
  const pathname = usePathname();
  useEffect(() => {
    let timer: number | undefined;
    const go = () => {
      window.clearTimeout(timer);
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const started = Date.now();
      let last = NaN;
      let still = 0;
      const tick = () => {
        const el = document.getElementById(id);
        // Wait until the page above it has finished loading (it stops moving).
        const at = el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : NaN;
        still = el && Math.abs(at - last) < 2 ? still + 1 : 0;
        last = at;
        const late = Date.now() - started > 5000;
        if (el && (still >= 3 || late)) {
          // On phones the menu bar stays pinned at the top - land below it.
          const bar = document.querySelector<HTMLElement>(".dash-sidebar");
          const pinned = bar && /sticky|fixed/.test(getComputedStyle(bar).position) && bar.offsetHeight < window.innerHeight / 2;
          const top = el.getBoundingClientRect().top + window.scrollY - (pinned ? bar.offsetHeight : 0) - 12;
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
          return;
        }
        if (!late) timer = window.setTimeout(tick, 120);
      };
      tick();
    };
    go();
    // Next's links change the address without a "hashchange", so also
    // catch clicks on links to a spot on this same page.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (a && a.pathname === window.location.pathname) window.setTimeout(go, 60);
    };
    window.addEventListener("hashchange", go);
    document.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", go);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);
  return null;
}

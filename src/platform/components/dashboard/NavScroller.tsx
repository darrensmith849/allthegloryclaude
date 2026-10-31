"use client";

import { useEffect, useRef, type ReactNode } from "react";

// On narrow screens the section list is a horizontal strip. Bring the active
// section into view without moving the page vertically.
export function NavScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = ref.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const active = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const offset = active.offsetLeft - list.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollLeft = Math.max(0, offset);
  }, []);
  return (
    <ul ref={ref} role="list">
      {children}
    </ul>
  );
}

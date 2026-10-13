"use client";

// A Panel that folds down to its title with the ˄ button in its header, and
// stays the way it was left (on this device). What's inside stays in place
// while folded, so a half-typed word or lookup isn't lost.

import type { ReactNode } from "react";
import { FoldToggle, useFolded } from "@/components/study/fold-toggle";
import { Panel } from "./panel";

export function FoldPanel({
  id,
  title,
  eyebrow,
  action,
  className = "",
  forceOpen = false,
  children,
}: {
  id: string; // remembers the fold: atg:fold:<id>
  forceOpen?: boolean; // e.g. while editing something inside
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [stored, toggle] = useFolded(`atg:fold:${id}`);
  const folded = stored && !forceOpen;
  return (
    <Panel
      eyebrow={eyebrow}
      title={title}
      className={`${className} ${folded ? "is-folded" : ""}`}
      action={
        <div className="flex items-center gap-2">
          {action}
          <FoldToggle folded={folded} onToggle={toggle} what={title ?? eyebrow ?? "this"} inline />
        </div>
      }
    >
      {children}
    </Panel>
  );
}

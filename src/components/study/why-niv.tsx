"use client";

// "Why the NIV?" - Daniel's reason the study follows the NIV edition, folded
// away under the reading plan wherever it's named.

import { useState } from "react";

export function WhyNiv({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`why-niv ${open ? "is-open" : ""} ${className}`}>
      <button type="button" className="why-niv-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span aria-hidden>{open ? "−" : "+"}</span> Why we use the NIV
      </button>
      {open && (
        <div className="why-niv-body">
          <p>
            Most chronological Bibles don&apos;t break the reading into daily portions in chronological order. The One Year
            Chronological Bible (NIV) is the only one we&apos;ve found so far that does - but we keep looking for others that do.
          </p>
          <p>
            Verses you look up inside The Study show in the Berean Standard Bible, which is free to share - each one links to the
            NIV in the Bible App.
          </p>
        </div>
      )}
    </div>
  );
}

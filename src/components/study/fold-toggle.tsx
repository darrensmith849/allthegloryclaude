"use client";

// Fold a card on the home page down to its title (and open it again). Each
// card remembers how it was left, on this device. `value` lets a card fold
// one thing only - e.g. this week's reflection - so next week's opens again.

import { useEffect, useState } from "react";

export function useFolded(key: string, value = "1"): [boolean, () => void] {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    try {
      setFolded(window.localStorage.getItem(key) === value);
    } catch {
      // private window
    }
  }, [key, value]);
  const toggle = () =>
    setFolded((f) => {
      try {
        if (f) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        // private window
      }
      return !f;
    });
  return [folded, toggle];
}

export function FoldToggle({ folded, onToggle, what }: { folded: boolean; onToggle: () => void; what: string }) {
  return (
    <button
      type="button"
      className={`study-fold ${folded ? "is-folded" : ""}`}
      onClick={onToggle}
      aria-expanded={!folded}
      aria-label={folded ? `Open ${what}` : `Fold ${what} away`}
      title={folded ? "Open" : "Fold away"}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

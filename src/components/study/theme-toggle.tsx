"use client";

// Light / dark for the dashboard and The Study. With no choice made the
// theme follows the device (prefers-color-scheme, in dashboard.css); the
// switch saves an explicit choice and sets <html data-theme>. ThemeScript
// applies a saved choice before the page paints, so there's no flash.

import { useEffect, useState } from "react";

const KEY = "atg:theme";

const script = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeToggle({ className = "study-theme", label = false }: { className?: string; label?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const set = document.documentElement.getAttribute("data-theme");
    setDark(set ? set === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const flip = () => {
    const next = !dark;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      window.localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      // private window - lasts until they leave
    }
    setDark(next);
  };

  if (dark === null) return <span className={className} aria-hidden />;
  return (
    <button
      type="button"
      className={className}
      onClick={flip}
      aria-label={dark ? "Switch to the light look" : "Switch to the dark look"}
      title={dark ? "Light look" : "Dark look - easier at night"}
    >
      <span aria-hidden>{dark ? "☀" : "☾"}</span>
      {label && <span>{dark ? "Light look" : "Dark look"}</span>}
    </button>
  );
}

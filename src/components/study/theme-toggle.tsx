"use client";

// Light / dark for the dashboard and The Study. Light unless someone picks
// dark (or "auto" = follow the device); the choice is saved per device and
// set as <html data-theme>. ThemeScript applies it before the page paints,
// so there's no flash.

import { useEffect, useState } from "react";

const KEY = "atg:theme";

const script = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="dark"||t==="auto")document.documentElement.setAttribute("data-theme",t);else document.documentElement.removeAttribute("data-theme");}catch(e){}})();`;

const isDarkNow = () => {
  const set = document.documentElement.getAttribute("data-theme");
  return set === "dark" || (set === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
};

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeToggle({ className = "study-theme", label = false }: { className?: string; label?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(isDarkNow());
  }, []);

  const flip = () => {
    const next = !dark;
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
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

type Mode = "light" | "dark" | "auto";

// Light / Dark / Auto (match the device) - the owner's sidebar and members'
// Account page.
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      // private window
    }
    setMode(saved === "dark" || saved === "auto" ? saved : "light");
  }, []);

  const choose = (m: Mode) => {
    const root = document.documentElement;
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      // private window - lasts until they leave
    }
    if (m === "light") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", m);
    setMode(m);
  };

  const options: { m: Mode; label: string }[] = [
    { m: "light", label: "☀ Light" },
    { m: "dark", label: "☾ Dark" },
    { m: "auto", label: "Auto" },
  ];
  return (
    <div className={`dash-toggle dash-theme-switch ${className}`} role="group" aria-label="Light or dark look">
      {options.map((o) => (
        <button
          key={o.m}
          type="button"
          className={mode === o.m ? "is-on" : ""}
          onClick={() => choose(o.m)}
          title={o.m === "auto" ? "Follow this device's light / dark setting" : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

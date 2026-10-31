"use client";

import { useEffect, useRef } from "react";
import { turnstileSiteKey } from "@/platform/config/client-env";

// Cloudflare Turnstile, explicitly rendered. The script loads only when a site
// key is configured; in development without one, the server applies the
// documented development bypass (src/server/security/turnstile.ts).

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  return new Promise((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT_SRC, async: true, defer: true });
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export function Turnstile({ action, onToken, resetSignal }: { action: string; onToken: (token: string) => void; resetSignal: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = turnstileSiteKey;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          appearance: "interaction-only",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, [siteKey, action, onToken]);

  useEffect(() => {
    if (resetSignal && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetSignal]);

  if (!siteKey) {
    return (
      <p className="field__hint" data-testid="turnstile-dev">
        Bot protection (Cloudflare Turnstile) is not configured in this environment.
      </p>
    );
  }
  return <div ref={ref} />;
}

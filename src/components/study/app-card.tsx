"use client";

// "Get The Study as an app", on members' home page - so nobody has to go
// into Account for it. Android / Chrome: one tap installs it. iPhone: no
// website can add itself, so a tap opens the steps right here. Once it's on
// the Home Screen (or wherever reminders already work), the same card is the
// daily reminder switch.

import { useEffect, useState } from "react";
import { IosInstallGuide } from "./ios-install-guide";
import { Reminders } from "./reminders";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AppCard({ hideKey }: { hideKey: string }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [steps, setSteps] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    try {
      setHidden(Number(window.localStorage.getItem(hideKey) ?? 0) > Date.now());
    } catch {
      // private window
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setReady(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hideKey]);

  if (!ready) return null;

  // On the Home Screen already: just the reminder switch.
  if (installed) {
    return (
      <section className="study-app-card">
        <Reminders compact />
      </section>
    );
  }
  if (hidden) return null;

  function notNow() {
    try {
      window.localStorage.setItem(hideKey, String(Date.now() + 30 * 86_400_000));
    } catch {
      // private window
    }
    setHidden(true);
  }

  return (
    <section className="study-app-card">
      <div className="study-app-head">
        <img src="/study/icon-192.png" alt="" width={44} height={44} className="study-app-icon" />
        <div className="min-w-0">
          <span className="eyebrow eyebrow-amber">On your phone</span>
          <h2 className="study-app-title">Get The Study as an app</h2>
        </div>
      </div>
      <p className="study-app-text">
        Open it from your home screen like an app - full screen, one tap away - and get a gentle reminder each day.
      </p>

      {prompt ? (
        <div className="study-app-actions">
          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={async () => {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              if (choice.outcome === "accepted") setInstalled(true);
              setPrompt(null);
            }}
          >
            Add The Study to my home screen
          </button>
          <button type="button" className="dash-word-link" onClick={notNow}>
            Not now
          </button>
        </div>
      ) : ios ? (
        <>
          {steps ? (
            <IosInstallGuide forReminders />
          ) : (
            <div className="study-app-actions">
              <button type="button" className="dash-btn dash-btn-primary" onClick={() => setSteps(true)}>
                Show me how · 20 seconds
              </button>
              <button type="button" className="dash-word-link" onClick={notNow}>
                Not now
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Android / computers: reminders work in the browser too. */}
          <Reminders compact />
          <p className="dash-word-hint mt-3">
            To add it to your home screen: on Android tap ⋮ then &ldquo;Add to Home screen&rdquo;; on a computer, the install
            icon at the right of the address bar.
          </p>
        </>
      )}
    </section>
  );
}

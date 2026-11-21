"use client";

// "Put Money on your Home Screen" for the friends' tracker - on a phone or
// tablet only, and not once it's opened from the Home Screen. On an iPhone a
// Home Screen app keeps its own storage, separate from Safari, so the card
// says to add it first (or move figures across with a backup).

import { useEffect, useState } from "react";
import { canAddToHomeScreen } from "@/components/dashboard/app-card";
import { IosInstallGuide } from "@/components/study/ios-install-guide";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "atg:money-tracker:appCardHidden";

export function TrackerInstallCard() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [steps, setSteps] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    let hidden = false;
    try {
      hidden = Number(window.localStorage.getItem(HIDE_KEY) ?? 0) > Date.now();
    } catch {
      // no storage - show it
    }
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    setShow(canAddToHomeScreen() && !hidden);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  function notNow() {
    try {
      window.localStorage.setItem(HIDE_KEY, String(Date.now() + 30 * 86_400_000));
    } catch {
      // not remembered - fine
    }
    setShow(false);
  }

  return (
    <section className="study-app-card dash-app-card">
      <div className="study-app-head">
        <img src="/dashboard-app/icon-192.png" alt="" width={44} height={44} className="study-app-icon" />
        <div className="min-w-0">
          <span className="eyebrow eyebrow-amber">On your phone</span>
          <h2 className="study-app-title">Put Money on your Home Screen</h2>
        </div>
      </div>
      <p className="study-app-text">
        Open it with one tap, like an app. Do this first, then add your figures in the Home Screen app
        {ios ? " - on an iPhone it keeps its own copy, separate from Safari (a backup moves figures across)." : "."}
      </p>
      {prompt ? (
        <div className="study-app-actions">
          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={async () => {
              await prompt.prompt();
              const { outcome } = await prompt.userChoice;
              setPrompt(null);
              if (outcome === "accepted") setShow(false);
            }}
          >
            Add to Home Screen
          </button>
          <button type="button" className="dash-word-link" onClick={notNow}>
            Not now
          </button>
        </div>
      ) : ios && steps ? (
        <>
          <IosInstallGuide
            app="Money"
            link="https://alltheglory.co.za/money-tracker"
            last={
              <>
                Open <strong>Money</strong> from your Home Screen and set your balance there.
              </>
            }
          />
          <button type="button" className="dash-word-link mt-2" onClick={notNow}>
            Done - hide this
          </button>
        </>
      ) : ios ? (
        <div className="study-app-actions">
          <button type="button" className="dash-btn dash-btn-primary" onClick={() => setSteps(true)}>
            Show me how · 20 seconds
          </button>
          <button type="button" className="dash-word-link" onClick={notNow}>
            Not now
          </button>
        </div>
      ) : (
        <div className="study-app-actions">
          <p className="dash-word-hint">Tap the ⋮ menu, then &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;.</p>
          <button type="button" className="dash-word-link" onClick={notNow}>
            Not now
          </button>
        </div>
      )}
    </section>
  );
}

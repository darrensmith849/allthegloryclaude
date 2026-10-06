"use client";

// "Put your dashboard on your phone", at the top of Study Notes - only on a
// phone or tablet, and not once it's opened from the Home Screen. The app is
// public/dashboard-manifest.webmanifest (the dark dove; members' The Study is
// the light one). A Home Screen app keeps its own sign-in, so the steps say
// to log in once there.

import { useEffect, useState } from "react";
import { IosInstallGuide } from "@/components/study/ios-install-guide";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "atg:dash:appCardHidden";

export function DashAppCard() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const isIos =
      /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const phone = isIos || /Android/i.test(navigator.userAgent);
    let hidden = false;
    try {
      hidden = Number(window.localStorage.getItem(HIDE_KEY) ?? 0) > Date.now();
    } catch {
      // private window
    }
    setIos(isIos);
    setShow(phone && !standalone && !hidden);
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
      // private window
    }
    setShow(false);
  }

  return (
    <section className="study-app-card dash-app-card">
      <div className="study-app-head">
        <img src="/dashboard-app/icon-192.png" alt="" width={44} height={44} className="study-app-icon" />
        <div className="min-w-0">
          <span className="eyebrow eyebrow-amber">On your phone</span>
          <h2 className="study-app-title">Put your dashboard on your Home Screen</h2>
        </div>
      </div>
      <p className="study-app-text">Open it with one tap, like an app - full screen, no browser bars.</p>

      {prompt ? (
        <div className="study-app-actions">
          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={async () => {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              if (choice.outcome === "accepted") setShow(false);
              setPrompt(null);
            }}
          >
            Add my dashboard to my home screen
          </button>
          <button type="button" className="dash-word-link" onClick={notNow}>
            Not now
          </button>
        </div>
      ) : ios && steps ? (
        <>
          <IosInstallGuide
            app="your dashboard"
            link="https://alltheglory.co.za/dashboard"
            last={
              <>
                Open <strong>ATG Dashboard</strong> from your Home Screen (the dark dove) and log in once - the Home Screen
                app keeps its own sign-in.
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

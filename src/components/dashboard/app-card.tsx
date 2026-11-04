"use client";

// "Put your dashboard on your phone", at the top of every dashboard page -
// for Daniel and his team - only on a phone or tablet, and not once it's
// opened from the Home Screen. "Add to Home Screen" in the menu brings it
// back (openDashAppCard). The app is public/dashboard-manifest.webmanifest
// (the dark dove; members' The Study is the light one). A Home Screen app
// keeps its own sign-in, so the steps say to log in once there - team
// members with their Study email, on the same login page. Once Daniel opens
// it from the Home Screen, the card offers his daily reading reminder
// instead (until it's on; the full switch is on Reminders).

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IosInstallGuide } from "@/components/study/ios-install-guide";
import { DASHBOARD, Reminders } from "@/components/study/reminders";
import { useDashUser } from "@/lib/dashboard/who";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "atg:dash:appCardHidden";
const OPEN_EVENT = "atg:dash-app-card";

// From the menu: show the card with the steps open, even if hidden before.
export function openDashAppCard() {
  try {
    window.localStorage.removeItem(HIDE_KEY);
  } catch {
    // private window
  }
  window.dispatchEvent(new Event(OPEN_EVENT));
}

// On a phone or tablet, and not already opened from the Home Screen.
export function canAddToHomeScreen(): boolean {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const phone =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return phone && !standalone;
}

export function DashAppCard() {
  const user = useDashUser();
  const pathname = usePathname();
  const team = user?.role === "team";
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [steps, setSteps] = useState(false);
  const [installed, setInstalled] = useState(false);
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    const isIos =
      /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let hidden = false;
    try {
      hidden = Number(window.localStorage.getItem(HIDE_KEY) ?? 0) > Date.now();
    } catch {
      // private window
    }
    setIos(isIos);
    setShow(canAddToHomeScreen() && !hidden);
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setShow(false);
    const onOpen = () => {
      setShow(true);
      setSteps(true);
      requestAnimationFrame(() => card.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // On the Home Screen: Daniel's daily reminder (hidden once it's on).
  if (installed && user?.role === "owner") {
    // (The Reminders page has the full switch - don't show two.)
    if (pathname === "/dashboard/reminders") return null;
    return (
      <section className="study-app-card dash-app-card">
        <Reminders compact target={DASHBOARD} hideWhenOn />
      </section>
    );
  }
  if (!show || user === undefined) return null;

  function notNow() {
    try {
      window.localStorage.setItem(HIDE_KEY, String(Date.now() + 30 * 86_400_000));
    } catch {
      // private window
    }
    setShow(false);
  }

  return (
    <section ref={card} className="study-app-card dash-app-card">
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
                Open <strong>ATG Dashboard</strong> from your Home Screen (the dark dove) and log in once
                {team ? (
                  <>
                    {" "}
                    - tap <strong>Team member</strong> and use your Study email and password.
                  </>
                ) : (
                  " - the Home Screen app keeps its own sign-in."
                )}
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

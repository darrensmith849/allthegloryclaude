"use client";

// "Get The Study on your phone": a one-tap install where the browser offers
// it (Android / Chrome), otherwise the steps for iPhone and others. The
// app is the same site, from public/study-manifest.webmanifest.

import { useEffect, useState } from "react";
import { IosInstallGuide } from "./ios-install-guide";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallCard({ stepsAbove = false }: { stepsAbove?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className="dash-word-hint">✓ The Study is on your home screen.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="dash-word-hint">Open The Study like an app - straight from your home screen, full screen, no browser bars.</p>
      {prompt ? (
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
      ) : ios && stepsAbove ? (
        <p className="dash-word-hint">Use the 3 steps under Daily reminder above - they put The Study on your Home Screen too.</p>
      ) : ios ? (
        <IosInstallGuide />
      ) : (
        <ol className="dash-install-steps">
          <li>On Android: tap the ⋮ menu, then &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</li>
          <li>On a computer: click the install icon at the right of the address bar.</li>
        </ol>
      )}
    </div>
  );
}

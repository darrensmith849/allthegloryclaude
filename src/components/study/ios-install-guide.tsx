"use client";

// iPhone / iPad: how to put The Study (or Daniel's dashboard) on the Home
// Screen. Apple only lets a website send reminders once it's been added
// there, and no website can add itself - so this shows the exact taps, for
// the browser they're in.

import { useEffect, useState } from "react";

type Where = "safari" | "other" | "inapp";

const ShareIcon = () => (
  <svg className="ios-guide-icon" viewBox="0 0 24 24" aria-label="Share" role="img">
    <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18.5 10H17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const AddIcon = () => (
  <svg className="ios-guide-icon" viewBox="0 0 24 24" aria-label="Add to Home Screen" role="img">
    <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8.5v7M8.5 12h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function IosInstallGuide({
  forReminders = false,
  app = "The Study",
  link = "https://alltheglory.co.za/study",
  last,
}: {
  forReminders?: boolean;
  app?: string;
  link?: string;
  /** Step 3, in place of "Open The Study from your Home Screen (the dove)". */
  last?: React.ReactNode;
}) {
  const [where, setWhere] = useState<Where>("safari");
  const [ipad, setIpad] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIpad(!/iPhone/.test(ua) && (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)));
    if (/FBAN|FBAV|Instagram|LinkedInApp|Line\/|GSA\/|Snapchat|Twitter|musical_ly|TikTok/i.test(ua)) setWhere("inapp");
    else if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) setWhere("other");
    else setWhere("safari");
  }, []);

  if (where === "inapp") {
    return (
      <div className="ios-guide">
        <p className="ios-guide-lead">You&apos;re in another app&apos;s browser - open {app} in <strong>Safari</strong> first.</p>
        <ol className="ios-guide-steps">
          <li>
            <span className="ios-guide-num">1</span>
            <span>
              Tap the <strong>•••</strong> menu (top or bottom corner) and choose <strong>Open in Safari</strong> (or &ldquo;Open in
              browser&rdquo;).
            </span>
          </li>
          <li>
            <span className="ios-guide-num">2</span>
            <span>Then follow the steps there to add it to your Home Screen.</span>
          </li>
        </ol>
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(link).then(() => setCopied(true));
          }}
        >
          {copied ? "✓ Link copied - paste it into Safari" : "Copy the link instead"}
        </button>
      </div>
    );
  }

  return (
    <div className="ios-guide">
      {forReminders && (
        <p className="ios-guide-lead">
          On iPhone, Apple only allows reminders from apps on your Home Screen. It takes 20 seconds:
        </p>
      )}
      <ol className="ios-guide-steps">
        <li>
          <span className="ios-guide-num">1</span>
          <span>
            Tap the Share button <ShareIcon />{" "}
            {where === "other"
              ? "next to the address bar at the top"
              : ipad
                ? "at the top right of Safari"
                : "at the bottom of Safari - on newer iPhones, tap ••• first, then Share"}
            .
          </span>
        </li>
        <li>
          <span className="ios-guide-num">2</span>
          <span>
            Scroll down and tap <strong>Add to Home Screen</strong> <AddIcon />, then <strong>Add</strong>.
          </span>
        </li>
        <li>
          <span className="ios-guide-num">3</span>
          <span>
            {last ?? (
              <>
                Open The Study from your Home Screen (the dove)
                {forReminders ? <> and tap <strong>Turn on reminders</strong> on its home page.</> : "."}
              </>
            )}
          </span>
        </li>
      </ol>
      {forReminders && <p className="dash-word-hint">Needs iOS 16.4 or newer (Settings → General → Software Update).</p>}
    </div>
  );
}

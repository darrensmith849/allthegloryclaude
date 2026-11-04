"use client";

// A link to pass on, with Copy, WhatsApp, Email and (on phones) the
// device's own share sheet.

import { useEffect, useState } from "react";

export function ShareLink({ url, message, subject }: { url: string; message: string; subject: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  const text = `${message} ${url}`;

  return (
    <div className="dash-share-link">
      <div className="dash-members-link">
        <code>{url.replace(/^https?:\/\//, "")}</code>
        <button
          type="button"
          className="dash-btn dash-btn-primary dash-note-nav"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <div className="dash-share-ways">
        <a className="dash-btn dash-btn-ghost dash-note-nav" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a
          className="dash-btn dash-btn-ghost dash-note-nav"
          href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
        >
          Email
        </a>
        {canShare && (
          <button
            type="button"
            className="dash-btn dash-btn-ghost dash-note-nav"
            onClick={() => void navigator.share({ title: subject, text: message, url }).catch(() => {})}
          >
            Share…
          </button>
        )}
      </div>
    </div>
  );
}

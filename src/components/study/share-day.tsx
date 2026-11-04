"use client";

// "Share this day": opens a preview of the picture card for one of the
// owner's days, with Share / Save image and the link to the day's public
// page (/the-study/day/…).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dayLabel, planDay } from "@/lib/dashboard/notes";
import { drawDayCard } from "@/lib/study/share-card";
import { ShareLink } from "./share-link";

export function ShareDay({ day, title, takeaway, author, className = "" }: {
  day: string;
  title: string;
  takeaway?: string;
  author?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let url = "";
    const host = document.querySelector(".study-root, .dash-root") ?? document.body;
    const serif = getComputedStyle(host).getPropertyValue("--font-read").trim() || "Georgia, serif";
    drawDayCard(
      { dayNumber: planDay(day).n, dateLabel: dayLabel(day), title, takeaway, author },
      serif,
    )
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setImage({ url, blob });
        const file = new File([blob], `day-${planDay(day).n}.png`, { type: "image/png" });
        setCanShareFiles(typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }));
      })
      .catch(() => setImage(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
      setImage(null);
    };
  }, [open, day, title, takeaway, author]);

  const name = `the-study-day-${planDay(day).n}.png`;
  const link = `${origin}/the-study/day/${day}`;

  return (
    <>
      <button type="button" className={`dash-btn dash-btn-ghost dash-note-nav ${className}`} onClick={() => setOpen(true)}>
        Share this day
      </button>
      {open &&
        createPortal(
          <div className="dash-share-modal" role="dialog" aria-label="Share this day" onClick={() => setOpen(false)}>
            <div className="dash-share-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow eyebrow-amber">Share this day</div>
                <button type="button" className="study-player-x" onClick={() => setOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <div className="dash-share-preview">
                {image ? <img src={image.url} alt={`Day ${planDay(day).n} - ${title}`} /> : <span className="dash-word-hint">Making the picture…</span>}
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                {canShareFiles && image && (
                  <button
                    type="button"
                    className="dash-btn dash-btn-primary dash-note-nav"
                    onClick={() =>
                      void navigator
                        .share({
                          files: [new File([image.blob], name, { type: "image/png" })],
                          title: `Day ${planDay(day).n} - ${title}`,
                          text: `${title} - read along with The Study: ${link}`,
                        })
                        .catch(() => {})
                    }
                  >
                    Share picture
                  </button>
                )}
                {image && (
                  <a className="dash-btn dash-btn-ghost dash-note-nav" href={image.url} download={name}>
                    Save picture
                  </a>
                )}
              </div>
              <div className="eyebrow mt-4 mb-2">Or share the link</div>
              <ShareLink url={link} subject={`${title} - The Study`} message={`${title} - read along with me in The Study:`} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

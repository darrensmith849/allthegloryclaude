"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";
import type { ReactNode } from "react";

/** Inline SVG icons — same glyphs as the painted footer's social row,
 *  so the dock and the footer read as the same iconography rather than
 *  two different visual vocabularies. */
const Icons: Record<string, ReactNode> = {
  Instagram: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  YouTube: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon
        points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  ),
  Spotify: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  ),
  TikTok: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.17a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.6z" />
    </svg>
  ),
};

function Item({
  href,
  label,
  delay,
}: {
  href?: string;
  label: string;
  delay: number;
}) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="social-link"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, delay, ease: "easeOut" }}
    >
      {/* Mobile / tablet: the platform icon inside a 44×44 wrapper so each
          social hits the Apple HIG / Material tap-target minimum.
          Desktop (lg+): the original uppercase word marks the artist
          preferred — "INSTAGRAM ↗", "FACEBOOK ↗", … stacked vertically. */}
      <span className="lg:hidden inline-flex h-11 w-11 items-center justify-center">
        {Icons[label]}
      </span>
      <span className="hidden lg:inline">{label} ↗</span>
    </motion.a>
  );
}

export default function SocialDock() {
  const pathname = usePathname();
  // Hidden on /dashboard (private app chrome) and /album (music page -
  // the artist asked not to show socials there).
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/album")) {
    return null;
  }
  return (
    <div className="social-dock-bottom">
      {/* Slow cascade fade-in: each icon takes 1.6s, stepped 0.18s apart
          so the rail visibly assembles itself after the hero settles —
          matches the 2s footer fades used elsewhere on the site. */}
      <Item href={site.socials.instagram} label="Instagram" delay={0.6} />
      <Item href={site.socials.facebook} label="Facebook" delay={0.78} />
      <Item href={site.socials.youtube} label="YouTube" delay={0.96} />
      <Item href={site.socials.spotify} label="Spotify" delay={1.14} />
      <Item href={site.socials.tiktok} label="TikTok" delay={1.32} />
    </div>
  );
}

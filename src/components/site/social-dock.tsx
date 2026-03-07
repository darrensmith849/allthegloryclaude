"use client";

import { site } from "@/content/site";

function SocialLink({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="social-pill"
    >
      {label} ↗
    </a>
  );
}

export default function SocialDock() {
  return (
    <div className="social-dock">
      <SocialLink href={site.socials.instagram} label="Instagram" />
      <SocialLink href={site.socials.youtube} label="YouTube" />
      <SocialLink href={site.socials.spotify} label="Spotify" />
      <SocialLink href={site.socials.facebook} label="Facebook" />
    </div>
  );
}

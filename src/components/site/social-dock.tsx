"use client";

import { site } from "@/content/site";

function Item({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="social-link">
      {label} ↗
    </a>
  );
}

export default function SocialDock() {
  return (
    <div className="social-dock-bottom">
      <Item href={site.socials.instagram} label="Instagram" />
      <Item href={site.socials.youtube} label="YouTube" />
      <Item href={site.socials.spotify} label="Spotify" />
      <Item href={site.socials.facebook} label="Facebook" />
    </div>
  );
}

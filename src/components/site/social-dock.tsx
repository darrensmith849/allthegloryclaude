"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";

function Item({
  href,
  label,
  short,
  delay,
}: {
  href?: string;
  label: string;
  /** Compact label used at narrow widths so all five socials fit on one row. */
  short: string;
  delay: number;
}) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="social-link"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 4, delay, ease: "easeOut" }}
    >
      {/* Mobile / tablet: compact form (IG, FB, …). Desktop: full word. */}
      <span className="lg:hidden">{short} ↗</span>
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
      <Item href={site.socials.instagram} label="Instagram" short="IG" delay={1} />
      <Item href={site.socials.facebook} label="Facebook" short="FB" delay={1.3} />
      <Item href={site.socials.youtube} label="YouTube" short="YT" delay={1.6} />
      <Item href={site.socials.spotify} label="Spotify" short="SP" delay={1.9} />
      <Item href={site.socials.tiktok} label="TikTok" short="TT" delay={2.2} />
    </div>
  );
}

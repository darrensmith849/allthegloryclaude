"use client";

import { motion } from "framer-motion";
import { site } from "@/content/site";

function Item({ href, label, delay }: { href?: string; label: string; delay: number }) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="social-link"
      initial={{ opacity: 0, x: "-30vw" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 5, delay, ease: [0.06, 1, 0.18, 1] }}
    >
      {label} ↗
    </motion.a>
  );
}

export default function SocialDock() {
  return (
    <div className="social-dock-bottom">
      <Item href={site.socials.instagram} label="Instagram" delay={1} />
      <Item href={site.socials.youtube} label="YouTube" delay={1.3} />
      <Item href={site.socials.spotify} label="Spotify" delay={1.6} />
      <Item href={site.socials.facebook} label="Facebook" delay={1.9} />
    </div>
  );
}

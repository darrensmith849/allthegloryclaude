"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { site } from "@/content/site";

export default function SiteFooter() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setInView(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [pathname]);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          setInView(true);
          videoRef.current?.play();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, [pathname, inView]);

  return (
    <footer ref={footerRef} className="relative w-full overflow-hidden">
      {/* Jesus painting background — full width */}
      <div className="absolute inset-0">
        <Image
          src="/media/jesus-painting.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: "50% 20%",
            opacity: 0.30,
          }}
        />
        {/* Top fade into page */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--colour-bg)] to-transparent" />
      </div>

      {/* Lightning video — starts when footer enters view */}
      <div
        className="absolute inset-0 overflow-hidden transition-opacity duration-[2000ms]"
        style={{ mixBlendMode: "screen", opacity: inView ? 0.2 : 0 }}
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(1.3) contrast(1.1)" }}
        >
          <source src="/media/lightning.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative px-6 py-16 md:py-24">
        {/* Stacked centre — narrow panels so Jesus shows on both sides */}
        <div className="mx-auto max-w-md flex flex-col gap-6">
          {/* Scripture — fades in after painting is visible */}
          <motion.div
            key={`scripture-${pathname}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 2, delay: 2, ease: "easeOut" }}
            className="panel-scrim p-6 text-center"
          >
            <p className="text-base md:text-lg italic leading-relaxed" style={{ color: "var(--colour-ink)", opacity: 0.55 }}>
              &ldquo;What does it profit a man to gain the whole world, and forfeit his soul?&rdquo;
            </p>
            <cite
              className="block mt-3 text-sm not-italic uppercase tracking-widest"
              style={{ color: "var(--colour-accent-1)" }}
            >
              - Mark 8:36
            </cite>
          </motion.div>

          {/* Nav + socials + credits — fades in slightly after scripture */}
          <motion.div
            key={`nav-${pathname}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 2, delay: 3, ease: "easeOut" }}
            className="panel-scrim p-6 text-center"
          >
            {/* Social links */}
            <div className="flex items-center justify-center gap-6 mb-5">
              <a
                href={site.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:opacity-100 transition-opacity"
                style={{ color: "var(--colour-ink)", opacity: 0.45 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={site.socials.spotify}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Spotify"
                className="hover:opacity-100 transition-opacity"
                style={{ color: "var(--colour-ink)", opacity: 0.45 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:opacity-100 transition-opacity"
                style={{ color: "var(--colour-ink)", opacity: 0.45 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={site.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:opacity-100 transition-opacity"
                style={{ color: "var(--colour-ink)", opacity: 0.45 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={site.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hover:opacity-100 transition-opacity"
                style={{ color: "var(--colour-ink)", opacity: 0.45 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.17a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.6z" />
                </svg>
              </a>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-5 pb-5 border-b border-white/10">
              {site.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs uppercase tracking-widest transition-colors hover:opacity-80"
                  style={{ color: "var(--colour-ink)", opacity: 0.40 }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <p className="text-xs mb-1" style={{ color: "var(--colour-ink)", opacity: 0.35 }}>
              Artwork by{" "}
              <a
                href="https://debbieclarkart.com/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/20 underline-offset-4 hover:opacity-80"
              >
                Debbie Clarke
              </a>
            </p>
            <p className="text-xs" style={{ color: "var(--colour-ink)", opacity: 0.25 }}>
              &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { site } from "@/content/site";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/5" style={{ background: "var(--colour-bg)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Scripture — Mark 8:36 */}
        <blockquote className="mx-auto max-w-2xl text-center mb-12">
          <p className="text-lg md:text-xl italic leading-relaxed" style={{ color: "var(--colour-ink)", opacity: 0.55 }}>
            &ldquo;What does it profit a man to gain the whole world, and forfeit his soul?&rdquo;
          </p>
          <cite
            className="block mt-3 text-sm not-italic uppercase tracking-widest"
            style={{ color: "var(--colour-accent-1)" }}
          >
            &mdash; Mark 8:36
          </cite>
        </blockquote>

        {/* Social links */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <a
            href={site.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:opacity-100 transition-opacity"
            style={{ color: "var(--colour-ink)", opacity: 0.45 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href={site.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="hover:opacity-100 transition-opacity"
            style={{ color: "var(--colour-ink)", opacity: 0.45 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs uppercase tracking-widest transition-colors hover:opacity-80"
              style={{ color: "var(--colour-ink)", opacity: 0.35 }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-center text-xs" style={{ color: "var(--colour-ink)", opacity: 0.25 }}>
          &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

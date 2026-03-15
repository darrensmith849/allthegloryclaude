import Link from "next/link";
import { site } from "@/content/site";

export default function SiteFooter() {
  return (
    <footer className="relative w-full border-t border-white/5 overflow-hidden" style={{ background: "var(--colour-bg)" }}>
      {/* Crown of thorns vine — spans full width */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[120px] md:h-[160px] opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 120' fill='none' stroke='%23911' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M0 60C40 58 60 45 100 50s60 30 100 25 40-30 100-28 60 22 100 18 40-25 100-22 60 20 100 17 40-18 100-20' /%3E%3Cpath d='M0 65C50 62 70 52 110 55s50 25 90 22 50-28 100-24 55 20 95 15 45-22 95-18 55 18 95 14 45-16 120-18' /%3E%3C!-- thorns --%3E%3Cline x1='68' y1='52' x2='58' y2='38' /%3E%3Cline x1='135' y1='62' x2='142' y2='46' /%3E%3Cline x1='210' y1='48' x2='200' y2='34' /%3E%3Cline x1='285' y1='58' x2='294' y2='42' /%3E%3Cline x1='350' y1='44' x2='340' y2='30' /%3E%3Cline x1='420' y1='55' x2='430' y2='40' /%3E%3Cline x1='495' y1='46' x2='485' y2='32' /%3E%3Cline x1='560' y1='56' x2='570' y2='40' /%3E%3Cline x1='630' y1='42' x2='620' y2='28' /%3E%3Cline x1='710' y1='52' x2='720' y2='36' /%3E%3Cline x1='775' y1='46' x2='765' y2='32' /%3E%3Cline x1='95' y1='68' x2='88' y2='82' /%3E%3Cline x1='175' y1='56' x2='168' y2='72' /%3E%3Cline x1='248' y1='65' x2='256' y2='80' /%3E%3Cline x1='330' y1='52' x2='322' y2='68' /%3E%3Cline x1='398' y1='60' x2='406' y2='76' /%3E%3Cline x1='465' y1='50' x2='458' y2='66' /%3E%3Cline x1='538' y1='62' x2='546' y2='78' /%3E%3Cline x1='605' y1='48' x2='598' y2='64' /%3E%3Cline x1='680' y1='58' x2='688' y2='74' /%3E%3Cline x1='750' y1='50' x2='742' y2='66' /%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
          backgroundPosition: "center top",
          backgroundSize: "800px 120px",
        }}
      />
      {/* Blood-red glow behind thorns */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[100px] md:h-[140px] opacity-[0.12]"
        style={{
          background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(120,20,20,0.8) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
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
          <a
            href={site.socials.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
            className="hover:opacity-100 transition-opacity"
            style={{ color: "var(--colour-ink)", opacity: 0.45 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
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

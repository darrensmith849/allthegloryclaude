"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#showreels", label: "Showreels" },
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#testimonials", label: "Testimonials" },
];

// Eased scroll to an on-page section, leaving room for the fixed bar.
function glideTo(hash: string) {
  const el = hash === "#top" ? document.body : document.querySelector<HTMLElement>(hash);
  if (!el) return;
  const startY = window.scrollY;
  const targetY = hash === "#top" ? 0 : el.getBoundingClientRect().top + startY - 64;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return window.scrollTo(0, targetY);
  const distance = targetY - startY;
  const duration = Math.min(1400, Math.max(700, Math.abs(distance) * 0.5));
  const start = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + distance * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  history.replaceState(null, "", hash === "#top" ? location.pathname : hash);
}

// Full-width bar fixed to the top of the page: clear over the hero photo,
// solid paper once the visitor scrolls. Also turns every "#section" link on
// the page into a smooth glide.
export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      setOpen(false);
      glideTo(a.getAttribute("href") || "#top");
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const light = solid || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-500 ${
        light
          ? "border-b border-[var(--dj-line)] bg-[rgba(236,229,217,0.9)] text-[var(--dj-ink)] backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-black/55 to-transparent text-[var(--dj-paper)]"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-5 sm:px-8">
        <a href="#top" className="dj-serif text-xl leading-none">Daniel Jenkins</a>
        <nav className="dj-mono hidden items-center gap-8 text-[11px] uppercase tracking-[0.12em] md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="opacity-75 transition-opacity hover:opacity-100">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className={`dj-mono rounded-[3px] px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              light ? "bg-[var(--dj-ink)] text-[var(--dj-paper)] hover:bg-[var(--dj-accent)]" : "bg-[var(--dj-paper)] text-[var(--dj-ink)] hover:bg-white"
            }`}
          >
            Contact
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
            className="dj-mono text-[11px] uppercase tracking-[0.12em] md:hidden"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="dj-mono border-t border-[var(--dj-line)] px-5 pb-4 text-[12px] uppercase tracking-[0.12em] md:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="block border-b border-[var(--dj-line)] py-4 last:border-b-0">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

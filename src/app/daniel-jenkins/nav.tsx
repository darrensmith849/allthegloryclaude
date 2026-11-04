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
  const bar = document.querySelector<HTMLElement>("[data-dj-bar]")?.offsetHeight ?? 72;
  const el = hash === "#top" ? null : document.querySelector<HTMLElement>(hash);
  if (hash !== "#top" && !el) return;
  const startY = window.scrollY;
  const targetY = el ? el.getBoundingClientRect().top + startY - bar : 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetY);
  } else {
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
  }
  history.replaceState(null, "", el ? hash : location.pathname);
}

// Full-width bar fixed to the top of the page: clear over the hero photo,
// solid paper once the visitor scrolls past it. Its content sits in the same
// .dj-wrap container as every section, so the name lines up with the page.
// Also turns every "#section" link on the page into a smooth glide.
export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.55);
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
    <header data-dj-bar className="fixed inset-x-0 top-0 z-50">
      {/* Two stacked backgrounds that cross-fade: a soft shade over the photo,
          and solid paper (with a hairline drawn by shadow, not a border). */}
      <div aria-hidden className={`absolute inset-0 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-500 ${light ? "opacity-0" : "opacity-100"}`} />
      <div aria-hidden className={`absolute inset-0 bg-[rgba(236,229,217,0.92)] shadow-[0_1px_0_rgba(24,21,18,0.12)] backdrop-blur-md transition-opacity duration-500 ${light ? "opacity-100" : "opacity-0"}`} />

      <div className={`relative transition-colors duration-500 ${light ? "text-[var(--dj-ink)]" : "text-[var(--dj-paper)]"}`}>
        <div className="dj-wrap flex h-[var(--dj-header-h)] items-center justify-between">
          <a href="#top" className="dj-serif text-[1.35rem] leading-none">Daniel Jenkins</a>
          <nav className="dj-mono hidden items-center gap-[clamp(24px,3vw,44px)] text-[11px] uppercase tracking-[0.14em] md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="opacity-75 transition-opacity hover:opacity-100">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="#contact"
              className={`dj-mono rounded-[3px] px-3.5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors duration-500 ${
                light ? "bg-[var(--dj-ink)] text-[var(--dj-paper)] hover:bg-[var(--dj-accent)]" : "bg-[var(--dj-paper)] text-[var(--dj-ink)] hover:bg-white"
              }`}
            >
              Contact
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="dj-mono py-2 text-[11px] uppercase tracking-[0.14em] md:hidden"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        {open && (
          <nav className="dj-wrap dj-mono pb-4 text-[12px] uppercase tracking-[0.14em] md:hidden">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="block border-t border-[var(--dj-line)] py-4">
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

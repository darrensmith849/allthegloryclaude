"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { site } from "@/content/site";

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on any route change (including programmatic navigation).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-colour-bg/75 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-[17px] md:text-[18px] tracking-tight text-white/95 hover:text-[var(--colour-amber)] transition-colors"
          aria-label="All The Glory — home"
        >
          {site.name}
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-7 lg:gap-9">
          {site.nav.map((item) => {
            const active = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative group text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                {item.label}
                {/* Underline — amber for active, white/soft on hover for others */}
                <span
                  className={`pointer-events-none absolute left-0 right-0 -bottom-1.5 h-px origin-center transition-transform duration-300 ${
                    active
                      ? "bg-[var(--colour-amber)] scale-x-100"
                      : "bg-white/40 scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white/90 p-2"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-colour-bg/95 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-7 flex flex-col gap-5">
              {site.nav.map((item) => {
                const active = isCurrent(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 text-lg font-display transition-colors ${
                      active
                        ? "text-[var(--colour-amber)]"
                        : "text-white/85 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="h-px w-6 bg-[var(--colour-amber)]"
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

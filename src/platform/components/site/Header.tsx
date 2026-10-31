"use client";

import Link from "@/platform/components/ui/Link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { platformPath } from "@/platform/config/client-env";
import { audienceNav, primaryNav } from "@/platform/config/navigation";
import { Icon } from "@/platform/components/ui/Icon";
import { Logo } from "./Logo";

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const fullPath = usePathname();
  const pathname = platformPath(fullPath);
  const [scrolled, setScrolled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu after navigation.
  useEffect(() => {
    dialogRef.current?.close();
  }, [fullPath]);

  // Close if the viewport grows past the mobile breakpoint while open.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1000px)");
    const onChange = () => query.matches && dialogRef.current?.close();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const open = () => {
    // showModal() makes the rest of the page inert, traps focus and closes on Escape.
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="container site-header__inner">
        <Logo />
        <nav className="site-nav" aria-label="Primary">
          <ul role="list">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <Link href="/contact" className="btn btn--accent btn--sm site-header__cta">
            Start a brief
          </Link>
          <button ref={triggerRef} type="button" className="menu-button" aria-haspopup="dialog" aria-controls="mobile-nav" onClick={open}>
            <Icon name="menu" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Site menu"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="container mobile-nav__inner">
          <div className="mobile-nav__top">
            <Logo />
            <button type="button" className="menu-button" onClick={close} autoFocus>
              <Icon name="close" />
              <span>Close</span>
            </button>
          </div>
          <nav aria-label="Mobile primary" className="mobile-nav__primary">
            <ul role="list">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined} onClick={close}>
                    {item.label}
                    <Icon name="arrow-right" className="btn__icon" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="mobile-nav__secondary" role="list" aria-label="More pages">
            {[...audienceNav, { href: "/websites", label: "Websites and launches" }, { href: "/partners", label: "Partner programme" }, { href: "/apply", label: "Apply to the roster" }, { href: "/demo", label: "Platform demonstration" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-nav__cta">
            <Link href="/contact" className="btn btn--accent" onClick={close}>
              Start a project brief
            </Link>
            <Link href="/apply" className="btn" onClick={close}>
              Apply as a creative
            </Link>
          </div>
        </div>
      </dialog>
    </header>
  );
}

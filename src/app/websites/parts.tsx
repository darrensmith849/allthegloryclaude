"use client";

import { useEffect, useState } from "react";
import { CONTACT } from "./projects";

const LINKS = [
  ["#story", "Story"],
  ["#work", "Work"],
  ["#services", "Services"],
] as const;

// Top bar: clear over the hero, solid once the page scrolls. On phones the
// links move into a full-screen drawer.
export function WxNav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <>
      <header className={`wx-nav ${solid ? "solid" : ""}`}>
        <a className="wx-logo" href="#top">
          Daniel Jenkins
        </a>
        <nav className="wx-links" aria-label="Primary">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          <a href="#contact" className="wx-book">
            Start a project
          </a>
        </nav>
        <button
          type="button"
          className="wx-burger"
          aria-expanded={open}
          aria-controls="wx-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </header>
      {open && (
        <div className="wx-drawer" id="wx-drawer">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="#contact" className="wx-drawer-book" onClick={() => setOpen(false)}>
            Start a project
          </a>
        </div>
      )}
    </>
  );
}

// Marks the page as scripted, then fades each .wx-reveal in as it scrolls
// into view (same approach as the Manuchie site).
export function WxReveal() {
  useEffect(() => {
    const root = document.querySelector(".wx");
    root?.classList.add("wx-js");
    const els = Array.from(document.querySelectorAll(".wx-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

// The hero's signature: a browser address bar typing out the kind of web
// address a client's new site could live at.
const DOMAINS = ["yourbusiness.co.za", "yourchurch.org", "yourname.com", "yourbrand.co.zw", "yourstudio.com"];

export function TypedAddress() {
  const [text, setText] = useState(DOMAINS[0]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let n = DOMAINS[0].length;
    let deleting = true;
    let t = 0;
    const step = () => {
      const word = DOMAINS[i];
      if (deleting) {
        n -= 1;
        setText(word.slice(0, n));
        if (n <= 0) {
          deleting = false;
          i = (i + 1) % DOMAINS.length;
        }
        t = window.setTimeout(step, 45);
      } else {
        const next = DOMAINS[i];
        n += 1;
        setText(next.slice(0, n));
        if (n >= next.length) {
          deleting = true;
          t = window.setTimeout(step, 2200);
        } else {
          t = window.setTimeout(step, 85);
        }
      }
    };
    t = window.setTimeout(step, 2600);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="wx-addr-wrap">
      <div className="wx-addr" aria-label="Your website, on your own web address">
        <span className="wx-addr-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <svg className="wx-addr-lock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span className="wx-addr-pre" aria-hidden="true">
          https://
        </span>
        <span className="wx-addr-typed" aria-hidden="true">
          {text}
        </span>
        <span className="wx-caret" aria-hidden="true" />
      </div>
      <p className="wx-addr-note">Your website, live on your own address.</p>
    </div>
  );
}

// The enquiry form. Sends through the site's own /api/contact, which emails
// Daniel (flagged as a website enquiry). If that fails, it points people to
// WhatsApp instead so nobody is left stuck.
export function EnquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  return (
    <form
      className="wx-form wx-reveal"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        setState("sending");
        setMsg("");
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "contact",
              source: "websites",
              name: String(data.get("name") ?? ""),
              email: String(data.get("email") ?? ""),
              message: String(data.get("message") ?? ""),
              website: String(data.get("website") ?? ""),
            }),
          });
          const out = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
          if (res.ok && out.success) {
            form.reset();
            setState("ok");
            setMsg("Got it - I'll be in touch soon. Thank you.");
          } else {
            setState("err");
            setMsg(out.error ?? "Something went wrong. Please message me on WhatsApp instead.");
          }
        } catch {
          setState("err");
          setMsg("Something went wrong. Please message me on WhatsApp instead.");
        }
      }}
    >
      <input type="text" name="website" className="wx-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="wx-fld">
        <span>Your name</span>
        <input type="text" name="name" autoComplete="name" required placeholder="First and last" />
      </label>
      <label className="wx-fld">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required placeholder="you@email.com" />
      </label>
      <label className="wx-fld">
        <span>Your project</span>
        <textarea name="message" rows={4} required minLength={10} placeholder="A little about you, your business and what you'd like your website to do..." />
      </label>
      <button type="submit" className="wx-btn wx-btn-gold wx-btn-wide" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Send it over"}
      </button>
      <p className={`wx-status ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`} role="status" aria-live="polite">
        {msg}
        {state === "err" && (
          <>
            {" "}
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="underline">
              Open WhatsApp
            </a>
          </>
        )}
      </p>
    </form>
  );
}

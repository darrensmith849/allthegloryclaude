"use client";

/**
 * Newsletter signup — submits the email straight to Web3Forms
 * (client-side), the same free service and access key the contact form
 * uses. Their free plan rejects server-to-server calls, so the POST is
 * made from the browser; the access key is public by design. Each
 * sign-up arrives as an email to the inbox linked to the key.
 *
 * (Previously this posted to /api/subscribe, which was wired to Resend.
 * Resend was retired, so that endpoint is gone and this talks to
 * Web3Forms directly — no server env vars required.)
 */

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

// Same public Web3Forms access key the contact form uses — routes to the
// All The Glory inbox.
const WEB3FORMS_KEY = "0a0492f8-1036-4a26-8c01-e3cbdd7fab32";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    // Honeypot — real people leave this hidden field empty. If it's
    // filled, silently fake success so bots don't learn anything.
    const form = e.currentTarget;
    const trap = (form.elements.namedItem("botcheck") as HTMLInputElement | null)?.value;
    if (trap) {
      setStatus("success");
      setMessage("Thank you - we'll let you know when new music drops.");
      setEmail("");
      return;
    }

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "New newsletter signup - All The Glory",
          from_name: "All The Glory website",
          replyto: trimmed,
          email: trimmed,
          message: `New "Stay in the loop" subscriber: ${trimmed}`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
      };
      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Thank you - we'll let you know when new music drops.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="w-full"
      aria-describedby="newsletter-status"
    >
      <label
        htmlFor="newsletter-email"
        className="block eyebrow mb-3 text-white/55"
      >
        Stay in the loop
      </label>
      {/* Honeypot: visually hidden, off the tab order, ignored by real users. */}
      <input
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          aria-invalid={status === "error"}
          className="flex-1 min-w-0 px-4 py-3 text-base md:text-sm text-white placeholder:text-white/30 bg-white/[0.04] border border-white/10 rounded-lg focus:outline-none focus:border-[var(--colour-amber)]/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="btn btn-primary sm:shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading"
            ? "Subscribing…"
            : status === "success"
              ? "Subscribed"
              : "Notify me →"}
        </button>
      </div>
      <p
        id="newsletter-status"
        role={status === "error" ? "alert" : "status"}
        className={`mt-3 text-xs min-h-[1.2em] ${
          status === "error"
            ? "text-red-400/90"
            : status === "success"
              ? "text-[var(--colour-amber)]"
              : "text-white/40"
        }`}
      >
        {message || (status === "idle" ? "No spam. Occasional updates only." : "")}
      </p>
    </form>
  );
}

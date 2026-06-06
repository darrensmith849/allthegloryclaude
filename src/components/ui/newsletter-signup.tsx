"use client";

/**
 * Newsletter signup - posts to /api/subscribe. The API route is
 * intentionally stubbed; wire it to Resend / ConvertKit / Mailchimp /
 * Buttondown when ready by editing src/app/api/subscribe/route.ts.
 */

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.ok) {
        setStatus("success");
        setMessage("Thank you - we'll let you know when new music drops.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
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
          className="flex-1 min-w-0 px-4 py-3 text-sm text-white placeholder:text-white/30 bg-white/[0.04] border border-white/10 rounded-lg focus:outline-none focus:border-[var(--colour-amber)]/60 disabled:opacity-60"
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

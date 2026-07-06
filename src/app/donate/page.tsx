"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

// Quick-amount shortcuts in ZAR (Rand), spanning R50 → R5000. These are
// shortcuts only, never a cap — the custom field below accepts any amount
// from R50 up.
const PRESETS = [50, 100, 250, 500, 1000, 5000] as const;
const MIN_AMOUNT = 50;

export default function DonatePage() {
  const [amount, setAmount] = useState("100");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduce = useReducedMotion();

  function validate(): string | null {
    const n = Number(amount.trim());
    if (!amount.trim()) return "Please enter an amount.";
    if (!Number.isFinite(n) || n <= 0) return "Please enter a valid amount.";
    if (n < MIN_AMOUNT) return `The minimum donation is R${MIN_AMOUNT}.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Please enter a valid email so Paystack can send your receipt.";
    return null;
  }

  function selectPreset(value: number) {
    setAmount(String(value));
    if (error) setError(null);
  }

  async function donate() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout-donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount.trim()),
          email: email.trim(),
          name: name.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Donations aren’t available right now.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const activePreset = PRESETS.find((p) => String(p) === amount.trim());

  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.1, ease: "easeOut" as const };
  const cardTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.3, ease: [0.06, 1, 0.18, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-2xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 flex flex-col">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={headerTransition}
          className="text-center"
        >
          <div className="eyebrow">Give</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Give to the mission
          </h1>
          <p className="font-display mt-5 text-base md:text-lg italic text-white/75 max-w-xl mx-auto leading-relaxed">
            The music is a free offering. This isn’t.
          </p>
          <p className="mt-4 text-sm md:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            <span className="text-[var(--colour-amber)] font-medium">
              100% of every donation goes to CrossCoders.
            </span>{" "}
            Your gift funds free software for churches that could never
            otherwise afford it.
          </p>
        </motion.header>

        {/* Amount card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={cardTransition}
          className="mt-10 md:mt-14 panel-scrim panel-flush-mobile p-7 md:p-9"
          aria-labelledby="give-heading"
        >
          <h2 id="give-heading" className="sr-only">
            Donation amount
          </h2>

          <div className="text-xs uppercase tracking-[0.26em] text-white/55">
            Quick amounts
          </div>
          <div
            role="group"
            aria-label="Donation quick amounts in Rand"
            className="mt-3 flex flex-wrap gap-2"
          >
            {PRESETS.map((value) => {
              const active = activePreset === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectPreset(value)}
                  aria-pressed={active}
                  className={`chip ${active ? "chip-active" : ""}`}
                >
                  R{value}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-white/55">
            Or enter your own amount below.
          </p>

          {/* Custom amount */}
          <div className="mt-5">
            <label
              htmlFor="donation-amount"
              className="text-xs uppercase tracking-[0.26em] text-white/60"
            >
              Amount (ZAR)
            </label>
            <div className="relative mt-2">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
              >
                R
              </span>
              <input
                id="donation-amount"
                type="number"
                inputMode="decimal"
                min={MIN_AMOUNT}
                step="10"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                aria-label="Donation amount in Rand"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 py-3 text-base text-white outline-none focus:border-[var(--colour-amber)]/60 transition-colors"
              />
            </div>
          </div>

          {/* Email — Paystack requires it to send a receipt */}
          <div className="mt-5">
            <label
              htmlFor="donation-email"
              className="text-xs uppercase tracking-[0.26em] text-white/60"
            >
              Email (for your receipt)
            </label>
            <input
              id="donation-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-[var(--colour-amber)]/60 transition-colors"
            />
          </div>

          {/* Name — optional */}
          <div className="mt-5">
            <label
              htmlFor="donation-name"
              className="text-xs uppercase tracking-[0.26em] text-white/60"
            >
              Name (optional)
            </label>
            <input
              id="donation-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none focus:border-[var(--colour-amber)]/60 transition-colors"
            />
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="mt-4 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={donate}
            disabled={submitting}
            className="mt-7 btn btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Redirecting…" : "Donate with Paystack →"}
          </button>

          <p className="mt-5 text-xs text-white/55 leading-relaxed">
            Secure checkout via Paystack — your card details never touch this
            site. You’ll get an emailed receipt from Paystack.
          </p>
        </motion.section>

        {/* Who the money helps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={cardTransition}
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          <div className="panel-scrim p-6 flex flex-col">
            <div className="eyebrow eyebrow-amber">Where it goes</div>
            <h3 className="font-display mt-3 text-xl text-white">CrossCoders</h3>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              CrossCoders builds free software and websites for
              under-resourced churches — so ministries that could never
              afford a developer can still reach and serve their communities
              online. (This very site was donated by them.)
            </p>
            <a
              href="https://www.crosscoders.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--colour-amber)]/80 hover:text-[var(--colour-amber)] transition-colors"
            >
              crosscoders.co.za ↗
            </a>
            <Image
              src="/media/crosscoders-logo.png"
              alt="CrossCoders"
              width={700}
              height={264}
              className="mt-auto pt-6 w-44 h-auto rounded-md"
            />
          </div>

          <div className="panel-scrim p-6 flex flex-col">
            <div className="eyebrow eyebrow-amber">The umbrella</div>
            <h3 className="font-display mt-3 text-xl text-white">
              Kingdom Come Foundation
            </h3>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              CrossCoders is a venture of the Kingdom Come Foundation — a
              gospel-centred non-profit empowering the Church through
              technology, mercy, and practical support, from orphan care to
              artisan livelihoods.{" "}
              <span className="italic text-white/60">Until His Kingdom comes.</span>
            </p>
            {/* Link intentionally omitted until the Kingdom Come Foundation
                site is live. */}
            <Image
              src="/media/kingdom-come-logo.png"
              alt="Kingdom Come Foundation"
              width={700}
              height={233}
              className="mt-auto pt-6 w-44 h-auto rounded-md"
            />
          </div>
        </motion.section>
      </div>
    </main>
  );
}

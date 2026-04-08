"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function GivePage() {
  const [amount, setAmount] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduce = useReducedMotion();

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter an amount.";
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return "Please enter a valid number.";
    if (n <= 0) return "Amount must be greater than zero.";
    return null;
  }

  async function donate() {
    const v = validate(amount);
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
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Donations not configured.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.1, ease: "easeOut" as const };
  const cardTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.3, ease: [0.06, 1, 0.18, 1] as const };

  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={headerTransition}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Give</h1>
          <p className="mt-4 text-white/70">
            The album is free - but if it blessed you, your giving helps fund what's next.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={cardTransition}
          className="mt-8 panel-scrim p-6"
        >
          <label
            htmlFor="donation-amount"
            className="text-xs uppercase tracking-[0.28em] text-white/60"
          >
            Amount (USD)
          </label>
          <input
            id="donation-amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError(null);
            }}
            aria-label="Donation amount in USD"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "donation-error" : "donation-help"}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none focus:border-[var(--colour-amber)]/60"
          />
          {error && (
            <p
              id="donation-error"
              role="alert"
              aria-live="polite"
              className="mt-2 text-xs text-red-300"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={donate}
            disabled={submitting}
            className="mt-5 btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Redirecting…" : "Donate →"}
          </button>

          <p id="donation-help" className="mt-4 text-xs text-white/55">
            Every gift goes straight into recording, production, and releasing new music.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

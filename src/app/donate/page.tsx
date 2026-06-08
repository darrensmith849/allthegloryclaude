"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PRESETS = [5, 10, 20, 50] as const;

export default function DonatePage() {
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

  function selectPreset(value: number) {
    setAmount(String(value));
    if (error) setError(null);
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

  // Selected preset = the chip whose value matches the current amount.
  const activePreset = PRESETS.find((p) => String(p) === amount.trim());

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-2xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh] flex flex-col">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={headerTransition}
          className="text-center"
        >
          <div className="eyebrow">Donate</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            An offering
          </h1>
          <p className="font-display mt-5 text-base md:text-lg italic text-white/75 max-w-xl mx-auto leading-relaxed">
            I didn&apos;t want to put a price on worship - this is an
            offering unto the Lord.
          </p>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            If you feel led to support the work, your gift goes directly
            into recording, production, and releasing more music. A portion
            of every gift also goes toward causes close to my heart -
            helping others, beyond the music.
          </p>
        </motion.header>

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

          {/* Preset chips - quick shortcuts only, never a maximum */}
          <div className="text-xs uppercase tracking-[0.26em] text-white/55">
            Quick amounts
          </div>
          <div
            role="group"
            aria-label="Donation quick amounts in USD"
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
                  ${value}
                </button>
              );
            })}
          </div>

          {/* Bridge helper - explicitly tells users they aren't capped at $50 */}
          <p className="mt-4 text-xs text-white/55">
            Or enter your own amount below.
          </p>

          {/* Custom amount - fully open-ended, any positive value */}
          <div className="mt-5">
            <label
              htmlFor="donation-amount"
              className="text-xs uppercase tracking-[0.26em] text-white/60"
            >
              Custom amount - enter any amount
            </label>
            <div className="relative mt-2">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
              >
                $
              </span>
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
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-4 py-3 text-base text-white outline-none focus:border-[var(--colour-amber)]/60 transition-colors"
              />
            </div>
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
          </div>

          <button
            type="button"
            onClick={donate}
            disabled={submitting}
            className="mt-7 btn btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Redirecting…" : "Donate now →"}
          </button>

          <p
            id="donation-help"
            className="mt-5 text-xs text-white/55 leading-relaxed"
          >
            Secure checkout via Stripe. Every gift goes directly into
            recording, production, and releasing new music.
          </p>
        </motion.section>
      </div>
    </main>
  );
}

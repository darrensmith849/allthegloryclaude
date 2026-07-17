"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type Verify =
  | { state: "checking" }
  | { state: "success"; amount?: number; currency?: string }
  | { state: "failed" }
  | { state: "unknown" };

export default function DonateSuccessPage() {
  const [result, setResult] = useState<Verify>({ state: "checking" });
  const reduce = useReducedMotion();

  useEffect(() => {
    // Paystack appends ?reference= (and ?trxref=) to the callback URL.
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setResult({ state: "unknown" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/verify-donation?reference=${encodeURIComponent(reference)}`,
        );
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          amount?: number;
          currency?: string;
        };
        if (cancelled) return;
        if (data.status === "success") {
          setResult({ state: "success", amount: data.amount, currency: data.currency });
        } else if (data.status === "failed") {
          setResult({ state: "failed" });
        } else {
          setResult({ state: "unknown" });
        }
      } catch {
        if (!cancelled) setResult({ state: "unknown" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const money =
    result.state === "success" && typeof result.amount === "number"
      ? `${result.currency === "ZAR" ? "R" : ""}${result.amount.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`
      : null;

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-xl px-6 pt-32 md:pt-40 pb-24 min-h-[70vh] flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {result.state === "checking" && (
            <>
              <div className="eyebrow eyebrow-amber">One moment</div>
              <h1 className="font-display mt-4 text-3xl md:text-5xl text-white">
                Confirming your gift…
              </h1>
            </>
          )}

          {result.state === "success" && (
            <>
              <div className="eyebrow eyebrow-amber">Thank you</div>
              <h1 className="font-display mt-4 text-3xl md:text-5xl text-white">
                {money ? `${money} — received` : "Your gift was received"}
              </h1>
              <p className="mt-5 text-base text-white/70 leading-relaxed">
                Every cent goes to <span className="text-white/90">CrossCoders</span>,
                helping under-resourced churches get online. Paystack has
                emailed your receipt. Thank you for standing with the mission.
              </p>
            </>
          )}

          {result.state === "failed" && (
            <>
              <div className="eyebrow">Not completed</div>
              <h1 className="font-display mt-4 text-3xl md:text-5xl text-white">
                That payment didn’t go through
              </h1>
              <p className="mt-5 text-base text-white/70 leading-relaxed">
                No charge was made. You’re welcome to try again whenever
                you’re ready.
              </p>
            </>
          )}

          {result.state === "unknown" && (
            <>
              <div className="eyebrow">Hmm</div>
              <h1 className="font-display mt-4 text-3xl md:text-5xl text-white">
                We couldn’t confirm that
              </h1>
              <p className="mt-5 text-base text-white/70 leading-relaxed">
                If you were charged, your receipt from Paystack is the record
                of your gift — and thank you. If you’re not sure, please reach
                out and we’ll check.
              </p>
            </>
          )}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Back home →
            </Link>
            {result.state !== "success" && (
              <Link
                href="/give"
                className="btn"
                style={{ border: "1px solid rgba(255,255,255,0.18)" }}
              >
                Try again
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}

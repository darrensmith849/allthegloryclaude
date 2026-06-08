"use client";

/**
 * Numbered process visualisation - the 1 → 2 → 3 → 4 ribbon you see
 * on Opus/Vercel landing pages. Horizontal on desktop, vertical on mobile.
 * Steps fade in as the section enters view.
 */

import { motion, useReducedMotion } from "framer-motion";

export type ProcessStep = {
  /** Short title, 2–4 words. */
  title: string;
  /** One-sentence description. */
  body: string;
};

export default function ProcessSteps({
  eyebrow,
  title,
  steps,
}: {
  eyebrow?: string;
  title?: string;
  steps: ProcessStep[];
}) {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label={title ?? "Process"}
      className="mx-auto w-full max-w-5xl px-6 py-14 md:py-20"
    >
      {(eyebrow || title) && (
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: reduce ? 0.01 : 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center mb-10 md:mb-14"
        >
          {eyebrow && <div className="eyebrow eyebrow-amber">{eyebrow}</div>}
          {title && (
            <h2 className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight">
              {title}
            </h2>
          )}
        </motion.header>
      )}

      <ol className="grid gap-5 md:grid-cols-4 md:gap-4">
        {steps.map((step, i) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: reduce ? 0.01 : 0.6,
              delay: reduce ? 0 : i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative panel-scrim panel-flush-mobile p-6 md:p-7"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="font-display text-2xl tabular-nums text-[var(--colour-amber)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <h3 className="font-display mt-4 text-lg md:text-xl text-white tracking-tight">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">
              {step.body}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

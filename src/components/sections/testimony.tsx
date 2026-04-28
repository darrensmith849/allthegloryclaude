"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  storyTitle,
  storyKicker,
  storyParagraphs,
  storyBenediction,
} from "@/content/story";

type TestimonyProps = {
  /** Hide the heading entirely. Use when the parent page provides its own. */
  showHeader?: boolean;
  /** Optional custom eyebrow rendered inside the glass panel, above the title.
   *  When provided together with `title`, an editorial section-style header is
   *  rendered instead of the default album-style header. */
  eyebrow?: string;
  /** Optional custom section title. See `eyebrow`. */
  title?: string;
  /** Optional id for the rendered heading, for aria-labelledby linking. */
  headingId?: string;
};

export default function Testimony({
  showHeader = true,
  eyebrow,
  title,
  headingId,
}: TestimonyProps) {
  const reduce = useReducedMotion();

  // Smooth scroll-triggered fades. Each paragraph triggers on its own
  // viewport entry — scroll position is the natural stagger, so we
  // don't pile artificial delays on top.
  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };
  const paragraphTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const };

  // Trigger once each paragraph is meaningfully into the viewport,
  // not the moment its top edge first peeks. Feels like the line is
  // fading in as you read into it.
  const paragraphViewport = { once: true, margin: "-15% 0px -15% 0px" };

  const useCustomHeader = Boolean(eyebrow && title);

  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20">
        <div className="panel-scrim p-7 md:p-10">
          {showHeader && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={headerTransition}
              className={
                useCustomHeader
                  ? "text-center mb-8 md:mb-10"
                  : "text-center mb-12 md:mb-16"
              }
            >
              {useCustomHeader ? (
                <>
                  <div className="eyebrow eyebrow-amber">
                    {eyebrow}
                  </div>
                  <h2
                    id={headingId}
                    className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight"
                  >
                    {title}
                  </h2>
                </>
              ) : (
                <>
                  <h2
                    id={headingId}
                    className="font-display text-4xl md:text-6xl lg:text-7xl font-normal tracking-tight mb-4"
                    style={{ color: "var(--colour-ink)" }}
                  >
                    {storyTitle}
                  </h2>
                  <p
                    className="text-lg md:text-xl"
                    style={{ color: "var(--colour-accent-1)" }}
                  >
                    {storyKicker}
                  </p>
                </>
              )}
            </motion.div>
          )}

          <div className="space-y-6 md:space-y-7">
            {storyParagraphs.map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={paragraphViewport}
                transition={paragraphTransition}
                className="text-base md:text-lg leading-relaxed"
                style={{ color: "var(--colour-ink)", opacity: 0.78 }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* Closing benediction — set apart with a soft amber hairline,
              centred italic Fraunces, slightly larger than the body. Gives
              the prayer the visual weight a benediction deserves without
              feeling disconnected from the body above. */}
          {storyBenediction && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={paragraphViewport}
              transition={paragraphTransition}
              className="mt-3 md:mt-5 pt-5 md:pt-6 text-center"
            >
              <div className="mx-auto h-px w-12 bg-[var(--colour-amber)]/30" />
              <p
                className="font-display mt-5 md:mt-6 text-lg md:text-xl italic leading-relaxed"
                style={{ color: "var(--colour-ink)", opacity: 0.88 }}
              >
                {storyBenediction}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

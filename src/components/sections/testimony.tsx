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

  // Each paragraph fades in independently as the user scrolls it into
  // reading position. We hold the trigger until the line is solidly in
  // the middle band of the viewport (not the moment its top edge first
  // peeks), which means scroll speed is the natural stagger and the
  // result feels like the words are appearing as you arrive at them
  // rather than popping in batches.
  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const };
  const paragraphTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };

  // Trigger band: shrink the viewport by 25% top + 25% bottom, so a
  // paragraph only counts as "in view" once its top is in the centre
  // 50% of the screen — i.e. once you can comfortably read it.
  const paragraphViewport = { once: true, margin: "-25% 0px -25% 0px" };
  const headerViewport = { once: true, margin: "-15% 0px -15% 0px" };

  const useCustomHeader = Boolean(eyebrow && title);

  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20">
        <div className="panel-scrim p-7 md:p-10">
          {showHeader && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={headerViewport}
              transition={headerTransition}
              className={
                useCustomHeader
                  ? "text-center mb-8 md:mb-10"
                  : "text-center mb-12 md:mb-16"
              }
            >
              {useCustomHeader ? (
                <>
                  <div className="eyebrow eyebrow-amber">{eyebrow}</div>
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
                initial={{ opacity: 0, y: 12 }}
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
              initial={{ opacity: 0, y: 12 }}
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

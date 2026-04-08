"use client";

import { motion, useReducedMotion } from "framer-motion";
import { storyTitle, storyKicker, storyParagraphs } from "@/content/story";

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
  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };
  const paragraphTransition = (i: number) =>
    reduce
      ? { duration: 0.01 }
      : { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const };

  const useCustomHeader = Boolean(eyebrow && title);

  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20">
        <div className="panel-scrim p-7 md:p-10">
          {showHeader && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={paragraphTransition(i)}
                className="text-base md:text-lg leading-relaxed"
                style={{ color: "var(--colour-ink)", opacity: 0.78 }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

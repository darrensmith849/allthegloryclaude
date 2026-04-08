"use client";

import { motion, useReducedMotion } from "framer-motion";
import { storyTitle, storyKicker, storyParagraphs } from "@/content/story";

type TestimonyProps = {
  /** Hide the album-style "From Darkness To Light" heading.
   *  Use this when the parent page already provides its own page heading. */
  showHeader?: boolean;
};

export default function Testimony({ showHeader = true }: TestimonyProps) {
  const reduce = useReducedMotion();
  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };
  const paragraphTransition = (i: number) =>
    reduce
      ? { duration: 0.01 }
      : { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const };

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
              className="text-center mb-12 md:mb-16"
            >
              <h2
                className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
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

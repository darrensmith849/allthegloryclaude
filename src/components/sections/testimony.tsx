"use client";

import { motion } from "framer-motion";
import { storyTitle, storyKicker, storyParagraphs } from "@/content/story";

export default function Testimony() {
  return (
    <section className="relative w-full py-24 md:py-36" style={{ background: "var(--colour-bg)" }}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
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

        <div className="space-y-8">
          {storyParagraphs.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-lg md:text-xl leading-relaxed"
              style={{ color: "var(--colour-ink)", opacity: 0.7 }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

/**
 * FAQ accordion. Each item is a native <details> so the panel still
 * works without JavaScript and is accessible by default; the rotate /
 * chevron is driven purely by the [open] attribute.
 */

import { motion, useReducedMotion } from "framer-motion";

export type FAQItem = { q: string; a: string };

export default function FAQ({
  eyebrow,
  title,
  items,
}: {
  eyebrow?: string;
  title?: string;
  items: FAQItem[];
}) {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label={title ?? "Frequently asked questions"}
      className="mx-auto w-full max-w-3xl px-6 py-14 md:py-20"
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

      <div className="panel-scrim divide-y divide-white/10">
        {items.map((item, i) => (
          <details
            key={item.q}
            className="group px-6 py-5 md:px-8 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
              <span className="font-display text-base md:text-lg text-white/95 tracking-tight pr-2">
                {item.q}
              </span>
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-white/45 transition-transform duration-300 group-open:rotate-45 group-open:text-[var(--colour-amber)]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div
              className="mt-3 text-sm md:text-base text-white/70 leading-relaxed"
              // Pre-warmed max-height so the description isn't clipped
              // when the item opens — detail elements don't animate height
              // natively, and we're deliberately not adding a JS height
              // measurement for 10-item FAQ.
              style={{ contain: i === items.length - 1 ? "none" : "layout" }}
            >
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

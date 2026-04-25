"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { VideoCollectionItem } from "@/content/videos";

/**
 * Editorial row for a single video in the curated collection.
 *
 * Visually echoes the TrackRow on the Music page — same panel-scrim,
 * same alternating side-entrance, same shimmer sweep, same hover-to-
 * reveal pattern — but renders an external link to YouTube instead of
 * an audio preview.
 */
export default function VideoRow({
  item,
  index,
  hoverReady,
}: {
  item: VideoCollectionItem;
  index: number;
  hoverReady: boolean;
}) {
  const reduce = useReducedMotion();
  const fromRight = index % 2 === 1;

  // Stagger entrance — first row lands quickly, each subsequent row
  // arrives a beat after.
  const entranceTransition = reduce
    ? { duration: 0.01 }
    : {
        duration: 1.2,
        delay: 0.18 * index,
        ease: [0.06, 1, 0.18, 1] as const,
      };
  const shimmerTransition = reduce
    ? { duration: 0 }
    : {
        duration: 1.6,
        delay: 0.18 * index + 1.4,
        ease: "easeInOut" as const,
      };

  return (
    <motion.a
      href={item.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: fromRight ? "20vw" : "-20vw" }
      }
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={entranceTransition}
      className={`${hoverReady ? "group" : ""} panel-scrim px-5 py-4 md:px-6 md:py-5 relative overflow-hidden block transition-transform duration-500 hover:-translate-y-[2px]`}
      aria-label={`Watch ${item.title} on YouTube (opens in a new tab)`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 text-left">
          <div className="eyebrow">{item.kind}</div>
          <div className="font-display mt-1 text-lg md:text-2xl font-normal text-white/95 truncate tracking-tight group-hover:text-[var(--colour-amber)] transition-colors duration-300">
            {item.title}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55 group-hover:text-white/90 transition-colors duration-300">
          <span>Watch</span>
          <span className="transition-transform duration-300 group-hover:translate-x-[2px]">
            ↗
          </span>
        </div>
      </div>

      {/* Editorial description revealed on hover — mirrors the verse
          reveal on the Music track rows. */}
      <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-32 group-hover:opacity-100 transition-all duration-500 ease-out text-left">
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="font-display flex-1 min-w-0 text-base italic text-white/75 leading-relaxed">
            {item.description}
          </p>
          {item.duration && (
            <span className="text-[10px] uppercase tracking-[0.26em] text-white/45 tabular-nums">
              {item.duration}
            </span>
          )}
        </div>
      </div>

      {/* Shimmer sweep after landing — same family as the Music tracks. */}
      {!reduce && (
        <motion.div
          initial={{ x: "-100%" }}
          whileInView={{ x: "200%" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={shimmerTransition}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(216,178,90,0.18) 45%, rgba(255,255,255,0.13) 50%, rgba(216,178,90,0.18) 55%, transparent 70%)",
          }}
        />
      )}
    </motion.a>
  );
}

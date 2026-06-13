"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import {
  storyTitle,
  storyKicker,
  storyParagraphs,
  storyBenediction,
  storyHomeHook,
} from "@/content/story";

type TestimonyProps = {
  /** Hide the heading entirely. Use when the parent page provides its own. */
  showHeader?: boolean;
  /** Optional custom eyebrow rendered inside the glass panel, above the title.
   *  When provided together with `title`, an editorial section-style header is
   *  rendered instead of the default album-style header. */
  eyebrow?: string;
  /** Optional custom section title. See `eyebrow`.
   *  Accepts ReactNode so callers can fold styling (e.g. the
   *  inverted-glyph "From Darkness" treatment) directly into the
   *  heading instead of stacking a tagline below it. */
  title?: ReactNode;
  /** Optional id for the rendered heading, for aria-labelledby linking. */
  headingId?: string;
  /** Teaser mode for the home page: render the single editorial hook
   *  from storyHomeHook + a "Read the full story →" link to /about,
   *  instead of slicing the long-form paragraphs. /about renders the
   *  full story unchanged. */
  preview?: boolean;
};

/**
 * Pure-CSS fade-on-view wrapper.
 *
 * Why not framer-motion's whileInView here?
 *
 * The Testimony component is server-rendered for SEO + first-paint. Framer-
 * motion v12 has a known SSR/client divergence on `motion` components where
 * the server emits `style="opacity:0"` (number) and the client emits
 * `style="opacity:0"` (string). React 18 logs a hydration mismatch and
 * refuses to patch up the DOM - which can leave the animation stuck and
 * cause the bug we were debugging ("motion graphics still static").
 *
 * This component uses identical inline styles on server + client and only
 * toggles a single piece of state on intersection - no hydration issue,
 * no stuck animations, works reliably in Chrome, Safari, and mobile.
 *
 * Respects prefers-reduced-motion: skips the transform + transition and
 * just makes the content visible.
 */
function FadeOnView({
  children,
  as = "div",
  className,
  style,
  finalOpacity = 1,
  yOffset = 12,
  rootMargin = "-25% 0px -25% 0px",
  duration = 1200,
}: {
  children: ReactNode;
  as?: "div" | "p";
  className?: string;
  style?: CSSProperties;
  finalOpacity?: number;
  yOffset?: number;
  rootMargin?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement & HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    // If the element is already in the viewport before IO fires (e.g. above
    // the fold on first paint), reveal it immediately instead of waiting.
    const r = el.getBoundingClientRect();
    if (
      r.top < window.innerHeight * 0.75 &&
      r.bottom > window.innerHeight * 0.25
    ) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  const mergedStyle: CSSProperties = {
    ...style,
    opacity: visible ? finalOpacity : 0,
    transform: visible ? "none" : `translateY(${yOffset}px)`,
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: visible ? undefined : "opacity, transform",
  };

  if (as === "p") {
    return (
      <p ref={ref} className={className} style={mergedStyle}>
        {children}
      </p>
    );
  }
  return (
    <div ref={ref} className={className} style={mergedStyle}>
      {children}
    </div>
  );
}

export default function Testimony({
  showHeader = true,
  eyebrow,
  title,
  headingId,
  preview = false,
}: TestimonyProps) {
  const useCustomHeader = Boolean(eyebrow && title);
  // Preview mode (home page) renders a single editorial hook line
  // instead of a sliced sub-set of the long-form story paragraphs —
  // a hook makes the home section feel intentional rather than like a
  // fragment that breaks off mid-arc.
  const paragraphs = preview ? [storyHomeHook] : storyParagraphs;

  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-0 md:px-6 py-14 md:py-20">
        <div className="panel-scrim panel-flush-mobile p-7 md:p-10">
          {showHeader && (
            <FadeOnView
              yOffset={20}
              duration={1400}
              rootMargin="-15% 0px -15% 0px"
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
            </FadeOnView>
          )}

          <div className="space-y-6 md:space-y-7">
            {paragraphs.map((paragraph, i) => (
              <FadeOnView
                key={i}
                as="p"
                finalOpacity={0.78}
                yOffset={12}
                duration={1200}
                rootMargin="-25% 0px -25% 0px"
                className={
                  preview
                    ? "font-display italic text-lg md:text-2xl leading-relaxed text-center max-w-2xl mx-auto"
                    : "text-base md:text-lg leading-relaxed"
                }
                style={{ color: "var(--colour-ink)" }}
              >
                {paragraph}
              </FadeOnView>
            ))}
          </div>

          {/* Preview-mode CTA — visible only on the home page. Sends curious
              visitors to /about for the full story rather than dropping the
              same five paragraphs in twice. */}
          {preview && (
            <FadeOnView
              finalOpacity={1}
              yOffset={8}
              duration={1000}
              rootMargin="-25% 0px -25% 0px"
              className="mt-8 md:mt-10 text-center"
            >
              <Link
                href="/about"
                className="inline-block text-[12px] md:text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--colour-amber)]/80 hover:text-[var(--colour-amber)] transition-colors duration-300"
              >
                Read the full story →
              </Link>
            </FadeOnView>
          )}

          {/* Closing benediction - set apart with a soft amber hairline,
              centred italic Fraunces, slightly larger than the body. Gives
              the prayer the visual weight a benediction deserves without
              feeling disconnected from the body above. Hidden in preview
              mode so the teaser ends on the CTA, not the prayer. */}
          {storyBenediction && !preview && (
            <FadeOnView
              finalOpacity={0.88}
              yOffset={12}
              duration={1200}
              rootMargin="-25% 0px -25% 0px"
              className="mt-3 md:mt-5 pt-5 md:pt-6 text-center"
            >
              <div className="mx-auto h-px w-12 bg-[var(--colour-amber)]/30" />
              <p
                className="font-display mt-5 md:mt-6 text-lg md:text-xl italic leading-relaxed"
                style={{ color: "var(--colour-ink)" }}
              >
                {storyBenediction}
              </p>
            </FadeOnView>
          )}
        </div>
      </div>
    </section>
  );
}

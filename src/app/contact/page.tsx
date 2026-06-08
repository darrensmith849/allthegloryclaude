"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import NewsletterSignup from "@/components/ui/newsletter-signup";
import { site } from "@/content/site";

const CONTACT_INBOX = "peter777daniel@gmail.com";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  function validate(formData: FormData) {
    const errs: Record<string, string> = {};
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const honeypot = formData.get("website") as string;

    if (honeypot) return { __bot: "true" };

    if (!name || name.trim().length < 2) errs.name = "Please enter your name.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Please enter a valid email address.";
    if (!message || message.trim().length < 10)
      errs.message = "Message must be at least 10 characters.";

    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const formData = new FormData(e.currentTarget);
    const validationErrors = validate(formData);

    if (validationErrors.__bot) {
      // Bot - fake success and bail.
      setStatus("sent");
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid =
        validationErrors.name
          ? "name"
          : validationErrors.email
            ? "email"
            : "message";
      requestAnimationFrame(() => {
        document.getElementById(firstInvalid)?.focus();
      });
      return;
    }

    setErrors({});
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (formData.get("name") as string).trim(),
          email: (formData.get("email") as string).trim(),
          message: (formData.get("message") as string).trim(),
          website: formData.get("website") as string,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setServerError(
          data.error ??
            "We couldn't send your message right now. Please try again.",
        );
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
      setStatus("idle");
    }
  }

  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, delay: 0.1, ease: "easeOut" as const };
  const formTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.4, ease: [0.06, 1, 0.18, 1] as const };

  const submitted = status === "sent";
  const sending = status === "sending";

  return (
    <main className="bg-transparent overflow-x-clip min-h-[88vh] md:min-h-[90vh] flex flex-col pt-24">
      <section className="w-full pt-20 md:pt-28 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={headerTransition}
          className="max-w-4xl mx-auto px-6 text-center"
        >
          {/* Full dove + sunburst artwork — transparent PNG with the
              black field of the source already chroma-keyed out, so
              the dove floats over the painted cloud body instead of
              sitting inside a visible square. A soft amber radial
              glow underneath warms the surrounding clouds without
              fighting the painting. */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduce
                ? { duration: 0.01 }
                : { duration: 1.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] as const }
            }
            className="relative mx-auto mb-6 md:mb-8 w-[clamp(160px,22vw,220px)] aspect-square"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-10 rounded-full blur-3xl opacity-55"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 55%, rgba(216,178,90,0.55), rgba(216,178,90,0.12) 55%, transparent 75%)",
              }}
            />
            <Image
              src="/media/logo-dove.png"
              alt="All The Glory"
              fill
              priority
              sizes="(max-width: 768px) 180px, 220px"
              className="relative object-contain"
            />
          </motion.div>
          <div className="eyebrow mb-4">Contact</div>
          <h1 className="font-display text-4xl md:text-6xl font-normal text-white tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-sm md:text-base text-white/65 max-w-md mx-auto">
            For booking enquiries, press, prayer requests, or a quick hello.
          </p>
        </motion.div>
      </section>

      <section className="w-full py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={formTransition}
          className="max-w-xl mx-auto px-6 mb-12 md:mb-16"
        >
          {submitted ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-colour-fg mb-4">
                Thank you
              </h2>
              <p className="text-colour-fg/60">
                Your message has landed in our inbox. We&apos;ll get back to
                you as soon as we can.
              </p>
              <p className="text-colour-fg/40 mt-4 text-sm">
                If anything goes wrong, email{" "}
                <a
                  href={`mailto:${CONTACT_INBOX}`}
                  className="text-[var(--colour-amber)] underline"
                >
                  {CONTACT_INBOX}
                </a>{" "}
                directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  name="website"
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-base text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p
                    id="name-error"
                    role="alert"
                    aria-live="polite"
                    className="mt-1 text-sm text-red-400"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-base text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    aria-live="polite"
                    className="mt-1 text-sm text-red-400"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  required
                  rows={6}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={
                    errors.message ? "message-error" : undefined
                  }
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors resize-none"
                  placeholder="Your message..."
                />
                {errors.message && (
                  <p
                    id="message-error"
                    role="alert"
                    aria-live="polite"
                    className="mt-1 text-sm text-red-400"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-red-400"
                >
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-colour-accent text-colour-bg font-semibold text-sm uppercase tracking-widest hover:bg-colour-fg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </motion.div>
      </section>

      {/* ── STAY IN THE LOOP ───────────────────────────────────────
           Always visible, even after a successful send — the form is
           the primary CTA, but everyone visiting the contact page is
           a candidate for the newsletter + YouTube. We weave the
           inverted-glyph motif in so the section reads as a
           continuation of the album-side of the site, not a generic
           footer call-to-action. */}
      <section
        aria-labelledby="stay-in-loop-heading"
        className="w-full pb-20 md:pb-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: reduce ? 0.01 : 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="max-w-xl mx-auto px-6"
        >
          <div className="panel-scrim panel-flush-mobile p-7 md:p-9 text-center">
            <div className="eyebrow eyebrow-amber">Stay in the loop</div>
            <h2
              id="stay-in-loop-heading"
              className="font-display mt-3 text-2xl md:text-3xl font-normal text-white tracking-tight"
            >
              Walk this road with me
            </h2>
            <p
              aria-label="From Darkness To Light"
              className="subtitle-glyph mt-3 text-xs md:text-sm tracking-[0.18em] text-white/60"
            >
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </p>
            <p className="mt-4 text-sm md:text-base text-white/70 leading-relaxed max-w-md mx-auto">
              Be the first to hear when new songs, videos, and stories drop —
              no spam, just an honest update now and then.
            </p>

            <div className="mt-7">
              <NewsletterSignup />
            </div>

            {/* ─── YouTube spotlight + socials ─── */}
            <div className="mt-9 pt-7 border-t border-white/10">
              <p className="text-xs md:text-sm text-white/65 mb-4">
                Already on YouTube? Hit subscribe so new releases land in
                your feed.
              </p>
              {site.socials.youtube && (
                <a
                  href={site.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Subscribe on YouTube →
                </a>
              )}

              <div className="mt-7 text-[11px] uppercase tracking-[0.22em] text-white/45 mb-3">
                Or follow along here
              </div>
              <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.22em]">
                {site.socials.instagram && (
                  <li>
                    <a
                      href={site.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[var(--colour-amber)] transition-colors"
                    >
                      Instagram ↗
                    </a>
                  </li>
                )}
                {site.socials.spotify && (
                  <li>
                    <a
                      href={site.socials.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[var(--colour-amber)] transition-colors"
                    >
                      Spotify ↗
                    </a>
                  </li>
                )}
                {site.socials.facebook && (
                  <li>
                    <a
                      href={site.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[var(--colour-amber)] transition-colors"
                    >
                      Facebook ↗
                    </a>
                  </li>
                )}
                {site.socials.tiktok && (
                  <li>
                    <a
                      href={site.socials.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-[var(--colour-amber)] transition-colors"
                    >
                      TikTok ↗
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

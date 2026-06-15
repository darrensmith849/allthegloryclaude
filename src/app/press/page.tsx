"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { assets } from "@/content/assets";

// ── Single source of truth for the press kit copy + links ─────────
//   All copy is plain text with standard single hyphens (never em /
//   en dashes) so the page stays consistent with the rest of the site
//   per the artist's style rules.
const PRESS = {
  soundCloudPreview: "https://on.soundcloud.com/gJ7UvLyBtwFJyFuISG",
  websiteUrl: "https://www.alltheglory.co.za",
  contactEmail: "daniel@alltheglory.co.za",
  releaseDate: "17 July 2026",
  focusTrack: "John 19:30",
  location: "Harare, Zimbabwe / Southern Africa",
  genre: "Christian / Worship / Inspirational",
};

const TRACKS = [
  "John 19:30",
  "Matthew 14:31",
  "John 11:35",
  "Luke 15:20",
  "Proverbs 3:5",
  "John 3:16",
  "2 Corinthians 5:21",
];

const PRESS_ANGLES = [
  "Debut worship album from a Zimbabwean singer-songwriter.",
  "A testimony-driven project written from darkness into light.",
  "Scripture-rooted songs for broken hearts and weary souls.",
  "Free worship music created to encourage people searching for hope.",
  "A Southern African Christian worship release with a global message.",
];

// Reusable section wrapper - applies the consistent panel-scrim glass
// treatment used elsewhere on the site, with a soft fade-on-view so
// the page reads as one continuous editorial scroll rather than a
// stack of disconnected blocks.
function Section({
  eyebrow,
  title,
  children,
  id,
  reduce,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  id?: string;
  reduce: boolean;
}) {
  return (
    <motion.section
      id={id}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduce ? 0.01 : 1.1,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className="panel-scrim panel-flush-mobile p-6 md:p-10"
    >
      {eyebrow && (
        <div className="eyebrow eyebrow-amber">{eyebrow}</div>
      )}
      {title && (
        <h2 className="font-display mt-2 text-2xl md:text-3xl font-semibold text-white">
          {title}
        </h2>
      )}
      <div className={eyebrow || title ? "mt-5" : ""}>{children}</div>
    </motion.section>
  );
}

export default function PressKitPage() {
  const reduce = !!useReducedMotion();

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-4xl px-6 pt-28 md:pt-36 pb-24 md:pb-32 flex flex-col gap-8 md:gap-10">

        {/* ── 1. Hero ────────────────────────────────────────── */}
        <motion.section
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduce ? 0.01 : 1.2,
            ease: [0.16, 1, 0.3, 1] as const,
          }}
          className="text-center pt-2"
        >
          <div className="eyebrow eyebrow-amber">Press Kit</div>
          <h1 className="font-display mt-3 text-3xl md:text-5xl font-semibold text-white leading-tight max-w-3xl mx-auto">
            All The Glory - From Darkness To Light
          </h1>
          <p className="font-display mt-5 text-base md:text-xl italic text-white/85 leading-relaxed max-w-2xl mx-auto">
            Honest worship for broken hearts, weary souls, and anyone
            longing for hope.
          </p>
          <p className="mt-3 text-sm md:text-base text-white/65 leading-relaxed max-w-2xl mx-auto">
            Songs of surrender, healing, and hope - written to point
            hearts back to Jesus.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={PRESS.soundCloudPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Listen Privately →
            </a>
            <a
              href={PRESS.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Visit Website
            </a>
            <a href="#contact" className="btn">
              Contact
            </a>
          </div>
        </motion.section>

        {/* ── 2. Album Overview ──────────────────────────────── */}
        <Section eyebrow="Section 1" title="Album Overview" reduce={reduce}>
          <div className="space-y-4 text-[15px] md:text-base text-white/80 leading-relaxed">
            <p>
              From Darkness To Light is the debut worship album from All
              The Glory, the worship project of Daniel Jenkins, a
              singer-songwriter from Harare, Zimbabwe.
            </p>
            <p>
              The album was born from testimony - a journey through
              darkness, addiction, shame, and the ache of searching for
              life in things that could never satisfy.
            </p>
            <p>
              These songs point to the freedom, healing, and hope found
              in Jesus Christ. They are Scripture-rooted, honest, and
              written for broken hearts, weary souls, and anyone longing
              to be drawn out of darkness and into light.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <DetailRow label="Artist" value="All The Glory" />
            <DetailRow label="Album" value="From Darkness To Light" />
            <DetailRow label="Release Date" value={PRESS.releaseDate} />
            <DetailRow label="Genre" value={PRESS.genre} />
            <DetailRow label="Location" value={PRESS.location} />
            <DetailRow label="Focus Track" value={PRESS.focusTrack} />
            <DetailRow
              label="Website"
              value={
                <a
                  href={PRESS.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--colour-amber-soft)] hover:text-[var(--colour-amber)] transition-colors underline decoration-[var(--colour-amber)]/30 underline-offset-4"
                >
                  www.alltheglory.co.za
                </a>
              }
            />
          </div>
        </Section>

        {/* ── 3. Private Listening Preview ───────────────────── */}
        <Section
          eyebrow="Section 2"
          title="Private Listening Preview"
          reduce={reduce}
        >
          <p className="text-[15px] md:text-base text-white/80 leading-relaxed">
            A private preview of {PRESS.focusTrack} is available for
            press, radio, playlist, church, and ministry consideration.
          </p>

          {/* Styled preview card - SoundCloud's short link doesn't
              embed reliably in their iframe player, so we render a
              clean card with the focus-track artwork + a single CTA
              that opens the preview in a new tab. Same vibe as the
              streaming row on the album page, scaled up. */}
          <div className="mt-6 rounded-2xl border border-white/10 panel-scrim p-5 md:p-6 flex flex-col md:flex-row gap-5 md:gap-6 items-center md:items-stretch">
            <div className="relative w-full md:w-44 aspect-square shrink-0 rounded-xl overflow-hidden border border-white/10">
              <Image
                src={assets.albumArt}
                alt="From Darkness To Light album artwork"
                fill
                sizes="(max-width: 768px) 80vw, 176px"
                className="object-cover"
                quality={90}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center text-center md:text-left">
              <div className="eyebrow">Track 01 · Focus Track</div>
              <div className="font-display mt-1 text-xl md:text-2xl text-white">
                {PRESS.focusTrack}
              </div>
              <p className="text-[13px] md:text-sm text-white/65 italic mt-2 leading-relaxed">
                &ldquo;It is finished.&rdquo;
              </p>
              <div className="mt-4 flex justify-center md:justify-start">
                <a
                  href={PRESS.soundCloudPreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Listen To {PRESS.focusTrack} →
                </a>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 4. Story ───────────────────────────────────────── */}
        <Section
          eyebrow="Section 3"
          title="The Story Behind The Songs"
          reduce={reduce}
        >
          <div className="space-y-4 text-[15px] md:text-base text-white/80 leading-relaxed">
            <p>
              For more than two decades, Daniel walked through seasons of
              deep darkness, addiction, and inner bondage. Nothing in the
              world could satisfy the ache in his soul - until he began
              to see that Jesus had never left him in the darkness. He
              was there all along, calling Daniel to fix his eyes on Him.
            </p>
            <p>
              These songs are not just music. They are testimony. They
              are worship. They are a declaration that Jesus still
              brings the lost home, restores what is broken, and leads
              us from darkness into light.
            </p>
          </div>
        </Section>

        {/* ── 5. Artist Bio ──────────────────────────────────── */}
        <Section eyebrow="Section 4" title="About All The Glory" reduce={reduce}>
          <div className="eyebrow eyebrow-amber">Short Bio</div>
          <p className="mt-2 text-[15px] md:text-base text-white/80 leading-relaxed">
            All The Glory is the worship project of Daniel Jenkins, a
            singer-songwriter from Harare, Zimbabwe. His debut album,
            From Darkness To Light, is a Scripture-rooted worship
            project shaped by personal testimony, surrender, and the
            freedom found in Jesus Christ.
          </p>

          <div className="dash-divider my-7" />

          <div className="eyebrow eyebrow-amber">Medium Bio</div>
          <div className="mt-2 space-y-4 text-[15px] md:text-base text-white/80 leading-relaxed">
            <p>
              All The Glory is the worship project of Daniel Jenkins, a
              singer-songwriter from Harare, Zimbabwe.
            </p>
            <p>
              Born out of years of personal struggle, From Darkness To
              Light is a worship album shaped by Scripture, testimony,
              and the restoring power of Jesus. The songs speak honestly
              about pain, identity, surrender, and hope - pointing
              listeners to the freedom and healing found in Christ.
            </p>
          </div>
        </Section>

        {/* ── 6. Track List ──────────────────────────────────── */}
        <Section eyebrow="Section 5" title="Track List" reduce={reduce}>
          <ol className="space-y-2 text-[15px] md:text-base text-white/85">
            {TRACKS.map((track, i) => (
              <li
                key={track}
                className="flex items-baseline gap-3 py-2 border-b border-white/5 last:border-b-0"
              >
                <span className="font-display text-[var(--colour-amber-soft)] tabular-nums w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{track}</span>
                {i === 0 && (
                  <span className="ml-auto text-[10.5px] tracking-[0.18em] uppercase text-[var(--colour-amber-soft)]">
                    Focus Track
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[13px] text-white/55 italic">
            Each song is built around Scripture, testimony, and worship.
          </p>
        </Section>

        {/* ── 7. Press Angles ────────────────────────────────── */}
        <Section eyebrow="Section 6" title="Press Angles" reduce={reduce}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            {PRESS_ANGLES.map((angle) => (
              <div
                key={angle}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-[14px] md:text-[15px] text-white/85 leading-relaxed"
              >
                {angle}
              </div>
            ))}
          </div>
        </Section>

        {/* ── 8. What Daniel Is Looking For ──────────────────── */}
        <Section
          eyebrow="Section 7"
          title="For Press, Radio, Playlists, Churches, And Ministries"
          reduce={reduce}
        >
          <div className="space-y-4 text-[15px] md:text-base text-white/80 leading-relaxed">
            <p>
              Daniel is looking to share this album with Christian blogs,
              radio stations, worship leaders, churches, playlist
              curators, pastors, recovery ministries, and anyone who may
              be encouraged by the message.
            </p>
            <p>
              The heart behind the release is not hype. It is ministry -
              that God would be glorified, that Jesus would be lifted
              high, and that listeners would be reminded they are not
              alone in the darkness.
            </p>
          </div>
        </Section>

        {/* ── 9. Press Assets ────────────────────────────────── */}
        <Section eyebrow="Section 8" title="Press Assets" reduce={reduce}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AssetCard
              label="Album Artwork"
              hint="JPEG · download"
              href={assets.albumArt}
              download="all-the-glory-from-darkness-to-light.jpg"
              external={false}
            />
            <AssetCard
              label="Lyrics (Focus Track)"
              hint="John 19:30 · PDF"
              href="/lyrics/john-19-vs-30/lyric-cards.pdf"
              download="john-19-30-lyrics.pdf"
              external={false}
            />
            <AssetCard
              label="Website"
              hint="alltheglory.co.za"
              href={PRESS.websiteUrl}
              external
            />
            <AssetCard
              label="Private Listening Link"
              hint="SoundCloud preview"
              href={PRESS.soundCloudPreview}
              external
            />
            <AssetCard
              label="Artist Image"
              hint="Available on request"
              placeholder
            />
            <AssetCard label="Contact" hint="Scroll to email" href="#contact" />
          </div>
        </Section>

        {/* ── 10. Contact ────────────────────────────────────── */}
        <Section
          id="contact"
          eyebrow="Section 9"
          title="Contact"
          reduce={reduce}
        >
          <p className="text-[15px] md:text-base text-white/80 leading-relaxed">
            For press, radio, playlist, church, worship, or ministry
            enquiries, please contact Daniel Jenkins.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 text-sm">
            <ContactRow
              label="Email"
              value={
                <a
                  href={`mailto:${PRESS.contactEmail}`}
                  className="text-[var(--colour-amber-soft)] hover:text-[var(--colour-amber)] transition-colors underline decoration-[var(--colour-amber)]/30 underline-offset-4 break-all"
                >
                  {PRESS.contactEmail}
                </a>
              }
            />
            <ContactRow
              label="Website"
              value={
                <a
                  href={PRESS.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--colour-amber-soft)] hover:text-[var(--colour-amber)] transition-colors underline decoration-[var(--colour-amber)]/30 underline-offset-4"
                >
                  www.alltheglory.co.za
                </a>
              }
            />
            <ContactRow
              label="Private Preview"
              value={
                <a
                  href={PRESS.soundCloudPreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--colour-amber-soft)] hover:text-[var(--colour-amber)] transition-colors underline decoration-[var(--colour-amber)]/30 underline-offset-4 break-all"
                >
                  on.soundcloud.com / preview link
                </a>
              }
            />
          </div>
        </Section>

        {/* Soft closing benediction line so the page doesn't end on a
            naked contact form. */}
        <motion.p
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduce ? 0.01 : 1.2 }}
          className="font-display italic text-center text-sm md:text-base text-white/55 mt-4"
        >
          To God be the glory.
        </motion.p>
      </div>
    </main>
  );
}

// ── Small reusable sub-components ─────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 py-1 border-b border-white/5">
      <span className="eyebrow text-[10.5px] tracking-[0.18em] text-[var(--colour-ink-quiet)] shrink-0 w-28">
        {label}
      </span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}

function ContactRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-white/5 last:border-b-0">
      <span className="eyebrow text-[10.5px] tracking-[0.18em] text-[var(--colour-ink-quiet)] shrink-0 w-32">
        {label}
      </span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}

function AssetCard({
  label,
  hint,
  href,
  download,
  external,
  placeholder,
}: {
  label: string;
  hint: string;
  href?: string;
  download?: string;
  external?: boolean;
  placeholder?: boolean;
}) {
  // Placeholder card - used when an asset isn't ready yet (e.g. artist
  // image). Renders as a non-interactive panel with "Available on
  // request" rather than a broken download link.
  if (placeholder) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 flex flex-col gap-1">
        <div className="text-[14px] text-white/75 font-semibold">{label}</div>
        <div className="text-[12px] text-[var(--colour-ink-quiet)]">
          {hint}
        </div>
      </div>
    );
  }

  // External links open in a new tab; same-origin asset links (image,
  // PDF) use the `download` attribute so the browser saves rather than
  // navigating in-place. Hash links (e.g. #contact) just scroll.
  const isHash = href?.startsWith("#");
  const linkProps: Record<string, string> = {};
  if (external) {
    linkProps.target = "_blank";
    linkProps.rel = "noopener noreferrer";
  }
  if (download) linkProps.download = download;

  return (
    <a
      href={href}
      {...linkProps}
      className="rounded-xl border border-white/10 bg-white/[0.025] p-4 flex items-center justify-between gap-3 hover:border-[var(--colour-amber)]/35 hover:bg-white/[0.04] transition-colors group"
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[14px] text-white/85 font-semibold truncate">
          {label}
        </div>
        <div className="text-[12px] text-[var(--colour-ink-quiet)] truncate">
          {hint}
        </div>
      </div>
      <span
        className="text-[var(--colour-amber-soft)] group-hover:text-[var(--colour-amber)] transition-colors shrink-0"
        aria-hidden="true"
      >
        {external ? "↗" : isHash ? "→" : "↓"}
      </span>
    </a>
  );
}

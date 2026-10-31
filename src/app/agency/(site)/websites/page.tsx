import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Artwork } from "@/platform/components/ui/Artwork";
import { ArrowLink, ButtonLink, Checklist, Eyebrow, Notice, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Websites and digital launches",
  description: "Premium artist websites, electronic press kits, release landing pages, branding and first-party analytics.",
};

const offerings = [
  { title: "Artist website", body: "A premium, fast, accessible home for your music, story, shows and contact — built on the same platform as your workspace.", tone: "gold" as const, variant: "orbit" as const },
  { title: "Electronic press kit", body: "Biography, approved photography, verified credits, press quotes and technical rider in a format promoters actually use.", tone: "sand" as const, variant: "venn" as const },
  { title: "Release landing page", body: "One page per release: listen links, video, credits, pre-save and campaign tracking that you own.", tone: "gold" as const, variant: "horizon" as const },
];

export default function WebsitesPage() {
  return (
    <>
      <PageHero
        eyebrow="Websites and digital launches"
        title={
          <>
            A home online as considered <em>as the music.</em>
          </>
        }
        lede="Artist websites, press kits and release pages with first-party analytics, hosting and support — designed to the same editorial standard as the records."
        aside={
          <div className="cluster">
            <ButtonLink href="/contact?service=artist-website" icon="arrow-right">
              Brief a website
            </ButtonLink>
            <ArrowLink href="/demo/artist/msasa-room/insights">See demo analytics</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="offer-h">
        <div className="container">
          <h2 id="offer-h" className="visually-hidden">
            What we build
          </h2>
          <div className="grid grid--3">
            {offerings.map((o) => (
              <article className="card" key={o.title} style={{ padding: 0, overflow: "hidden" }}>
                <Artwork seed={`web-${o.title}`} variant={o.variant} tone={o.tone} className="artwork--wide" />
                <div className="stack" style={{ padding: "1.5rem", ["--stack-gap" as string]: "0.75rem" }}>
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="included-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">Included</Eyebrow>
            <h2 id="included-h" style={{ fontSize: "var(--step-4)" }}>
              Built to launch, then to last.
            </h2>
          </div>
          <div className="grid grid--2">
            <article className="card">
              <h3>Branding and assets</h3>
              <Checklist items={["Typography and colour system", "Release artwork adaptations", "Social and streaming assets"]} />
            </article>
            <article className="card">
              <h3>Analytics you own</h3>
              <Checklist items={["Cookie-free, first-party measurement", "Campaign links and sources", "Plays, profile views and enquiries"]} />
            </article>
            <article className="card">
              <h3>Performance and access</h3>
              <Checklist items={["Fast on mobile networks", "Accessible to screen readers and keyboards", "Optimised images and lazy media"]} />
            </article>
            <article className="card">
              <h3>Hosting and support</h3>
              <Checklist items={["Managed hosting and security updates", "Content updates on request", "Release-week support"]} />
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="incentive-h">
        <div className="container container--narrow">
          <SectionHead index="03" eyebrow="Complimentary website incentive" title={<span id="incentive-h">Make a record with us, launch it with us.</span>}>
            We intend to include digital-launch services with qualifying production work.
          </SectionHead>
          <Notice kind="proposed" title="Under validation — not yet an offer.">
            Examples being tested: qualifying production spend may include a starter website; higher-value packages may include a press kit or release
            campaign. Thresholds and terms will be published only after approval, and nothing on this page is a binding offer.
          </Notice>
        </div>
      </section>

      <CtaBand
        title="Launching something soon?"
        body="Tell us the release date and what you already have. We will propose a launch plan that fits."
        primary={{ href: "/contact?service=release-campaign", label: "Brief a launch" }}
      />
    </>
  );
}

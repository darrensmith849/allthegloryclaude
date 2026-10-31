import type { Metadata } from "next";
import { CtaBand, DemoPreview, PageHero } from "@/platform/components/site/blocks";
import { Icon, type IconName } from "@/platform/components/ui/Icon";
import { ArrowLink, ButtonLink, Checklist, Eyebrow, Notice, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Artist Business Suite",
  description: "A branded workspace for every creative: profile, opportunities, contracts, split sheets, invoices, statements, analytics and the Artist Business Passport.",
};

const tools: { icon: IconName; title: string; body: string }[] = [
  { icon: "people", title: "Profile and portfolio", body: "A verified professional profile with media, credits verified at source, languages and working modes." },
  { icon: "compass", title: "Opportunities and bookings", body: "Matched opportunities, applications, bookings and availability in one calendar." },
  { icon: "document", title: "Contracts and split sheets", body: "Every agreement and split sheet you have signed, with versions and signatures." },
  { icon: "wallet", title: "Earnings and statements", body: "Payout statements that show client receipts, approved costs, commission and your share." },
  { icon: "inbox", title: "Invoices and payment requests", body: "Prepare payment requests and draft invoices; official client invoices are issued by the contracting entity." },
  { icon: "chart", title: "Website and campaign analytics", body: "First-party analytics for your website, press kit and release pages — no third-party trackers." },
  { icon: "message", title: "Enquiries and contacts", body: "A simple CRM: who contacted you, about what, and what happened next." },
  { icon: "spark", title: "Training and support", body: "Business-readiness training, funding notices and referrals to professional support." },
];

const passport = [
  "Verified professional profile",
  "Digital portfolio and press kit",
  "Contracts, rights and earnings history",
  "Availability and skills directory",
  "Training and funding-readiness records",
  "Membership and support referrals",
  "Opportunity matching",
  "Analytics and impact reporting",
];

export default function ArtistSuitePage() {
  return (
    <>
      <PageHero
        eyebrow="Artist Business Suite"
        title={
          <>
            The back office <em>every artist deserves.</em>
          </>
        }
        lede="Every creative on the network gets a branded workspace — generated from one shared, multi-tenant platform — that holds the records which make an artist bookable, fundable and protected."
        aside={
          <div className="cluster">
            <ButtonLink href="/demo/artist/msasa-room/overview" icon="arrow-right">
              Open the demo workspace
            </ButtonLink>
            <ArrowLink href="/apply">Apply to the roster</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="tools-h">
        <div className="container">
          <SectionHead index="01" eyebrow="In the workspace" title={<span id="tools-h">Eight tools, one record.</span>} />
          <div className="grid grid--4">
            {tools.map((t) => (
              <article className="card" key={t.title}>
                <span className="icon-dot">
                  <Icon name={t.icon} />
                </span>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="passport-h">
        <div className="container split">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.5rem" }}>
            <Eyebrow index="02">Artist Business Passport</Eyebrow>
            <h2 id="passport-h" style={{ fontSize: "var(--step-4)" }}>
              One verified record that travels with the artist.
            </h2>
            <p className="lede">
              The Passport brings together the evidence that labels, funders, promoters and support organisations ask for — kept current by the work
              itself, and shared only with the artist’s consent.
            </p>
            <Checklist items={passport} />
            <Notice kind="proposed" title="Proposed joint programme.">
              The Passport is designed to be offered with arts-support partners. No partner is confirmed yet.
            </Notice>
          </div>
          <DemoPreview />
        </div>
      </section>

      <section className="section" aria-labelledby="principles-h">
        <div className="container">
          <SectionHead index="03" eyebrow="Principles" title={<span id="principles-h">Your data, your consent.</span>} />
          <div className="grid grid--3">
            <article className="card">
              <h3>You control sharing</h3>
              <p>Partners see only what you consent to share, and you can withdraw that consent at any time.</p>
            </article>
            <article className="card">
              <h3>Sensitive matters stay private</h3>
              <p>Wellness, legal and financial support details never appear in company dashboards — only an authorised status.</p>
            </article>
            <article className="card">
              <h3>Your brand, our platform</h3>
              <p>Workspaces carry your colours and identity without a separate codebase, so every improvement reaches every artist.</p>
            </article>
          </div>
        </div>
      </section>

      <CtaBand
        title="Build your career on the record."
        body="Join the roster to receive a workspace when the platform opens."
        primary={{ href: "/apply", label: "Apply to the roster" }}
        secondary={{ href: "/demo/artist/msasa-room/overview", label: "Explore the demo" }}
      />
    </>
  );
}

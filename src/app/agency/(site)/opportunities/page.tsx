import type { Metadata } from "next";
import { sampleOpportunities } from "@/platform/demo-data/opportunities";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Badge, Checklist, Eyebrow, Notice, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Opportunity network",
  description: "Sessions, productions, sync briefs, live work and programmes matched to verified creatives.",
};

export default function OpportunitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Opportunity network"
        title={
          <>
            Work that finds <em>the right people.</em>
          </>
        }
        lede="Opportunities come from client briefs, partners and programmes. They are matched to verified profiles — so creatives see work they can actually do, and clients see people who can deliver."
        aside={
          <Notice kind="sample" title="Example listings.">
            The opportunities below are fictional and illustrate the format. Live opportunities are shared with verified creatives in their workspace.
          </Notice>
        }
      />

      <section className="section section--rule" aria-labelledby="list-h">
        <div className="container">
          <h2 id="list-h" className="visually-hidden">
            Example opportunities
          </h2>
          <div style={{ borderTop: "1px solid var(--line-strong)" }}>
            {sampleOpportunities.map((o) => (
              <article className="opportunity" key={o.id}>
                <div className="stack" style={{ ["--stack-gap" as string]: "0.5rem" }}>
                  <div className="cluster" style={{ ["--cluster-gap" as string]: "0.5rem" }}>
                    <Badge kind="sample">Example listing</Badge>
                    <Badge kind="plain">{o.kind}</Badge>
                  </div>
                  <h3>{o.title}</h3>
                  <p className="muted">{o.summary}</p>
                </div>
                <dl className="opportunity__meta" style={{ display: "grid", gap: "0.3rem" }}>
                  <div>
                    <dt className="visually-hidden">Roles</dt>
                    <dd>{o.roles.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="visually-hidden">Location</dt>
                    <dd>{o.location}</dd>
                  </div>
                  <div>
                    <dt className="visually-hidden">Timing</dt>
                    <dd>{o.timing}</dd>
                  </div>
                </dl>
                <span className="pill">Fictional</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="how-h">
        <div className="container two-col two-col--even">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">How matching works</Eyebrow>
            <h2 id="how-h" style={{ fontSize: "var(--step-4)" }}>
              Matched on skills, not on who you know.
            </h2>
            <p className="lede">Each opportunity carries roles, styles, languages, location and delivery mode. Verified profiles are matched against them, and the roster team reviews every shortlist.</p>
          </div>
          <div className="grid">
            <article className="card">
              <h3>For creatives</h3>
              <Checklist items={["See opportunities that match your verified profile", "Apply with your portfolio in one step", "Track applications and outcomes in your workspace"]} />
            </article>
            <article className="card">
              <h3>For clients and partners</h3>
              <Checklist items={["Post a brief or programme once", "Receive a reviewed shortlist", "Contract and pay through one company"]} />
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="types-h">
        <div className="container">
          <SectionHead index="03" eyebrow="Types of opportunity" title={<span id="types-h">From a single session to a season of work.</span>} />
          <div className="grid grid--3">
            {[
              ["Sessions", "Remote or in-studio parts for records in progress."],
              ["Productions", "Producers and engineers for singles, EPs and albums."],
              ["Sync briefs", "Bespoke music for brands, film, TV and games."],
              ["Live work", "Musicians, vocalists and musical directors for shows."],
              ["Collaborations", "Writing camps and cross-border co-writes."],
              ["Programmes", "Training, funding and development opportunities."],
            ].map(([t, b]) => (
              <article className="card" key={t}>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Get matched when we open."
        body="Apply to the roster. Verified creatives receive matched opportunities in their workspace."
        primary={{ href: "/apply", label: "Apply to the roster" }}
        secondary={{ href: "/contact", label: "Post a brief" }}
      />
    </>
  );
}

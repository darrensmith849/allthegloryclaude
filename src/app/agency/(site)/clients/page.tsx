import type { Metadata } from "next";
import { projectSteps } from "@/platform/content/offer";
import { CtaBand, Faq, PageHero } from "@/platform/components/site/blocks";
import { ArrowLink, ButtonLink, Checklist, Eyebrow, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "For clients",
  description: "Labels, artists, agencies, brands, film, TV and games: hire African creatives through one accountable company.",
};

const audiences = [
  ["Independent artists", "Producers, players and engineers for your next single, EP or album."],
  ["Labels and management", "A dependable bench of creatives and a production team that hits release dates."],
  ["Agencies and brands", "Bespoke music and sonic identity with licensing handled properly."],
  ["Film, TV and games", "Composers, score players and music for picture, delivered to spec."],
  ["Churches and organisations", "Worship recordings, events and musical direction."],
  ["International collaborators", "Authentic African musicianship for records made anywhere."],
];

export default function ClientsPage() {
  return (
    <>
      <PageHero
        eyebrow="For clients"
        title={
          <>
            Hire African talent <em>with one contract.</em>
          </>
        }
        lede="Brief once. We match the right creatives, scope the work, quote it fixed, manage delivery and handle the contracts, splits and payments."
        aside={
          <div className="cluster">
            <ButtonLink href="/contact" icon="arrow-right">
              Start a project brief
            </ButtonLink>
            <ArrowLink href="/demo/client/overview">See the client portal</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="aud-h">
        <div className="container">
          <SectionHead index="01" eyebrow="Who we work with" title={<span id="aud-h">From a single session to a full score.</span>} />
          <div className="grid grid--3">
            {audiences.map(([t, b]) => (
              <article className="card" key={t}>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="get-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="02">What you get</Eyebrow>
            <h2 id="get-h" style={{ fontSize: "var(--step-4)" }}>
              A partner, not a marketplace.
            </h2>
            <p className="lede">Your client portal holds the brief, quote, agreements, milestones, drafts, approvals, invoices and final files.</p>
          </div>
          <div className="stack" style={{ ["--stack-gap" as string]: "2rem" }}>
            <ol className="steps" role="list">
              {projectSteps.map((s, i) => (
                <li className="step" key={s.title}>
                  <span className="step__num">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
            <Checklist
              items={[
                "Single point of contact and one agreement",
                "Fixed quote after scoping; changes only by written change request",
                "Deposit and milestone payments to the company",
                "Quality assurance before anything reaches you",
                "Licensing, split sheets and credits on the record",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-h">
        <div className="container container--narrow">
          <SectionHead eyebrow="Client questions" title={<span id="faq-h">Before you brief us</span>} />
          <Faq
            items={[
              { q: "What should a good brief include?", a: "What you are making, who it is for, references, deadline, budget range and the rights you need. The brief form walks you through it." },
              { q: "How quickly will I hear back?", a: "A project lead reviews every brief. Response targets will be published at launch; until then we reply as soon as the brief is reviewed." },
              { q: "Can I request a specific creative?", a: "Yes. Use “Request for a project” on any profile, or name them in the brief. We confirm availability and terms before quoting." },
              { q: "What does the deposit cover?", a: "The deposit secures the team and schedule. Milestone payments follow approvals, as set out in your agreement." },
            ]}
          />
        </div>
      </section>

      <CtaBand title="Start with the brief." body="It takes about five minutes, and you can tick “not sure” wherever you are." primary={{ href: "/contact", label: "Start a project brief" }} />
    </>
  );
}

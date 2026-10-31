import type { Metadata } from "next";
import { brand } from "@/platform/config/brand";
import { businesses, principles } from "@/platform/content/offer";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Artwork } from "@/platform/components/ui/Artwork";
import { Eyebrow, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "About and mission",
  description: "A Zimbabwean-founded, Africa-first music company that makes African talent easier to discover, contract, manage, protect, pay and grow.",
};

const roadmap = [
  ["Phase 1", "Premium website and platform demonstration", "Now"],
  ["Phase 2", "Operational platform: accounts, CRM, projects, contracts, invoices", "Next"],
  ["Phase 3", "Commercial automation: payments, e-signatures, payouts, partner workflows", "Later"],
  ["Phase 4", "Continental platform: countries, currencies, verified organisations", "Later"],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About and mission"
        title={
          <>
            Founded in Zimbabwe. <em>Built for the continent.</em>
          </>
        }
        lede={`${brand.name} exists to make African talent easier to discover, contract, manage, protect, pay and grow — and to widen access rather than hoard relationships.`}
      />

      <section className="section section--rule" aria-labelledby="vision-h">
        <div className="container split">
          <div className="split__media">
            <Artwork seed="about-vision" variant="rings" tone="gold" />
          </div>
          <div className="stack" style={{ ["--stack-gap" as string]: "1.5rem" }}>
            <Eyebrow index="01">Vision</Eyebrow>
            <h2 id="vision-h" style={{ fontSize: "var(--step-4)" }}>
              A global music company with African roots and African ownership of the work.
            </h2>
            <p className="lede">
              Africa’s producers, engineers, writers, musicians and vocalists are among the most sought-after in the world. Too often, the
              infrastructure around them — contracts, rights, payments, visibility — has not kept up.
            </p>
            <p className="muted">
              We are building the company and the platform together: a production house and agency that does the work, and the technology that makes
              that work fair, transparent and repeatable for every creative involved.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="principles-h">
        <div className="container">
          <SectionHead index="02" eyebrow="Principles" title={<span id="principles-h">How we work.</span>} />
          <div className="grid grid--4">
            {principles.map((p) => (
              <article className="card" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="what-h">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <Eyebrow index="03">What we are building</Eyebrow>
            <h2 id="what-h" style={{ fontSize: "var(--step-4)" }}>
              Five businesses on one platform
            </h2>
          </div>
          <ol className="flow" role="list">
            {businesses.map((b) => (
              <li key={b.key}>
                <strong>{b.title}</strong>
                <span>{b.summary}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="roadmap-h">
        <div className="container">
          <SectionHead index="04" eyebrow="Roadmap" title={<span id="roadmap-h">Where we are, and what comes next.</span>} />
          <div className="steps">
            {roadmap.map(([phase, title, when]) => (
              <article className="step" key={phase}>
                <span className="eyebrow">
                  <span className="eyebrow__index">{phase}</span> · {when}
                </span>
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="honest-h">
        <div className="container container--narrow stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
          <Eyebrow index="05">A note on honesty</Eyebrow>
          <h2 id="honest-h" style={{ fontSize: "var(--step-3)" }}>
            We will only ever publish what is true.
          </h2>
          <p className="lede">
            The founder’s relationships across Zimbabwean and international music are a private network. Nobody is presented as rostered, represented,
            endorsed or partnered until they have agreed to it in writing. Until then, profiles and listings on this site are clearly marked samples.
          </p>
        </div>
      </section>

      <CtaBand title="Work with us." body="Whether you are hiring or creating, start with a conversation." primary={{ href: "/contact", label: "Start a project brief" }} secondary={{ href: "/apply", label: "Apply as a creative" }} />
    </>
  );
}

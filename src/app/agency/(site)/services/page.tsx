import type { Metadata } from "next";
import { businesses, packages } from "@/platform/content/offer";
import { CtaBand, PageHero } from "@/platform/components/site/blocks";
import { Icon } from "@/platform/components/ui/Icon";
import { ArrowLink, ButtonLink, Checklist, Notice, SectionHead } from "@/platform/components/ui/primitives";

export const metadata: Metadata = {
  title: "Services and packages",
  description: "Production, session musicians, managed projects, artist websites and business infrastructure — scoped per brief with a fixed quote.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services and packages"
        title={
          <>
            Everything a record, a release <em>and a career</em> needs.
          </>
        }
        lede="Five connected services, delivered by one accountable team. Every engagement starts with a brief and becomes a written scope with a fixed quote."
        aside={
          <div className="cluster">
            <ButtonLink href="/contact" icon="arrow-right">
              Start a project brief
            </ButtonLink>
            <ArrowLink href="/how-it-works">How projects work</ArrowLink>
          </div>
        }
      />

      <section className="section section--rule" aria-labelledby="services-h">
        <div className="container">
          <h2 id="services-h" className="visually-hidden">
            Services
          </h2>
          <div className="ledger">
            {businesses.map((b) => (
              <article className="ledger__item" key={b.key} id={b.key}>
                <span className="ledger__index">{b.index}</span>
                <div className="stack" style={{ ["--stack-gap" as string]: "1rem" }}>
                  <span className="icon-dot">
                    <Icon name={b.icon} />
                  </span>
                  <h3 className="ledger__title">{b.title}</h3>
                </div>
                <div className="ledger__body">
                  <p>{b.summary}</p>
                  <Checklist items={b.items} />
                  <ArrowLink href={b.href}>{b.cta}</ArrowLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="packages-h">
        <div className="container">
          <SectionHead index="02" eyebrow="Packages" title={<span id="packages-h">Common shapes of work.</span>} split>
            Packages describe what is included, not what it costs. Each one is scoped to your brief and confirmed in writing before work starts.
          </SectionHead>
          <div className="grid grid--3">
            {packages.map((p) => (
              <article className="card" key={p.name}>
                <h3>{p.name}</h3>
                <p className="muted">{p.for}</p>
                <Checklist items={p.includes} />
                <div className="card__foot">
                  <p style={{ fontSize: "var(--step--1)", fontWeight: 600, color: "var(--ink)" }}>Fixed quote after scoping</p>
                </div>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "2rem", maxWidth: 760 }}>
            <Notice kind="proposed" title="Pricing.">
              Rate cards and package prices are not published yet. You receive a written, fixed quote once your brief is scoped, and it changes only
              through an agreed change request.
            </Notice>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="standards-h">
        <div className="container two-col">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
            <SectionHead index="03" eyebrow="Standards" title={<span id="standards-h">What every engagement includes.</span>} />
          </div>
          <div className="grid grid--2">
            {[
              { t: "Written scope", b: "Deliverables, formats, revision rounds and milestones agreed in writing." },
              { t: "Rights on the record", b: "Split sheets and licence terms signed before release, never after." },
              { t: "Quality assurance", b: "Every delivery is checked against the brief before it reaches you." },
              { t: "Remote-first delivery", b: "Session files, stems and masters exchanged securely, wherever you are." },
            ].map((x) => (
              <article className="card" key={x.t}>
                <h3>{x.t}</h3>
                <p>{x.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Tell us what you are making."
        body="Choose services in the brief or tick “not sure” — scoping is part of the job."
        primary={{ href: "/contact", label: "Start a project brief" }}
        secondary={{ href: "/roster", label: "Browse the roster" }}
      />
    </>
  );
}

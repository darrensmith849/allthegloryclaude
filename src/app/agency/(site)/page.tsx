import type { CSSProperties } from "react";
import Link from "@/platform/components/ui/Link";
import { brand } from "@/platform/config/brand";
import { businesses, projectSteps } from "@/platform/content/offer";
import { sampleOpportunities } from "@/platform/demo-data/opportunities";
import { sampleRoster } from "@/platform/demo-data/roster";
import { TalentCard } from "@/platform/components/roster/TalentCard";
import { CtaBand, DemoPreview } from "@/platform/components/site/blocks";
import { BigSentence, Orbit, Venn, WordReveal } from "@/platform/components/site/scenes";
import { ArrowLink, Badge, ButtonLink, Checklist, Notice } from "@/platform/components/ui/primitives";

const d = (n: number) => ({ "--d": n }) as CSSProperties;

function HeroField() {
  // Thin orbits behind the headline, in place of a photo wall until approved
  // imagery exists. Static circles are SVG; the moving ring and dot are plain
  // elements so the browser animates them on the compositor without repainting.
  return (
    <div className="hero__field" aria-hidden="true">
      <div className="hero__stage">
        <svg viewBox="0 0 1200 1200">
          <circle cx="600" cy="600" r="560" />
          <circle cx="600" cy="600" r="440" />
          <circle cx="600" cy="600" r="250" />
          <circle cx="860" cy="600" r="250" />
        </svg>
        <span className="hero__ring" />
        <span className="hero__orbit" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <HeroField />
        <div className="hero__glow" />
        <div className="container hero__grid">
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line">
              <span>Africa’s sound,</span>
            </span>
            <span className="hero__line hero__line--1">
              <span>connected to</span>
            </span>
            <span className="hero__line hero__line--2">
              <span>the world.</span>
            </span>
          </h1>
          <div className="hero__side">
            <p>
              {brand.name} connects African producers, engineers, writers, musicians and vocalists with paid work, professional infrastructure and
              international collaborators.
            </p>
            <div className="cluster">
              <ButtonLink href="/contact">Start a project brief</ButtonLink>
              <ButtonLink href="/roster" variant="glass">
                Explore the roster
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="hero__foot">
          <div className="container">
            <span className="eyebrow">Zimbabwean-founded · Africa-first</span>
            <span className="eyebrow">Production · Talent · Artist business</span>
          </div>
        </div>
      </section>

      <Venn left="Talent" right="Opportunity" core={brand.name} caption="Where African talent meets paid work">
        <ButtonLink href="/how-it-works" variant="glass">
          See how it works
        </ButtonLink>
      </Venn>

      <section className="section" aria-label="Why it matters">
        <div className="container">
          <p className="eyebrow reveal">Why it matters</p>
          <div style={{ marginTop: "2rem" }}>
            <WordReveal text="Africa’s music is heard everywhere. We make sure the people who make it are found, contracted and paid properly." gold={["found", "paid"]} />
          </div>
          <div className="statement__cols">
            <p className="reveal">
              A production house, a session network, an agency, a digital studio and an artist back office — designed together so work, contracts,
              files and money move in one place.
            </p>
            <p className="reveal" style={d(1)}>
              Remote-first, with written scopes, fixed quotes after scoping, and a split sheet for every contributor before a note is released.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--rule" aria-labelledby="businesses-title">
        <div className="container">
          <header className="section-head section-head--split">
            <p className="eyebrow reveal">
              <span className="eyebrow__index">01</span> What we do
            </p>
            <h2 id="businesses-title" className="reveal">
              Five connected businesses. <span className="gold">One platform.</span>
            </h2>
          </header>
          <div className="ledger">
            {businesses.map((b, i) => (
              <article className="ledger__item reveal" key={b.key} style={d(i % 2)}>
                <span className="ledger__index">{b.index}</span>
                <h3 className="ledger__title">{b.title}</h3>
                <div className="ledger__body">
                  <p>{b.summary}</p>
                  <ul className="ledger__tags" role="list">
                    {b.items.slice(0, 4).map((item) => (
                      <li key={item} className="tag">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ArrowLink href={b.href}>{b.cta}</ArrowLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--glow" aria-labelledby="roster-title">
        <div className="container">
          <header className="section-head section-head--split">
            <p className="eyebrow reveal">
              <span className="eyebrow__index">02</span> The roster
            </p>
            <h2 id="roster-title" className="reveal">
              Find the right creative. <span className="gold">Hear them first.</span>
            </h2>
            <div className="lede reveal" style={d(1)}>
              Profiles with roles, styles, languages and working modes — and one shared player, so listening never interrupts browsing.
            </div>
          </header>
          <div className="reveal" style={{ marginBottom: "1.75rem", maxWidth: 820 }}>
            <Notice kind="sample" title="Sample profiles.">
              The launch roster is being verified. These profiles are fictional and show how the experience works; they carry no credits, prices or
              availability.
            </Notice>
          </div>
          <div className="roster-grid">
            {sampleRoster.slice(0, 3).map((p, i) => (
              <div className="reveal" style={d(i)} key={p.slug}>
                <TalentCard profile={p} />
              </div>
            ))}
          </div>
          <div className="cluster reveal" style={{ marginTop: "2.25rem" }}>
            <ButtonLink href="/roster" variant="glass">
              Browse all sample profiles
            </ButtonLink>
            <ArrowLink href="/apply">Apply to join the roster</ArrowLink>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <header className="section-head section-head--center">
            <p className="eyebrow reveal">How projects work</p>
            <h2 id="process-title" className="reveal">
              Four simple steps
            </h2>
          </header>
          <ol className="circles" role="list">
            {projectSteps.map((s, i) => (
              <li className="circle reveal" key={s.title} style={d(i)}>
                <span className="circle__no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="cluster reveal" style={{ marginTop: "3rem", justifyContent: "center" }}>
            <ArrowLink href="/how-it-works">Contracts, payments and payouts in detail</ArrowLink>
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="suite-title">
        <div className="container split">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.5rem" }}>
            <p className="eyebrow reveal">
              <span className="eyebrow__index">03</span> Artist Business Suite
            </p>
            <h2 id="suite-title" className="h-display reveal">
              The back office every artist <span className="gold">deserves.</span>
            </h2>
            <p className="lede reveal">
              Every creative gets a branded workspace — profile, opportunities, contracts, split sheets, invoices, statements and analytics — the records
              that make an artist bookable, fundable and protected.
            </p>
            <div className="reveal">
              <Checklist items={["Artist Business Passport: one verified professional record", "Payout statements you can actually read", "Rights and split-sheet history across every project", "Training, funding and support referrals"]} />
            </div>
            <div className="cluster reveal">
              <ButtonLink href="/artist-business-suite">Explore the suite</ButtonLink>
              <ButtonLink href="/demo/artist/msasa-room/overview" variant="glass">
                Open the demo workspace
              </ButtonLink>
            </div>
          </div>
          <div className="reveal" style={d(2)}>
            <DemoPreview />
          </div>
        </div>
      </section>

      <BigSentence>
        <span>African talent</span>
        <i>●</i>
        <span>booked by the world</span>
        <i>●</i>
        <span>
          paid <span className="gold">on the record</span>
        </span>
      </BigSentence>

      <section className="section" aria-labelledby="digital-title">
        <div className="container split split--reverse">
          <div className="reveal">
            <Orbit>
              <div>
                <strong>05</strong>
                <span>Digital launch services</span>
              </div>
            </Orbit>
          </div>
          <div className="stack" style={{ ["--stack-gap" as string]: "1.5rem" }}>
            <p className="eyebrow reveal">
              <span className="eyebrow__index">04</span> Websites and launches
            </p>
            <h2 id="digital-title" className="h-display reveal">
              A home online as considered as <span className="gold">the music.</span>
            </h2>
            <p className="lede reveal">
              Artist websites, press kits and release pages built on the same platform as the workspace — with first-party analytics instead of
              guesswork.
            </p>
            <div className="reveal">
              <Notice kind="proposed" title="Website incentive under validation.">
                Qualifying production projects may include a starter website. Terms and thresholds will be published only once approved.
              </Notice>
            </div>
            <div className="reveal">
              <ArrowLink href="/websites">Websites and launches</ArrowLink>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--rule" aria-labelledby="opps-title">
        <div className="container">
          <header className="section-head section-head--split">
            <p className="eyebrow reveal">
              <span className="eyebrow__index">05</span> Opportunity network
            </p>
            <h2 id="opps-title" className="reveal">
              Work that finds <span className="gold">the right people.</span>
            </h2>
            <div className="lede reveal" style={d(1)}>
              Sessions, productions, sync briefs, live work and programmes — matched to verified profiles rather than posted into the void.
            </div>
          </header>
          <div className="opportunity-list">
            {sampleOpportunities.slice(0, 3).map((o, i) => (
              <article className="opportunity reveal" key={o.id} style={d(i)}>
                <div className="stack" style={{ ["--stack-gap" as string]: "0.6rem" }}>
                  <div className="cluster" style={{ ["--cluster-gap" as string]: "0.5rem" }}>
                    <Badge kind="sample">Example listing</Badge>
                    <Badge kind="plain">{o.kind}</Badge>
                  </div>
                  <h3>{o.title}</h3>
                </div>
                <p className="opportunity__meta">
                  <span>{o.roles.join(", ")}</span>
                  <span>{o.location}</span>
                </p>
                <ArrowLink href="/opportunities">Details</ArrowLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="demo-title">
        <div className="container">
          <header className="section-head section-head--center">
            <p className="eyebrow reveal">Platform demonstration</p>
            <h2 id="demo-title" className="reveal">
              See the whole platform, <span className="gold">before it launches.</span>
            </h2>
            <div className="lede reveal" style={d(1)}>
              Four dashboards, one system. Every figure is invented demonstration data, clearly labelled.
            </div>
          </header>
          <div className="grid grid--4">
            {[
              { href: "/demo/company/overview", title: "Company dashboard", body: "Leads, projects, contracts, finance, consent and audit — the operating view." },
              { href: "/demo/artist/msasa-room/overview", title: "Artist workspace", body: "Opportunities, projects, split sheets, statements and analytics." },
              { href: "/demo/client/overview", title: "Client portal", body: "Brief, quote, agreements, milestones, reviews and final files." },
              { href: "/demo/partner/overview", title: "Partner workspace", body: "Referrals, programmes, support status and consented impact." },
            ].map((item, i) => (
              <article className="demo-card reveal" key={item.href} style={d(i)}>
                <Badge kind="demo">Demonstration</Badge>
                <h3>
                  <Link href={item.href}>{item.title}</Link>
                </h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Bring us the brief."
        body="A record, a session, a campaign or a score — tell us what you are making and we will come back with the right people and a written scope."
        primary={{ href: "/contact", label: "Start a project brief" }}
        secondary={{ href: "/apply", label: "Apply as a creative" }}
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "@/platform/components/ui/Link";
import { notFound } from "next/navigation";
import { creativeRoles, genres, labelFor } from "@/platform/domain/options";
import { findSampleProfile, monogram, sampleRoster } from "@/platform/demo-data/roster";
import { PlayButton } from "@/platform/components/roster/AudioPlayer";
import { TalentCard } from "@/platform/components/roster/TalentCard";
import { Orbit } from "@/platform/components/site/scenes";
import { Icon } from "@/platform/components/ui/Icon";
import { Badge, ButtonLink, Eyebrow, Notice } from "@/platform/components/ui/primitives";

export const dynamicParams = false;

export function generateStaticParams() {
  return sampleRoster.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const profile = findSampleProfile((await params).slug);
  if (!profile) return {};
  return {
    title: `Sample profile: ${profile.name}`,
    description: `Fictional sample profile demonstrating the talent profile experience. ${profile.headline}.`,
    // Sample profiles are never indexed, whatever the site-wide setting.
    robots: { index: false, follow: false },
  };
}

export default async function TalentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const profile = findSampleProfile((await params).slug);
  if (!profile) notFound();
  const others = sampleRoster.filter((p) => p.slug !== profile.slug && p.roles.some((r) => profile.roles.includes(r))).slice(0, 3);
  const primaryService = profile.roles.includes("mix-engineer") || profile.roles.includes("mastering-engineer") ? "mixing" : profile.roles.includes("producer") ? "production" : "session-musicians";

  return (
    <>
      <div className="container" style={{ paddingTop: "1.5rem" }}>
        <nav aria-label="Breadcrumb" className="muted" style={{ fontSize: "var(--step--1)" }}>
          <ol role="list" className="cluster" style={{ ["--cluster-gap" as string]: "0.5rem" }}>
            <li>
              <Link href="/roster">Roster</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{profile.name}</li>
          </ol>
        </nav>
      </div>

      <section className="container profile-hero" aria-labelledby="profile-name">
        <Orbit>
          <div>
            <strong>{monogram(profile.name)}</strong>
            <span>Sample profile</span>
          </div>
        </Orbit>
        <div className="stack" style={{ ["--stack-gap" as string]: "1.25rem" }}>
          <div className="cluster" style={{ ["--cluster-gap" as string]: "0.5rem" }}>
            <Badge kind="sample">Sample profile — fictional</Badge>
            {profile.remoteReady ? <Badge kind="plain">Remote delivery</Badge> : null}
          </div>
          <Eyebrow>{profile.roles.map((r) => labelFor(creativeRoles, r)).join(" · ")}</Eyebrow>
          <h1 id="profile-name">{profile.name}</h1>
          <p className="lede">{profile.headline}.</p>
          <dl className="profile-facts">
            <div>
              <dt>Based in</dt>
              <dd>
                {profile.city}, {profile.country}
              </dd>
            </div>
            <div>
              <dt>Works</dt>
              <dd>{profile.workingModes.join(" · ")}</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>{profile.languages.join(", ")}</dd>
            </div>
            <div>
              <dt>Availability and rates</dt>
              <dd>Shown after verification</dd>
            </div>
          </dl>
          <div className="cluster">
            <ButtonLink href={`/contact?talent=${profile.slug}&service=${primaryService}`} icon="arrow-right">
              Request for a project
            </ButtonLink>
            <ButtonLink href="/roster" variant="glass">
              Back to roster
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Profile details">
        <div className="container two-col">
          <div className="stack sticky-col" style={{ ["--stack-gap" as string]: "1rem" }}>
            <Notice kind="sample" title="This profile is fictional.">
              It demonstrates how a verified creative will be presented. It has no real credits, recordings, prices or availability, and any
              resemblance to a real artist is coincidental.
            </Notice>
          </div>
          <div className="stack" style={{ ["--stack-gap" as string]: "3rem" }}>
            <section className="stack" aria-labelledby="about-h">
              <h2 id="about-h" style={{ fontSize: "var(--step-3)" }}>
                About
              </h2>
              <p className="lede">{profile.bio}</p>
              <ul className="tag-list" role="list" aria-label="Genres">
                {profile.genres.map((g) => (
                  <li key={g} className="tag">
                    {labelFor(genres, g)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="stack" aria-labelledby="listen-h">
              <h2 id="listen-h" style={{ fontSize: "var(--step-3)" }}>
                Listen
              </h2>
              <p className="muted">Placeholder audio is synthesised in your browser when you press play. Approved recordings replace it at launch.</p>
              <ol className="track-list" role="list">
                {profile.tracks.map((t, i) => (
                  <li className="track" key={t.id}>
                    <PlayButton track={{ id: t.id, title: t.title, artist: profile.name, source: { kind: "synth", seed: t.seed }, duration: t.duration, isSample: true }} />
                    <div>
                      <p className="track__title">
                        {String(i + 1).padStart(2, "0")} · {t.title}
                      </p>
                      <p className="track__meta">{t.note}</p>
                    </div>
                    <span className="track__meta tabular">0:{String(t.duration).padStart(2, "0")}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="stack" aria-labelledby="credits-h">
              <h2 id="credits-h" style={{ fontSize: "var(--step-3)" }}>
                Credits
              </h2>
              <div className="empty-state">
                <Icon name="shield" className="btn__icon" />
                <p>
                  Credits are published only after we verify them with the release owner. Sample profiles therefore show none — we never borrow
                  or invent credits.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      {others.length ? (
        <section className="section section--raised" aria-labelledby="related-h">
          <div className="container">
            <h2 id="related-h" style={{ fontSize: "var(--step-3)", marginBottom: "1.5rem" }}>
              Similar sample profiles
            </h2>
            <div className="roster-grid">
              {others.map((p) => (
                <TalentCard key={p.slug} profile={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

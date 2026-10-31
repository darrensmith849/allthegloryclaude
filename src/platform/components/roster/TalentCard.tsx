import Link from "@/platform/components/ui/Link";
import { Artwork } from "@/platform/components/ui/Artwork";
import { Badge } from "@/platform/components/ui/primitives";
import { creativeRoles, genres, labelFor } from "@/platform/domain/options";
import { monogram, type SampleProfile } from "@/platform/demo-data/roster";
import { PlayButton } from "./AudioPlayer";

export function TalentCard({ profile, headingLevel = 3 }: { profile: SampleProfile; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const firstTrack = profile.tracks[0];
  return (
    <article className="talent-card">
      <div className="talent-card__badges">
        <Badge kind="sample">Sample profile</Badge>
        {profile.remoteReady ? <Badge kind="plain">Remote</Badge> : null}
      </div>
      <Artwork seed={profile.slug} variant={profile.art.variant} tone={profile.art.tone} monogram={monogram(profile.name)} />
      <div className="talent-card__body">
        <p className="talent-card__role">{profile.roles.map((r) => labelFor(creativeRoles, r)).join(" · ")}</p>
        <Heading className="talent-card__name">
          <Link href={`/roster/${profile.slug}`}>{profile.name}</Link>
        </Heading>
        <p className="talent-card__meta">
          {profile.city}, {profile.country}
        </p>
        <ul className="tag-list" role="list" aria-label="Genres">
          {profile.genres.map((g) => (
            <li key={g} className="tag">
              {labelFor(genres, g)}
            </li>
          ))}
        </ul>
      </div>
      <div className="talent-card__foot">
        <span className="muted" style={{ fontSize: "var(--step--1)" }}>
          Fictional — for demonstration
        </span>
        {firstTrack ? (
          <PlayButton
            track={{ id: firstTrack.id, title: firstTrack.title, artist: profile.name, source: { kind: "synth", seed: firstTrack.seed }, duration: firstTrack.duration, isSample: true }}
            label={`placeholder audio for ${profile.name}`}
          />
        ) : null}
      </div>
    </article>
  );
}

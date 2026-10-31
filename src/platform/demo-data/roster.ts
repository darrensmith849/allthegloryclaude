import type { ArtworkTone, ArtworkVariant } from "@/platform/components/ui/Artwork";
import type { CreativeRoleValue, GenreValue } from "@/platform/domain/options";

// FICTIONAL SAMPLE PROFILES. Names are invented stage-name style labels, not
// people. They carry no credits, prices or availability. Every rendering of
// them shows a "Sample profile" badge and every profile page is noindex.
// The approved launch roster is registered in src/config/approvals.ts.

export interface SampleTrack {
  id: string;
  title: string;
  /** Seconds of synthesised placeholder audio. */
  duration: number;
  seed: number;
  note: string;
}

export interface SampleProfile {
  slug: string;
  name: string;
  isSample: true;
  roles: CreativeRoleValue[];
  headline: string;
  city: string;
  country: string;
  genres: GenreValue[];
  languages: string[];
  workingModes: ("Remote sessions" | "In-studio" | "Live and touring")[];
  remoteReady: boolean;
  bio: string;
  tracks: SampleTrack[];
  art: { variant: ArtworkVariant; tone: ArtworkTone };
}

export const sampleRoster: SampleProfile[] = [
  {
    slug: "msasa-room",
    name: "Msasa Room",
    isSample: true,
    roles: ["producer", "songwriter"],
    headline: "Production and arrangement for Afropop and gospel crossovers",
    city: "Harare",
    country: "Zimbabwe",
    genres: ["afro-pop", "gospel", "rnb-soul"],
    languages: ["English", "Shona"],
    workingModes: ["Remote sessions", "In-studio"],
    remoteReady: true,
    bio: "A fictional production duo used to show how a producer profile reads: arrangement-led, vocal-first, comfortable moving between choir-scale gospel and lean Afropop records.",
    tracks: [
      { id: "msasa-1", title: "Placeholder sketch I", duration: 20, seed: 1, note: "Synthesised placeholder" },
      { id: "msasa-2", title: "Placeholder sketch II", duration: 20, seed: 7, note: "Synthesised placeholder" },
    ],
    art: { variant: "orbit", tone: "gold" },
  },
  {
    slug: "kopje-sound",
    name: "Kopje Sound",
    isSample: true,
    roles: ["mix-engineer", "mastering-engineer"],
    headline: "Mixing and mastering with release-ready stems and versions",
    city: "Bulawayo",
    country: "Zimbabwe",
    genres: ["afro-house", "amapiano", "electronic"],
    languages: ["English", "Ndebele"],
    workingModes: ["Remote sessions"],
    remoteReady: true,
    bio: "A fictional engineer profile illustrating the technical detail clients expect: deliverable formats, revision rounds and loudness targets agreed before work starts.",
    tracks: [{ id: "kopje-1", title: "Placeholder mix study", duration: 20, seed: 2, note: "Synthesised placeholder" }],
    art: { variant: "rings", tone: "ink" },
  },
  {
    slug: "granite-hour",
    name: "Granite Hour",
    isSample: true,
    roles: ["guitarist", "bassist"],
    headline: "Session guitar and bass, from sungura lines to modern R&B",
    city: "Mutare",
    country: "Zimbabwe",
    genres: ["sungura", "rnb-soul", "folk-acoustic"],
    languages: ["English", "Shona"],
    workingModes: ["Remote sessions", "Live and touring"],
    remoteReady: true,
    bio: "A fictional session player profile. Shows how instrument, style range and remote recording set-up are presented so a client can brief with confidence.",
    tracks: [{ id: "granite-1", title: "Placeholder guitar figure", duration: 20, seed: 3, note: "Synthesised placeholder" }],
    art: { variant: "horizon", tone: "gold" },
  },
  {
    slug: "copper-and-dusk",
    name: "Copper & Dusk",
    isSample: true,
    roles: ["vocalist", "songwriter"],
    headline: "Lead and backing vocals, toplines and harmony arrangements",
    city: "Johannesburg",
    country: "South Africa",
    genres: ["afro-pop", "gospel", "jazz"],
    languages: ["English", "isiZulu", "Shona"],
    workingModes: ["Remote sessions", "In-studio"],
    remoteReady: true,
    bio: "A fictional vocal duo profile. Demonstrates how languages, vocal range and topline services are surfaced for international briefs.",
    tracks: [
      { id: "copper-1", title: "Placeholder harmony stack", duration: 20, seed: 4, note: "Synthesised placeholder" },
      { id: "copper-2", title: "Placeholder topline", duration: 20, seed: 9, note: "Synthesised placeholder" },
    ],
    art: { variant: "venn", tone: "sand" },
  },
  {
    slug: "lowveld-keys",
    name: "Lowveld Keys",
    isSample: true,
    roles: ["keys", "musical-director"],
    headline: "Keys, synth programming and musical direction for live shows",
    city: "Masvingo",
    country: "Zimbabwe",
    genres: ["jazz", "gospel", "afrobeats"],
    languages: ["English", "Shona"],
    workingModes: ["Remote sessions", "Live and touring"],
    remoteReady: true,
    bio: "A fictional keys and MD profile, showing how live-show direction and studio session work sit side by side on one profile.",
    tracks: [{ id: "lowveld-1", title: "Placeholder chord study", duration: 20, seed: 5, note: "Synthesised placeholder" }],
    art: { variant: "horizon", tone: "gold" },
  },
  {
    slug: "nine-rivers-strings",
    name: "Nine Rivers Strings",
    isSample: true,
    roles: ["strings", "composer"],
    headline: "String arrangements and remote ensemble recording",
    city: "Nairobi",
    country: "Kenya",
    genres: ["film-score", "folk-acoustic", "gospel"],
    languages: ["English", "Swahili"],
    workingModes: ["Remote sessions", "In-studio"],
    remoteReady: true,
    bio: "A fictional string ensemble profile illustrating pan-African reach: the network is Zimbabwean-founded but open to creatives across the continent.",
    tracks: [{ id: "nine-1", title: "Placeholder string pad", duration: 20, seed: 6, note: "Synthesised placeholder" }],
    art: { variant: "orbit", tone: "gold" },
  },
  {
    slug: "tide-and-thread",
    name: "Tide & Thread",
    isSample: true,
    roles: ["songwriter", "composer"],
    headline: "Songwriting, sync briefs and music for picture",
    city: "Lagos",
    country: "Nigeria",
    genres: ["afrobeats", "film-score", "hip-hop"],
    languages: ["English", "Yoruba"],
    workingModes: ["Remote sessions"],
    remoteReady: true,
    bio: "A fictional writer-composer profile, showing how sync and media work is described with rights and split-sheet expectations made explicit up front.",
    tracks: [{ id: "tide-1", title: "Placeholder cue", duration: 20, seed: 8, note: "Synthesised placeholder" }],
    art: { variant: "rings", tone: "sand" },
  },
  {
    slug: "red-earth-rhythm",
    name: "Red Earth Rhythm",
    isSample: true,
    roles: ["drummer", "recording-engineer"],
    headline: "Drums, percussion and tracking for live-band records",
    city: "Gaborone",
    country: "Botswana",
    genres: ["afro-house", "jazz", "zim-dancehall"],
    languages: ["English", "Setswana"],
    workingModes: ["In-studio", "Live and touring"],
    remoteReady: false,
    bio: "A fictional rhythm-section profile. Demonstrates an in-studio-only creative, so filters for remote delivery have something to exclude.",
    tracks: [{ id: "red-1", title: "Placeholder groove", duration: 20, seed: 10, note: "Synthesised placeholder" }],
    art: { variant: "venn", tone: "gold" },
  },
];

export function findSampleProfile(slug: string): SampleProfile | undefined {
  return sampleRoster.find((p) => p.slug === slug);
}

export function monogram(name: string): string {
  return name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

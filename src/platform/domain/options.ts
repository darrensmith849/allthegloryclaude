// Controlled vocabularies shared by forms, filters, demo data and (later) the
// API. Values are stable keys; labels may change freely.

export const services = [
  { value: "production", label: "Music production and arrangement" },
  { value: "songwriting", label: "Songwriting and composition" },
  { value: "vocal-production", label: "Vocal production" },
  { value: "recording", label: "Recording" },
  { value: "mixing", label: "Mixing" },
  { value: "mastering", label: "Mastering" },
  { value: "session-musicians", label: "Remote session musicians" },
  { value: "musical-direction", label: "Musical direction" },
  { value: "sync-and-media", label: "Music for film, TV, games and brands" },
  { value: "artist-website", label: "Artist website or press kit" },
  { value: "release-campaign", label: "Release landing page and campaign" },
  { value: "not-sure", label: "Not sure yet — help me scope it" },
] as const;
export type ServiceValue = (typeof services)[number]["value"];

export const creativeRoles = [
  { value: "producer", label: "Producer" },
  { value: "mix-engineer", label: "Mix engineer" },
  { value: "mastering-engineer", label: "Mastering engineer" },
  { value: "recording-engineer", label: "Recording engineer" },
  { value: "songwriter", label: "Songwriter" },
  { value: "vocalist", label: "Vocalist" },
  { value: "guitarist", label: "Guitarist" },
  { value: "bassist", label: "Bassist" },
  { value: "keys", label: "Keys and piano" },
  { value: "drummer", label: "Drums and percussion" },
  { value: "strings", label: "Strings" },
  { value: "horns", label: "Horns" },
  { value: "musical-director", label: "Musical director" },
  { value: "composer", label: "Composer" },
] as const;
export type CreativeRoleValue = (typeof creativeRoles)[number]["value"];

export const genres = [
  { value: "afro-pop", label: "Afropop" },
  { value: "amapiano", label: "Amapiano" },
  { value: "afro-house", label: "Afro house" },
  { value: "afrobeats", label: "Afrobeats" },
  { value: "zim-dancehall", label: "Zim dancehall" },
  { value: "sungura", label: "Sungura" },
  { value: "chimurenga", label: "Chimurenga" },
  { value: "gospel", label: "Gospel" },
  { value: "jazz", label: "Jazz" },
  { value: "rnb-soul", label: "R&B and soul" },
  { value: "hip-hop", label: "Hip-hop" },
  { value: "electronic", label: "Electronic" },
  { value: "film-score", label: "Film and media score" },
  { value: "folk-acoustic", label: "Folk and acoustic" },
] as const;
export type GenreValue = (typeof genres)[number]["value"];

/** Client budget ranges are the client's own indication, not our prices. */
export const budgetBands = [
  { value: "under-1k", label: "Under USD 1,000" },
  { value: "1k-5k", label: "USD 1,000 – 5,000" },
  { value: "5k-15k", label: "USD 5,000 – 15,000" },
  { value: "15k-plus", label: "Over USD 15,000" },
  { value: "unsure", label: "I need guidance" },
] as const;

export const timelines = [
  { value: "under-2-weeks", label: "Within 2 weeks" },
  { value: "2-6-weeks", label: "2 – 6 weeks" },
  { value: "6-12-weeks", label: "6 – 12 weeks" },
  { value: "flexible", label: "Flexible" },
] as const;

export const clientTypes = [
  { value: "artist", label: "Independent artist" },
  { value: "label", label: "Label or management" },
  { value: "agency", label: "Agency or brand" },
  { value: "film-tv-games", label: "Film, TV or games" },
  { value: "church-org", label: "Church or organisation" },
  { value: "other", label: "Other" },
] as const;

export const experienceLevels = [
  { value: "emerging", label: "Emerging (under 2 years of paid work)" },
  { value: "established", label: "Established (2–7 years)" },
  { value: "senior", label: "Senior (7+ years)" },
] as const;

export function labelFor<T extends readonly { value: string; label: string }[]>(list: T, value: string): string {
  return list.find((o) => o.value === value)?.label ?? value;
}

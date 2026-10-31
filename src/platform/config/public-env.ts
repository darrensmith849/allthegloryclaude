import { z } from "zod";

// Zod 4 probes `new Function` for its JIT unless told not to; keep it off so
// a strict CSP never sees an eval attempt.
z.config({ jitless: true });

// Browser-safe configuration, validated where it is used on the server.
// NEXT_PUBLIC_* values are inlined at build time, so each one is referenced
// literally. Every platform variable is prefixed AGENCY so it never collides
// with All the Glory's own configuration.

const optionalEmail = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalWhatsapp = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use E.164 format, e.g. +263…")
  .optional()
  .or(z.literal("").transform(() => undefined));

const schema = z.object({
  turnstileSiteKey: z.string().trim().optional().transform((v) => (v ? v : undefined)),
  indexing: z.enum(["enabled", "disabled"]).catch("disabled"),
  contactEmail: optionalEmail,
  contactWhatsapp: optionalWhatsapp,
});

export const publicEnv = schema.parse({
  turnstileSiteKey: process.env.NEXT_PUBLIC_AGENCY_TURNSTILE_SITE_KEY,
  indexing: process.env.NEXT_PUBLIC_AGENCY_INDEXING,
  contactEmail: process.env.NEXT_PUBLIC_AGENCY_CONTACT_EMAIL,
  contactWhatsapp: process.env.NEXT_PUBLIC_AGENCY_CONTACT_WHATSAPP,
});

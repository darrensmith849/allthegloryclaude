import { z } from "zod";
import { budgetBands, clientTypes, creativeRoles, experienceLevels, genres, services, timelines } from "./options";

// Zod 4 probes `new Function` for its JIT unless told not to; the CSP forbids eval.
z.config({ jitless: true });

// One schema per public form, shared by the browser (inline errors), the
// edge route (authoritative validation) and the future Hetzner API.

const valuesOf = <T extends readonly { value: string }[]>(list: T) => list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const name = z.string().trim().min(2, "Please enter your name").max(120, "Keep this under 120 characters");
const email = z.string().trim().max(254).email("Enter a valid email address");
const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`).optional().default("");
const phone = z
  .string()
  .trim()
  .max(24)
  .regex(/^$|^\+?[\d\s()-]{8,22}$/, "Use international format, e.g. +263 77 000 0000")
  .optional()
  .default("");
const url = z
  .string()
  .trim()
  .max(400)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full link starting with https://");

/** Privacy acknowledgement is required; marketing consent is separate and optional (MASTER_PLAN §11, §13). */
const consent = {
  privacyAccepted: z.literal(true, { error: "Please confirm you have read the privacy notice" }),
  marketingOptIn: z.boolean().default(false),
};

/** Fields the server adds or checks; never trusted for business logic. */
export const submissionMeta = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid submission key"),
  turnstileToken: z.string().max(4096).optional().default(""),
  /** Honeypot: humans never see or fill this field. */
  website: z.string().max(0).optional().default(""),
  /** Form render time; very fast submissions are treated as automated. */
  startedAt: z.number().int().positive(),
});

export const enquirySchema = z.object({
  name,
  email,
  phone,
  organisation: optionalText(160),
  clientType: z.enum(valuesOf(clientTypes), { error: "Choose the option that fits best" }),
  country: z.string().trim().min(2, "Tell us where you are based").max(80),
  services: z.array(z.enum(valuesOf(services))).min(1, "Choose at least one service").max(services.length),
  talentSlugs: z.array(z.string().regex(/^[a-z0-9-]{2,80}$/)).max(6).default([]),
  budgetBand: z.enum(valuesOf(budgetBands), { error: "Choose a budget range" }),
  timeline: z.enum(valuesOf(timelines), { error: "Choose a timeline" }),
  brief: z.string().trim().min(40, "Give us at least a few sentences (40+ characters)").max(4000, "Keep the brief under 4,000 characters"),
  references: z.array(url).max(5, "Add up to five links").default([]),
  ...consent,
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const applicationSchema = z.object({
  name,
  stageName: optionalText(120),
  email,
  phone,
  country: z.string().trim().min(2, "Tell us where you are based").max(80),
  city: optionalText(80),
  roles: z.array(z.enum(valuesOf(creativeRoles))).min(1, "Choose at least one role").max(5, "Choose up to five roles"),
  genres: z.array(z.enum(valuesOf(genres))).min(1, "Choose at least one genre").max(6, "Choose up to six genres"),
  experience: z.enum(valuesOf(experienceLevels), { error: "Choose your experience level" }),
  portfolioLinks: z.array(url).min(1, "Add at least one link to your work").max(5, "Add up to five links"),
  credits: optionalText(1500),
  remoteReady: z.boolean().default(false),
  statement: z.string().trim().min(40, "Tell us a little more (40+ characters)").max(2000, "Keep this under 2,000 characters"),
  rightsConfirmed: z.literal(true, { error: "Please confirm you have the right to share these works" }),
  ...consent,
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const enquiryRequestSchema = z.object({ data: enquirySchema, meta: submissionMeta });
export const applicationRequestSchema = z.object({ data: applicationSchema, meta: submissionMeta });

/** Flatten Zod issues into `{ fieldPath: message }` for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.filter((p) => typeof p === "string" || typeof p === "number").join(".") || "_form";
    // Collapse array item errors onto the array field ("references.2" → "references").
    const field = key.replace(/\.\d+$/, "");
    out[field] ??= issue.message;
  }
  return out;
}

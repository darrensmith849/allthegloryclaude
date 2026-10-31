# Phase 1 Implementation Plan

Status: Phase 1 built on `codex/foundation-plan`. Nothing is deployed. `main` is untouched. See also `ARCHITECTURE.md`, `ENVIRONMENT.md`, `DEPLOYMENT.md`, `OWNER_DECISIONS.md`.

## 1. Repository inventory (at start of Phase 1)

| Item | Finding |
| --- | --- |
| `main` | One-byte `start.ts`. No application code. |
| `codex/foundation-plan` | `CLAUDE.md`, `docs/MASTER_PLAN.md`, `start.ts`. |
| Deployment environment | None configured. No Cloudflare, Hetzner, database or email resources exist yet. |
| Earlier Claude roster prototype | Not present in this repository or on the build machine. Its "retain" features (MASTER_PLAN §7) are re-implemented from the specification. |

## 2. Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Front end | Next.js 16 (App Router), React 19, TypeScript 5.9 strict | "Next.js-compatible front end" on Cloudflare (§10). Static generation for every public and demo page. |
| Cloudflare runtime | `@opennextjs/cloudflare` + `wrangler.jsonc` (not deployed) | Runs the same Next.js build on Workers; R2 / Turnstile / rate-limit bindings documented. |
| Styling | Hand-written CSS on design tokens (no CSS framework) | Tenant theming through CSS custom properties; small CSS. |
| Design language | The All the Glory `/websites` page (owner direction, 31 Oct 2026): deep blue-black, light Inter, gold accent, glowing pills, line-art circles drawn on scroll | The owner asked for the platform to match that page. Tokens keep a later brand pass to one file. |
| Fonts | `next/font` self-hosted Inter | Same family as the reference page; no third-party font requests at runtime. |
| Validation | Zod 4 | One schema shared by client form, edge route and (later) the Hetzner API. |
| Tests | Vitest (domain, security, schemas) + Playwright with axe-core (routes, a11y, responsive, forms, dialogs) | §17 acceptance criteria. Headless Chromium only — no access to any personal browser. |

## 3. Folder map

```
docs/                     plan, architecture, environment, deployment, owner decisions
db/migrations/            PostgreSQL schema draft for Phase 2 (not executed)
src/platform/config/               brand, theme, navigation, approvals register — the only place brand text lives
src/platform/domain/               pure TypeScript: ids, money, commission/payout maths, roles & permissions,
                          tenant guard, consent, contact normalisation, form schemas
src/platform/server/               server-only: env validation, Turnstile, origin check, rate limit, idempotency,
                          core-API client (dev file store | Hetzner HTTPS), submission pipeline
src/content/              public-site copy and service definitions
src/demo-data/            fictional, labelled demonstration data (roster, opportunities, dashboards)
src/platform/components/ui/        primitives: Container, Section, Button, Badge, Field, Dialog, Artwork, Media
src/platform/components/site/      header, mobile navigation dialog, footer, notices, CTAs
src/platform/components/roster/    roster explorer (URL-synced filters), talent cards, shared audio player
src/platform/components/forms/     project brief, roster application, Turnstile widget
src/platform/components/dashboard/ dashboard shell and data primitives (tables, stat tiles, charts, boards)
src/app/(site)/           public website (one bundle)
src/app/demo/             dashboard demonstrations (separate layout, CSS and JS; always noindex)
src/app/api/              enquiries, applications, first-party events
src/platform/styles/               tokens.css, base.css, site.css, dashboard.css
tests/unit/               Vitest
tests/e2e/                Playwright: routes, a11y, overflow, keyboard, forms, screenshots
```

## 4. Public routes

`/` · `/about` · `/roster` · `/roster/[slug]` · `/services` · `/how-it-works` · `/artist-business-suite` ·
`/websites` · `/opportunities` · `/partners` · `/partners/proposed-collaboration` · `/clients` · `/creatives` ·
`/contact` (project brief, pre-selection via `?talent=` and `?service=`) · `/apply` · `/privacy` · `/cookies` · `/terms`

## 5. Demonstration routes (noindex, labelled)

- `/demo` — hub
- `/demo/company/[section]` — overview, pipeline, clients, talent, projects, contracts, finance, analytics, partners, admin
- `/demo/artist/[tenant]/[section]` — two fictional tenants rendered by the same code with different theme tokens
- `/demo/client/[section]` — overview, brief, quote, payments, review, files, messages
- `/demo/partner/[section]` — overview, referrals, programmes, support, impact, consent

## 6. Submission pipeline (Phase 1)

`browser form → /api/{enquiries|applications} (edge-compatible route)`
1. origin allow-list → 2. JSON size limit → 3. rate limit → 4. honeypot → 5. Turnstile →
6. Zod validation → 7. idempotency key → 8. core API adapter → 9. response with reference ID.

Core API adapter (`AGENCY_CORE_API_MODE`):

- `dev-file` — development only; writes contacts, consent records, enquiries, applications, audit events and an
  internal-alert outbox to `.data/dev-store.json` (git-ignored).
- `http` — signed HTTPS call to the private Hetzner API (Phase 2). PostgreSQL stays the only system of record;
  Cloudflare D1 is not used.
- `disabled` — returns 503 and the form keeps the visitor's input.

## 7. Phase 1 acceptance checklist (MASTER_PLAN §17)

Tracked in the final build report.

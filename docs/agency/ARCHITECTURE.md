# Architecture

## System boundary

```
Browser ──HTTPS──▶ Cloudflare (DNS, CDN, TLS, WAF, rate limiting, Turnstile)
                     │
                     ├─ Workers static assets: every public page and demo page (pre-rendered)
                     └─ Worker (OpenNext): /api/enquiries, /api/applications, /api/events
                              │  bearer token + HMAC-signed body + Idempotency-Key
                              ▼
                   Hetzner private API  (Phase 2)
                     ├─ PostgreSQL — the only system of record (db/migrations)
                     ├─ workers: email outbox, document generation, audio processing, schedules
                     └─ encrypted backups + restore drills
R2 (private buckets, signed URLs): contracts, identity records, client references, unreleased music.
R2 (public/cached): portfolio media only after the artist approves it.
```

- The browser never talks to PostgreSQL.
- Cloudflare D1 is **not** used. There is one source of truth.
- In Phase 1 the Worker's core-API adapter is `disabled` in any deployed environment; `dev-file` exists only for local development and tests and is refused when `AGENCY_DEPLOYMENT_ENV=production`.

## Code layout and responsibilities

| Path | Responsibility | May import |
| --- | --- | --- |
| `src/platform/config` | Brand text, approvals register, theme tokens, browser-safe env | `zod` |
| `src/platform/domain` | Pure business rules: money, settlement, permissions, consent, lifecycles, schemas | `zod`, `ulid` |
| `src/platform/server` | Server-only: env, security checks, core-API adapters, submission pipeline | domain, config |
| `src/content`, `src/demo-data` | Public copy; fictional demonstration data | domain types |
| `src/platform/components` | UI. `ui/` primitives, `site/` public chrome, `roster/`, `forms/`, `dashboard/` | domain, config (never server — enforced by ESLint) |
| `src/app/(site)` | Public website routes | components |
| `src/app/demo` | Dashboard demonstrations — own layout and stylesheet | components/dashboard |
| `src/app/api` | Edge route handlers | server |

`src/platform/domain` has no React, Next.js or Node dependencies, so the Phase 2 Hetzner API can import it unchanged (or as an extracted workspace package).

## Public submission pipeline

`src/platform/server/submissions.ts`, used by both public forms:

1. **Origin** must be in `AGENCY_ALLOWED_ORIGINS` (or `Sec-Fetch-Site: same-origin`).
2. **Content type** JSON; **body** ≤ 32 KB.
3. **Rate limit** per hashed client IP + form (`AGENCY_RATE_LIMIT_MAX` per `AGENCY_RATE_LIMIT_WINDOW_SECONDS`). Cloudflare WAF rate-limiting is the first line in production; this is the backstop.
4. **Schema** validation (`src/platform/domain/schemas.ts`); honeypot must be empty; meta errors are reported generically.
5. **Minimum fill time** (2.5 s) — automated submissions are rejected with a recoverable message.
6. **Turnstile** server verification with the submission's idempotency key. Development without a secret uses a logged bypass; every other environment requires the secret.
7. **Core API** call with the idempotency key. A retry returns the original reference (HTTP 200) instead of a duplicate.
8. Responses are specific and recoverable; the form keeps every answer on failure.

The dev store records what PostgreSQL will: contact deduplication by normalised email, privacy-notice consent with wording version, marketing consent **only when ticked**, enquiry/application lifecycle state, audit events and an outbox containing an internal alert plus an acknowledgement email — so a saved record without a queued alert is visible, not silent.

## Multi-tenancy and permissions

- Tenants are `organisations` (`operator` or `partner`). Artists and clients are members of an operator tenant with ownership-scoped roles; each artist workspace is a themed, scoped view — never a separate deployment or codebase.
- `authorize()` in `src/platform/domain/permissions.ts` evaluates: tenant boundary → role permission → ownership (artist/client) → MFA for sensitive actions. Partners reach records only through explicit consent grants and never receive finance or contract permissions.
- PostgreSQL enforces the same boundary with row-level security on every tenant-owned table (`app.organisation_id` per transaction). The schema was applied to PostgreSQL 17 and checked: tenants see only their own rows, cross-tenant writes fail, and `audit_events` rejects updates and deletes.
- Support cases store category and status only. There is deliberately no column for case detail.

## Money

Integer minor units with explicit currency; basis-point rates; largest-remainder allocation; `settleProject()` throws unless receipts = costs + commission + payouts to the minor unit. Commission models are per contract (percentage, fixed margin, introduction fee, percentage with minimum). Only the contracting legal entity issues client invoices; artists may draft payment requests.

## Front end

- Next.js 16 App Router, all pages statically generated. Public and demo routes have separate layouts and stylesheets; demo code never ships with public pages.
- Design language: the All the Glory `/websites` page — deep blue-black, Inter at light weights, gold accent, glowing pill buttons, wide-tracked micro labels, thin line-art circles that draw on scroll. Tokens in `src/platform/styles/tokens.css`; tenant workspaces override accent and canvas tokens through `themeToStyle()`.
- Scroll scenes (Venn, words lighting up, moving sentence) are CSS driven by one `--p` progress variable; no animation library. Content is fully visible without JavaScript and under `prefers-reduced-motion`.
- Images: `src/platform/components/ui/Media.tsx` wraps `next/image` (intrinsic size, `sizes`, lazy by default, priority only when marked) and renders nothing unless the asset is approved for public use. Until approved photography exists, imagery is generated line-art SVG.
- Audio: one shared player; nothing autoplays; sample profiles use a synthesised placeholder so no real recording is attributed to a fictional creative.
- Analytics: first-party, cookie-free, fixed event names, no form content, off under Global Privacy Control / Do Not Track. Not loaded in demo or (future) authenticated bundles.

## Security headers

Set in `next.config.ts`: CSP (scripts self + Turnstile; `'unsafe-inline'` for Next.js bootstrap until per-request nonces in Phase 2), `frame-ancestors 'none'`, `nosniff`, strict referrer policy, restrictive Permissions-Policy, COOP, HSTS in production, `X-Robots-Tag: noindex` for `/demo/*` and sample profiles, `no-store` for `/api/*`.

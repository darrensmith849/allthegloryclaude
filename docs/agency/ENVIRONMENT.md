# Environment variables

> On All the Glory: see `README.md` in this folder for the `/agency` mount, scripts and `AGENCY_` variables, which supersede the generic names below.

Copy `.env.example` to `.env.local` for development. Never commit real values. Server variables are validated in `src/platform/server/env.ts`; browser variables in `src/platform/config/public-env.ts`. A misconfigured deployment fails loudly rather than dropping submissions.

## Browser (inlined at build time — never secrets)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | `http://localhost:3000` | Canonical origin for metadata, sitemap and the default allowed origin. |
| `NEXT_PUBLIC_AGENCY_TURNSTILE_SITE_KEY` | Outside development | — | Cloudflare Turnstile site key. Without it the widget is hidden and only development may bypass. |
| `NEXT_PUBLIC_AGENCY_INDEXING` | No | `disabled` | `enabled` allows search indexing. Demos, sample profiles and proposals stay `noindex` regardless. |
| `NEXT_PUBLIC_AGENCY_CONTACT_EMAIL` | No | — | Public business inbox (role address only). Hidden when unset. |
| `NEXT_PUBLIC_AGENCY_CONTACT_WHATSAPP` | No | — | Public WhatsApp number in E.164 (`+263…`). Hidden when unset. |

## Build

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_BASE_PATH` | No | Serve under a path such as `/agency` on an existing domain. Empty for an independent domain. Links and fetches follow it automatically. |

## Server only

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `AGENCY_DEPLOYMENT_ENV` | Yes when deployed | `development` | `development`, `preview` or `production`. Controls which modes are allowed. |
| `AGENCY_CORE_API_MODE` | No | `dev-file` in development, otherwise `disabled` | `dev-file` (local JSON store, refused in production), `http` (Hetzner API) or `disabled` (forms return 503 and keep input). |
| `AGENCY_DEV_STORE_PATH` | No | `.data/dev-store.json` | Development store location (git-ignored). |
| `AGENCY_CORE_API_URL` | With `http` | — | Base URL of the private API, e.g. `https://api.internal.example`. |
| `AGENCY_CORE_API_TOKEN` | With `http` | — | Bearer token (≥ 32 chars). Secret. |
| `AGENCY_CORE_API_SIGNING_SECRET` | With `http` | — | HMAC-SHA256 key for request signatures (≥ 32 chars). Secret. |
| `AGENCY_TURNSTILE_SECRET_KEY` | Outside development | — | Turnstile secret. Secret. |
| `AGENCY_ALLOWED_ORIGINS` | No | `NEXT_PUBLIC_SITE_URL` | Comma-separated origins allowed to POST to the form endpoints. |
| `AGENCY_RATE_LIMIT_MAX` | No | `8` | Submissions per client per window. |
| `AGENCY_RATE_LIMIT_WINDOW_SECONDS` | No | `600` | Rate-limit window. |

## Credentials still to be created (owner approval required)

- Cloudflare account access, zone for the final domain, Turnstile site + secret, R2 buckets, rate-limiting namespace.
- Hetzner project, server(s), PostgreSQL credentials, backup storage and encryption keys.
- Transactional email provider account, verified sending domain (SPF, DKIM, DMARC).
- Payment provider accounts (Phase 3).

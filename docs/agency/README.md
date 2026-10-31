# /agency — Africa music platform on All the Glory

The platform (working name “Ngoma”) runs inside this Next.js app at **alltheglory.co.za/agency** and deploys with the existing All the Glory Worker. It is self-contained so it can move to its own domain later.

| Path | What |
| --- | --- |
| `src/app/agency/**` | Routes: public site `(site)/`, dashboard demos `demo/`, form and analytics APIs `api/` |
| `src/platform/**` | Everything else: config, domain rules, server pipeline, components, content, demo data, styles |
| `src/platform/styles/*.css` | Scoped under `.ngoma` (run `npm run agency:scope-css` after adding CSS) |
| `tests/agency/**` | Vitest (`npm run test:agency`) and Playwright (`npm run build:agency-e2e && npm run test:agency:e2e`) |
| `db/agency-postgres/` | PostgreSQL schema draft for the Phase 2 Hetzner API (not D1, not applied) |
| `docs/agency/` | Master plan, build contract, architecture, owner decisions |

All the Glory's nav, footer, player, backdrop, social dock and ⌘K palette stand down on `/agency` (`src/components/site/*`, `src/components/ui/command-palette.tsx`), and `page-transition.tsx` keeps one persistent shell for `/agency`.

## Environment variables (all optional; safe defaults)

Build-time (set in the Workers Builds environment):

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_AGENCY_SUBMISSIONS` | `closed` in production | `open` lets visitors send the brief and application forms. Leave closed until the core API is live. |
| `NEXT_PUBLIC_AGENCY_INDEXING` | `disabled` | `enabled` allows search indexing. Demos, sample profiles and proposals stay noindex regardless. |
| `NEXT_PUBLIC_AGENCY_TURNSTILE_SITE_KEY` | — | Turnstile site key for the forms. |
| `NEXT_PUBLIC_AGENCY_CONTACT_EMAIL` / `_WHATSAPP` | — | Public business channels (role addresses only). |

Runtime (Worker vars; secrets via `wrangler secret put`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `AGENCY_DEPLOYMENT_ENV` | `production` in production builds | `development`, `preview` or `production`. |
| `AGENCY_CORE_API_MODE` | `disabled` outside development | `http` once the Hetzner API exists; `dev-file` is local only and refused in production. |
| `AGENCY_CORE_API_URL`, `AGENCY_CORE_API_TOKEN`*, `AGENCY_CORE_API_SIGNING_SECRET`* | — | Private API connection. |
| `AGENCY_TURNSTILE_SECRET_KEY`* | — | Required whenever submissions are enabled outside development. |
| `AGENCY_ALLOWED_ORIGINS` | the requested host | Extra origins allowed to post to the forms. |
| `AGENCY_RATE_LIMIT_MAX`, `AGENCY_RATE_LIMIT_WINDOW_SECONDS` | `8`, `600` | Per-client submission limit. |

\* secret

With nothing set, a production deploy shows the full site and demos, and the forms explain that submissions open at launch. No bot-check bypass or development store is reachable in production.

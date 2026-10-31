# Deployment

> On All the Glory: see `README.md` in this folder for the `/agency` mount, scripts and `AGENCY_` variables, which supersede the generic names below.

**Nothing is deployed.** Every step below needs explicit owner approval (CLAUDE.md rule 10).

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000 — forms write to .data/dev-store.json
```

## Checks

```bash
npm run typecheck
npm run lint
npm test               # Vitest: domain, security, submission pipeline
npm run build
npx playwright install chromium   # once
npm run test:e2e       # builds must exist; starts `next start` on :3100 with the dev store
npm run screenshots    # full-page PNGs at 390/768/1024/1440 into screenshots/
```

## Cloudflare preview (after approval)

1. Create the Cloudflare zone for the approved domain (or a preview subdomain) and a Turnstile widget for it.
2. `npx wrangler login` with the company account.
3. Set secrets — never in `wrangler.jsonc`:
   `npx wrangler secret put AGENCY_TURNSTILE_SECRET_KEY` (and `AGENCY_CORE_API_TOKEN`, `AGENCY_CORE_API_SIGNING_SECRET` once the API exists).
4. Set build-time variables in the build environment: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AGENCY_TURNSTILE_SITE_KEY`, optional `NEXT_BASE_PATH`.
5. `npm run preview:cloudflare` to run the Worker locally, then `npx opennextjs-cloudflare deploy` for a preview.
6. WAF: add a rate-limiting rule for `POST /api/*` and managed bot rules.
7. Keep `AGENCY_CORE_API_MODE=disabled` until the Hetzner API is live; forms then return a recoverable 503 rather than losing data silently.

### Demonstrating under `/agency` on All the Glory

Build with `NEXT_BASE_PATH=/agency` and route `alltheglory.co.za/agency/*` to this Worker. All links, assets and form endpoints follow the base path; moving to an independent domain later is a configuration change.

## Hetzner (Phase 2)

1. Provision the private API host and PostgreSQL in an EU region; restrict PostgreSQL to the private network.
2. Create two roles: the API role (no `BYPASSRLS`) and a narrow auth role for cross-tenant membership lookup.
3. Apply `db/agency-postgres/0001_core_schema.sql` after review; record migrations in version control.
4. Configure encrypted daily backups to separate storage and schedule restore drills.
5. Expose the API only to Cloudflare (mTLS or Cloudflare Tunnel) and verify the HMAC signature and timestamp on every request.
6. Switch the Worker to `AGENCY_CORE_API_MODE=http`.

## Rollback

Workers keep previous versions: `npx wrangler rollback`. Database migrations must ship with tested down-migrations or a restore plan.

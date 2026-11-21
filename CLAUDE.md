# All The Glory - working notes for Claude

## Deploying: Claude does it, never Daniel
- Daniel does not run Terminal commands. Never hand him a command to deploy, build or commit.
- The site (alltheglory.co.za) is a Cloudflare Worker (`allthegloryclaude`, Next.js via OpenNext).
  Cloudflare Workers Builds deploys it automatically on every push to GitHub
  `darrensmith849/allthegloryclaude`, branch `cloudflare-migration`.
- Daniel's Mac folder (~/allthegloryclaude) can lag behind GitHub. Always start from the branch head
  on GitHub, bring the changed files across, check nothing upstream conflicts, then push. Never
  deploy by hand with wrangler from the Mac copy - that can put older code live.
- So after every change: typecheck (`node_modules/.bin/tsc --noEmit -p .`), commit with a clear
  message, push to `cloudflare-migration`, then confirm it is live (fetch a new hashed chunk under
  https://alltheglory.co.za/_next/static/chunks/... or check the page) and tell Daniel it's live.
- If pushing is blocked (no repo access in the session), say exactly what's blocked and what one
  approval would fix it - don't fall back to giving him Terminal steps.
- The build needs `--dangerouslyUseUnsupportedNextVersion` until Next.js is upgraded past 15 -
  already in package.json's `deploy:cloudflare` script.

## Money page (/dashboard/money)
- Code: src/app/dashboard/money/page.tsx, src/components/dashboard/money-*.tsx, src/lib/dashboard/money.ts.
- Daniel: salary $2,000/month + $200 fuel allowance (Fuel budget line is the allowance). Paid weekly
  by Doctor Chando. He now spends mainly cash.
- Budget lines, savings, shopping list and every entry are saved in the dashboard state (D1), not in code.
- Balances: a typed-in balance ("set") holds what was logged before it; anything logged or changed
  after it still moves it (entry.changes). Keep that rule.
- Keep it simple and clean on a phone - Daniel finds busy screens "too much".

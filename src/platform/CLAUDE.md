# Claude Build Contract — Africa Music Platform

Read `docs/agency/MASTER_PLAN.md` in full before changing any file. Treat it as the authoritative product, business, design and architecture specification.

## Non-negotiable rules

1. Build a new, independent Africa-first music business and platform. Do not reduce it to a single agency landing page.
2. Use the premium editorial quality of All the Glory as the design benchmark, but create a distinct brand and visual identity.
3. `Ngoma` is a working name only. Put all brand-controlled text, contact information and theme values in central configuration.
4. Do not publicly claim that Manuchie, Gemma Griffiths, Jah Prayzah, Ruadhri Cushnan, Simba Moyo, Arts Capital or any other person or organisation is represented, partnered, endorsed or available until written approval is recorded.
5. Sample profiles must be clearly labelled, excluded from search indexing and impossible to mistake for real talent.
6. Never request access to browser tabs, browser windows, browser profiles or browsing history.
7. Never hard-code personal email addresses, WhatsApp numbers, passwords, API keys or recipient addresses. Use validated environment variables.
8. Never place secrets in the repository or client bundles.
9. Preserve `main`. Work on a feature branch and commit in coherent, reviewable stages.
10. Do not deploy, migrate production data, create paid services or configure real payment/email credentials without explicit owner approval.

## Immediate objective

Build Phase 1 from `docs/agency/MASTER_PLAN.md`:

- a complete premium public website;
- realistic, non-sensitive demonstrations of the company, artist, client and partner dashboards;
- working enquiry and roster-application flows against development services;
- a production-ready architectural foundation for later authenticated multi-tenant functionality.

The first version must be visually complete on 390, 768, 1024 and 1440 px widths. It must not present unfinished placeholders as real people or real partnerships.

## Required working method

1. Inventory the repository and deployment environment.
2. Write a short implementation plan against the actual folders before coding.
3. Establish tokens, typography, layout primitives and reusable components first.
4. Implement the public experience and dashboard demonstrations as one coherent design system.
5. Add tests for critical forms, permission boundaries and calculations.
6. Run type checking, build, accessibility checks and responsive QA.
7. Document every environment variable, migration and deployment step.
8. Return the changed-file list, test results, remaining decisions and exact items requiring credentials.

## Quality bar

- Premium, restrained and editorial—not a generic SaaS template.
- Africa-first without stereotypes or decorative clichés.
- Excellent typography, spacing and alignment.
- Fast initial load and progressive media loading.
- Keyboard accessible, reduced-motion safe and screen-reader friendly.
- No horizontal overflow or clipped controls.
- No fabricated credits, testimonials, partners, prices or availability.
- No duplicated per-artist codebases; all artist workspaces must derive from the same multi-tenant system.


## Where it lives

The platform is mounted at `/agency` inside the All the Glory app. Routes are in `src/app/agency`, everything else in `src/platform`. See `docs/agency/README.md`. Do not touch the album site outside the documented integration points.

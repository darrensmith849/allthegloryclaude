# Master Plan — Africa-First Music Business and Platform

## 1. Vision

Create a Zimbabwean-founded, Africa-first global music company that connects talented musicians, producers, engineers, writers, vocalists and other creatives with paid work, professional infrastructure and international collaborators.

The company exists to widen access rather than hoard relationships. Its purpose is to make African talent easier to discover, contract, manage, protect, pay and grow.

Working positioning:

> Africa's sound, connected to the world.

The existing prototype line, `Africa's sound, booked by the world`, may be tested as supporting campaign copy. `Ngoma` is a working name, not an approved final brand.

## 2. Strategic network

The founder has valuable relationships across Zimbabwean and international music, including possible access to established artists, producers and engineers. These contacts are a private strategic network until each person explicitly approves public association.

Never present a person as rostered, represented, bookable, endorsed or partnered based only on a relationship or conversation.

Potential collaborators mentioned during discovery include Manuchie, Gemma Griffiths, Jah Prayzah, Ruadhri Cushnan, Simba Moyo and other Zimbabwean and international professionals. They are not public claims.

## 3. Business model

The platform supports five connected businesses:

### 3.1 Production house

- Music production and arrangement
- Songwriting and composition
- Vocal production
- Recording, mixing and mastering
- Remote session recording
- Musical direction
- Release-ready deliverables and stems

### 3.2 Talent and session network

- Producers, engineers, writers, musicians and vocalists
- Searchable verified profiles
- Audio/video samples
- Availability, turnaround and pricing bands
- Remote international delivery
- Quality assurance before client delivery

### 3.3 Agency and managed projects

- Brief intake and creative matching
- Quotes and project scopes
- Contracting and split sheets
- Milestones, revisions and approvals
- Client invoicing
- Company commission
- Transparent artist payout statements
- Dispute and change-request handling

### 3.4 Artist digital studio

- Premium artist websites
- Electronic press kits
- Release landing pages
- Branding and digital assets
- Analytics and campaign tracking
- Hosting and ongoing support

Commercial incentive examples to validate before launch:

- qualifying production spend may include a starter website;
- higher-value packages may include an electronic press kit or release campaign;
- hosting, maintenance and analytics create recurring revenue.

Do not publish thresholds or prices until approved.

### 3.5 Artist business infrastructure

- Professional profiles and portfolios
- Opportunities and bookings
- Contracts and documentation
- Invoicing and payout records
- Earnings visibility
- Rights and split-sheet records
- CRM and contact history
- Business-readiness and training records
- Funding and support referrals

## 4. Arts Capital partnership vision

Arts Capital is a potential strategic partner, not a confirmed partner.

Its public mission—advocacy, holistic wellness, business support, sustainable opportunities and an alternative economy for artists—aligns strongly with this platform.

Proposed division of value:

| Platform company | Arts Capital |
| --- | --- |
| Commercial opportunities | Artist advocacy |
| Production and project delivery | Holistic wellness |
| Technology and dashboards | Member-support network |
| Contracts, invoices and payouts | Business support and training |
| International talent matching | Professional-service referrals |
| Artist websites and analytics | Membership and collective impact |

Possible joint programme: **Artist Business Passport**

- verified professional profile;
- digital portfolio and press kit;
- contracts, rights and earnings history;
- availability and skills directory;
- training and funding-readiness records;
- membership and support referrals;
- opportunity matching;
- analytics and impact reporting.

Possible platform module:

- membership referral/status;
- benefits and programme directory;
- legal, wellness and financial-professional referrals;
- training and events;
- opportunity and funding notices;
- support-request status;
- consent and document history;
- partner impact reporting.

Sensitive medical, psychological, legal and financial details must never appear in the general company dashboard. Only authorised workflow status should be shared.

Before public integration, confirm the correct Arts Capital contracting entity, active services, eligibility across South Africa/Zimbabwe/Africa, regulatory providers, data responsibilities, branding permissions and commercial terms.

## 5. Contracting and money flow

Preferred starting model: the company manages the project and client relationship.

1. Client submits a brief.
2. Company scopes and prices the work.
3. Company contracts with the client.
4. Company assigns approved creatives.
5. Client pays deposit and milestones to the company.
6. Creatives deliver through the platform.
7. Company performs quality control and obtains approvals.
8. Company records commission and approved project costs.
9. Creatives receive transparent payout statements.
10. Company pays creatives on the contracted schedule.

Commission must be configurable per contract rather than hard-coded. Potential models include introduction fees, booking commission, managed-project margin, fixed production margins and separately contracted success fees.

The artist dashboard may prepare a payment request or draft invoice, but only the authorised legal entity should issue the official client invoice. Final tax, VAT, foreign-exchange, withholding, KYC and cross-border-payment processes require accountant and legal validation.

## 6. Product surfaces

### 6.1 Public website

Required primary pages/sections:

- Home
- About and mission
- Roster discovery
- Talent profile
- Services and packages
- How projects work
- Artist Business Suite
- Website and digital-launch services
- Opportunity network
- Partner programme
- Arts Capital collaboration vision, clearly marked proposed until confirmed
- For clients
- For creatives
- Contact and project brief
- Roster application
- Privacy, cookies and terms

The first release may live at `/agency` on All the Glory for demonstration, but the architecture and branding must support migration to an independent domain without rewriting the product.

### 6.2 Company master dashboard

- Leads and enquiries
- Clients and contacts
- Talent directory and verification
- Opportunities and matching
- Projects, tasks and milestones
- Contracts and signatures
- Quotes and invoices
- Payments, commissions, costs and payouts
- Documents and deliverables
- Marketing consent and suppression
- Website and campaign analytics
- Partner referrals and impact
- Staff permissions and audit logs
- Settings and configuration

### 6.3 Artist workspace

Every artist gets a branded workspace generated from one shared multi-tenant application.

- Profile and portfolio
- Media and credits
- Opportunities and applications
- Bookings and availability
- Project briefs, tasks and deadlines
- Contracts and split sheets
- File submissions and approvals
- Earnings, statements and payouts
- Documents and compliance status
- Enquiries and contacts
- Website and campaign analytics
- Training and partner support

### 6.4 Client portal

- Submit and refine a brief
- Review quote and scope
- Sign agreements
- Pay deposits and milestones
- Upload reference material
- Review drafts
- Request contracted revisions
- Approve milestones and delivery
- Download final files
- View invoices, receipts and communications

### 6.5 Partner workspace

For authorised organisations such as a future Arts Capital partnership:

- referred artists;
- programme and membership status;
- authorised support workflow status;
- opportunities and training;
- aggregated employment and income impact;
- consent-controlled reporting;
- no unnecessary access to commercial or sensitive records.

### 6.6 Public demonstrations

Before real authentication is released, provide clearly labelled, non-sensitive demonstration dashboards for company, artist, client and partner views. Use invented data and visibly identify it as demonstration content.

## 7. Existing Claude prototype: retain, refactor, expand

Useful elements to retain:

- central brand configuration;
- filterable roster;
- shareable talent-profile deep links;
- one shared audio player;
- booking pre-selection;
- booking and roster-application modes;
- brief, match, create and deliver narrative;
- remote-first workflow;
- rights and split-sheet emphasis;
- fixed-quote language;
- sample-profile/noindex safeguards;
- accessible controls and reduced-motion handling.

Required corrections:

- remove hard-coded personal email/WhatsApp data;
- do not use the All the Glory sender identity for the independent company;
- add Turnstile, rate limiting, origin checks and idempotency;
- record privacy-policy version and explicit marketing consent;
- create contact deduplication and audit history;
- do not rely on email as the only notification path;
- replace flat `agency_briefs` storage with the domain model below;
- replace `img` usage with optimised responsive media components;
- do not publish fictional people, credits, availability or prices;
- do not treat a successful database write with failed email as full operational completion without internal alerting;
- support lifecycle states beyond `new`;
- test dialog focus, browser history and mobile navigation;
- separate public website code from authenticated platform bundles.

## 8. Domain model

Use UUID/ULID identifiers and immutable audit events where appropriate.

Core entities:

- organisations/tenants
- users
- memberships
- roles and permissions
- artists/creatives
- artist profiles
- skills, roles and genres
- media assets and credits
- availability
- clients and contacts
- consent records and suppression
- leads and enquiries
- opportunities
- matches/applications
- projects
- project participants
- tasks and milestones
- comments and notifications
- contracts and contract versions
- split sheets and rights shares
- quotes and quote versions
- invoices and invoice lines
- payments and refunds
- commissions
- expenses
- payout statements and payouts
- documents and signatures
- file assets and deliverables
- website projects
- analytics events and aggregates
- partner organisations
- referrals and support cases
- tags
- audit events

Every tenant-owned record must include and enforce a tenant/organisation boundary. Never rely only on client-side filtering.

## 9. Permissions

Minimum roles:

- platform owner
- company administrator
- operations/project manager
- finance operator
- roster/talent manager
- artist/creative
- client
- partner operator
- read-only auditor

Enforce permissions server-side. Sensitive finance, identity and support information requires narrower scopes than general project access.

## 10. Technical architecture

### Cloudflare responsibilities

- DNS, CDN and TLS
- WAF and rate limiting
- public Next.js-compatible front end and edge routes
- Turnstile
- R2 object storage for approved media and documents
- image delivery and caching
- edge analytics/event intake where appropriate

### Hetzner responsibilities

- private API service for core business operations
- PostgreSQL as the system of record
- background workers for email, document generation, audio processing and scheduled tasks
- encrypted backups and restore testing
- operational monitoring

### Boundary

The browser never connects directly to PostgreSQL. Cloudflare calls authenticated HTTPS APIs. Do not create two competing sources of truth between D1 and PostgreSQL. If the existing All the Glory D1 form is used for an early demonstration, document it as temporary and plan an explicit migration.

### Files

Use private R2 buckets and signed URLs for contracts, identity records, client references and unreleased music. Public portfolio media may use public or cached delivery only after artist approval.

### Email

Use a transactional provider with verified sending domains, DKIM, SPF and DMARC. Queue critical messages and record delivery status. Recipients, sender identities and provider keys come from environment configuration.

### Payments

Abstract payment providers behind a service interface. Do not store card details. Record provider transaction IDs, currency, fees, exchange rates and reconciliation status.

## 11. Security and privacy baseline

- Secure authentication and server-side sessions
- Optional MFA for administrators and finance roles
- Password hashing through a proven library or managed identity
- HTTP-only, Secure, SameSite cookies
- CSRF protection where applicable
- Tenant isolation tests
- Least-privilege role permissions
- Rate limiting and abuse detection
- Turnstile on public forms
- Encryption in transit and at rest
- Signed upload/download URLs
- Virus scanning workflow for uploads
- Audit logging for sensitive changes
- Secret rotation and environment separation
- Daily backups and restore drills
- Data export, correction, deletion and retention controls
- Explicit, unticked marketing consent
- Transactional enquiry records kept separate from marketing permission
- No cross-site tracking or pre-submission capture of typed form content

## 12. Analytics

First-party, privacy-conscious analytics should track:

- page and section views;
- anonymous sessions;
- broad source/referrer and campaign tags;
- talent-profile views;
- approved media plays;
- brief starts and successful submissions;
- applications;
- outbound platform clicks;
- opportunity and project funnel conversion;
- website-package conversion;
- jobs, earnings and payout impact;
- partner-programme outcomes.

Do not count staff/admin activity as public traffic. Do not collect precise location, passwords, private messages or unsent form content.

## 13. CRM and marketing

- Deduplicate contacts by normalised email and approved secondary identifiers.
- Store the lawful purpose and source for each contact.
- Marketing consent must be separate, explicit and unticked.
- Store consent timestamp, wording version, source and withdrawal.
- Provide suppression/unsubscribe controls.
- Do not automatically market to anyone who merely submits an enquiry.
- Export only consent-appropriate audiences.

## 14. Brand and design direction

Use All the Glory as the quality benchmark:

- warm, premium editorial composition;
- refined serif and clean sans-serif pairing;
- disciplined spacing and narrow readable text measures;
- subtle motion and tactile cards;
- strong hierarchy without clutter;
- high-quality photography and media presentation;
- an intentional, premium dashboard rather than a generic admin template.

Create a distinct Africa-music identity. Avoid flags, map silhouettes, generic sound waves, musical-note clichés and stereotypical patterns unless a future brand process explicitly approves them.

The system should support theme tokens so artist workspaces can be branded without forking code.

## 15. Performance and accessibility

- Responsive images with intrinsic dimensions, modern formats, `srcset` and `sizes`
- Priority loading only for critical media
- Lazy-load below-the-fold images and audio
- No autoplay
- Minimal initial JavaScript
- Separate public and authenticated bundles
- Cached immutable assets
- Optimised/self-hosted fonts
- Semantic headings and landmarks
- Keyboard access and visible focus
- Accessible dialogs, forms, errors, tables and charts
- Reduced-motion support
- Touch targets at least 44 px where practical
- No horizontal overflow at 390, 768, 1024 and 1440 px

Performance targets for the public site:

- Lighthouse Performance 90+
- Accessibility 95+
- Best Practices 95+
- SEO 95+

Do not remove content or functionality to manipulate scores.

## 16. Phase plan

### Phase 1 — premium website and demonstrator

- brand foundation and design system;
- complete public website;
- roster and talent-profile experience;
- enquiry and application flows;
- service and website-package explanation;
- company, artist, client and partner dashboard demonstrations;
- development data only;
- responsive, accessible and performance tested.

### Phase 2 — operational MVP

- authentication and tenant isolation;
- company and artist dashboards;
- real roster onboarding;
- CRM, enquiries and opportunities;
- projects, files and communications;
- quotes, contracts and invoices;
- manual payment and payout recording;
- analytics and audit logging.

### Phase 3 — commercial automation

- payment providers and reconciliation;
- electronic signatures;
- automated payout workflows;
- website provisioning;
- partner/referral workflows;
- advanced opportunity matching;
- reporting and impact exports.

### Phase 4 — continental platform

- multiple countries and currencies;
- localisation;
- verified organisations and talent;
- scalable partner network;
- rights and royalty integrations;
- funding and programme marketplace;
- API and approved integrations.

## 17. Phase 1 acceptance criteria

- All required public sections are implemented.
- Design is visibly premium and coherent.
- Dashboard demonstrations communicate the entire platform clearly.
- Sample data is clearly labelled and noindexed where appropriate.
- Forms validate, resist basic abuse, preserve user input on recoverable failure and record development submissions.
- No personal secrets or hard-coded production addresses exist.
- Routes work at 390, 768, 1024 and 1440 px.
- Keyboard navigation and reduced motion are verified.
- No console errors or broken links.
- Type check and production build pass.
- Environment variables and deployment steps are documented.
- Real people and partnership claims remain unpublished until approved.

## 18. Decisions intentionally left configurable

- Final company name and logo
- Final domain
- Public launch roster
- Approved public partners
- Contact addresses and WhatsApp number
- Service prices and commission rates
- Contracting legal entity
- Zimbabwe/South Africa operating structure
- Payment and email providers
- Arts Capital agreement and eligible territories
- Final website incentive thresholds

These unknowns must not block building the configurable front-end and development platform foundation.


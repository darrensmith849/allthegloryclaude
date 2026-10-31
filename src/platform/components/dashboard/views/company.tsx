import type { JSX } from "react";
import { approvedRoster, commercialApprovals, partnerAssociations, partnerDisplayName } from "@/platform/config/approvals";
import { brand } from "@/platform/config/brand";
import { enquiryStates } from "@/platform/domain/lifecycle";
import { formatMoney } from "@/platform/domain/money";
import { permissions, roleLabels, roleMatrix, roles } from "@/platform/domain/permissions";
import * as d from "@/platform/demo-data/dashboards/company";
import { DEMO_NOTE, fmt, fmtUsdUnits } from "@/platform/demo-data/dashboards/shared";
import {
  BarChart,
  Board,
  Callout,
  DashGrid,
  DataTable,
  DemoButton,
  HBars,
  KeyValues,
  LineChart,
  Panel,
  Progress,
  StatGrid,
  StatusPill,
  Timeline,
} from "../primitives";

const partnerName = partnerDisplayName(partnerAssociations.artsSupportPartner, "Arts-support partner (proposed)");
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;

export function CompanyOverview() {
  return (
    <>
      <StatGrid
        label="Key figures"
        stats={[
          { label: "Open enquiries", value: d.companyStats.openEnquiries, note: "5 new this week", trend: "up" },
          { label: "Active projects", value: d.companyStats.activeProjects, note: "1 needs attention" },
          { label: "Awaiting signature", value: d.companyStats.awaitingSignature, note: "Contracts and split sheets" },
          { label: "Receivables", value: fmt(d.receivables), note: "1 invoice overdue", trend: "down", accent: true },
          { label: "Verified creatives", value: d.companyStats.verifiedCreatives, note: `${d.companyStats.pendingVerification} in verification` },
        ]}
      />
      <DashGrid>
        <Panel title="Cash in and out" description={`Client receipts against creative payouts, last six months. ${DEMO_NOTE}`} span={8}>
          <BarChart
            label="Monthly client receipts and creative payouts in USD"
            categories={d.cashflow.categories}
            series={[
              { name: "Client receipts", values: d.cashflow.receipts },
              { name: "Creative payouts", values: d.cashflow.payouts },
            ]}
            format={fmtUsdUnits}
          />
        </Panel>
        <Panel title="Enquiry pipeline" description="Current quarter, by lifecycle state." span={4}>
          <HBars label="Enquiries by state" items={d.enquiryFunnel} />
        </Panel>
        <Panel title="Needs attention" span={6}>
          <Timeline
            label="Items needing attention"
            items={[
              { date: "Today", title: "New enquiry ENQ-7K2QM9 is unassigned", detail: "Example Records (fictional) · production and mixing", status: "New" },
              { date: "Overdue", title: "INV-0316 is 4 days overdue", detail: "Coastline Games (fictional) · reminder queued", status: "Overdue" },
              { date: "04 Nov", title: "Split sheet CTR-0142-S needs 1 more signature", status: "Partially signed" },
              { date: "06 Nov", title: "PRJ-0137 client requested changes", detail: "Revision round 2 of 2", status: "Changes requested" },
            ]}
          />
        </Panel>
        <Panel title="Active projects" span={6}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {d.projects
              .filter((p) => p.health !== "Complete")
              .map((p) => (
                <Progress key={p.ref} label={`${p.ref} · ${p.name}`} value={p.milestones[0]} max={p.milestones[1]} detail={`${p.milestones[0]} of ${p.milestones[1]} milestones`} />
              ))}
          </div>
        </Panel>
      </DashGrid>
    </>
  );
}

export function CompanyPipeline() {
  return (
    <DashGrid>
      <Panel title="Enquiries" description={`Lifecycle: ${enquiryStates.join(" → ")}. Transitions are validated on the server; spam never reaches a person.`} actions={<DemoButton>Assign owner</DemoButton>}>
        <DataTable
          caption="Recent enquiries"
          rowKey={(r) => r.ref}
          rows={d.enquiries}
          minWidth={860}
          columns={[
            { key: "ref", header: "Reference", rowHeader: true, nowrap: true, render: (r) => r.ref },
            { key: "contact", header: "Contact", render: (r) => <>{r.contact}<span className="cell-sub">{r.organisation}</span></> },
            { key: "services", header: "Services", render: (r) => r.services },
            { key: "budget", header: "Client budget", nowrap: true, render: (r) => r.budget },
            { key: "state", header: "State", render: (r) => <StatusPill status={r.state} /> },
            { key: "owner", header: "Owner", render: (r) => r.owner },
            { key: "received", header: "Received", nowrap: true, render: (r) => r.received },
          ]}
        />
      </Panel>
      <Panel title="Opportunities" description="Open work from clients and partners, matched against verified profiles." span={7}>
        <DataTable
          caption="Open opportunities"
          rowKey={(r) => r.ref}
          rows={d.opportunities}
          minWidth={560}
          columns={[
            { key: "title", header: "Opportunity", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref} · {r.kind}</span></> },
            { key: "matches", header: "Matches", numeric: true, render: (r) => r.matches },
            { key: "short", header: "Shortlisted", numeric: true, render: (r) => r.shortlisted },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Panel>
      <Panel title="Matching — OPP-0418" description="Suggested by role, genre, working mode and verification. A person always makes the final call." span={5}>
        <div style={{ display: "grid", gap: "1.1rem" }}>
          {d.matchSuggestions.map((m) => (
            <div key={m.creative} style={{ display: "grid", gap: "0.4rem" }}>
              <Progress label={m.creative} value={m.fit} max={100} detail={`${m.fit}% fit`} />
              <span className="cell-sub">{m.reasons}</span>
              <span>
                <StatusPill status={m.status} />
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </DashGrid>
  );
}

export function CompanyClients() {
  return (
    <>
      <StatGrid
        label="Contact and consent figures"
        stats={[
          { label: "Contacts", value: d.consentSummary.contacts },
          { label: "Marketable (opted in)", value: d.consentSummary.marketable, accent: true, note: "Explicit, unticked-by-default consent" },
          { label: "Transactional only", value: d.consentSummary.transactionalOnly, note: "Never marketed to" },
          { label: "Suppressed", value: d.consentSummary.suppressed },
          { label: "Withdrawn", value: d.consentSummary.withdrawn },
        ]}
      />
      <DashGrid>
        <Panel title="Clients" actions={<DemoButton>Export (consent-appropriate)</DemoButton>}>
          <DataTable
            caption="Client organisations"
            rowKey={(r) => r.name}
            rows={d.clients}
            minWidth={760}
            columns={[
              { key: "name", header: "Client", rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.type}</span></> },
              { key: "country", header: "Country", render: (r) => r.country },
              { key: "projects", header: "Projects", numeric: true, render: (r) => r.projects },
              { key: "contacts", header: "Contacts", numeric: true, render: (r) => r.contacts },
              { key: "source", header: "Source", render: (r) => r.source },
              { key: "basis", header: "Lawful purpose", render: (r) => r.basis },
            ]}
          />
        </Panel>
        <Panel title="Consent records" description="Each record stores purpose, wording version, source and timestamp. Withdrawal suppresses marketing immediately." span={8}>
          <DataTable
            caption="Latest consent records"
            rowKey={(r) => `${r.contact}-${r.purpose}-${r.recorded}`}
            rows={d.consentRecords}
            minWidth={720}
            columns={[
              { key: "contact", header: "Contact", rowHeader: true, render: (r) => r.contact },
              { key: "purpose", header: "Purpose", render: (r) => r.purpose },
              { key: "version", header: "Wording", nowrap: true, render: (r) => r.version },
              { key: "source", header: "Source", render: (r) => r.source },
              { key: "recorded", header: "Recorded", nowrap: true, render: (r) => r.recorded },
              { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Deduplication" description="Contacts merge on normalised email. Anything less certain goes to a person." span={4}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {d.duplicateCandidates.map((c) => (
              <KeyValues key={c.primary} items={[["Primary", c.primary], ["Candidate", c.duplicate], ["Rule", c.rule], ["Outcome", <StatusPill key="s" status={c.action} tone={c.action.startsWith("Merged") ? "good" : "warn"} />]]} />
            ))}
          </div>
        </Panel>
      </DashGrid>
    </>
  );
}

export function CompanyTalent() {
  return (
    <DashGrid>
      <Panel title="Verification queue" description="Identity, portfolio, rights evidence and signed engagement terms come before any public listing.">
        <Board label="Verification stages" columns={d.verificationBoard} />
      </Panel>
      <Panel title="Talent directory" actions={<DemoButton>Invite creative</DemoButton>}>
        <DataTable
          caption="Creatives (sample profiles)"
          rowKey={(r) => r.name}
          rows={d.talentDirectory}
          minWidth={760}
          columns={[
            { key: "name", header: "Creative", rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.roles}</span></> },
            { key: "country", header: "Based in", render: (r) => r.country },
            { key: "ver", header: "Verification", render: (r) => <StatusPill status={r.verification} /> },
            { key: "rights", header: "Rights record", render: (r) => <StatusPill status={r.rights} /> },
            { key: "projects", header: "Projects", numeric: true, render: (r) => r.projects },
          ]}
        />
      </Panel>
      <Panel title="Public roster status" span={6} tone="rings">
        <p className="figure-big">{approvedRoster.length}</p>
        <p className="muted">
          creatives approved for public listing. Until each creative signs a public-listing approval, the website shows only fictional sample profiles.
        </p>
      </Panel>
      <Panel title="Verification standard" span={6}>
        <KeyValues
          items={[
            ["Identity", "Checked privately; documents never shown in dashboards"],
            ["Portfolio", "At least one work the creative has the right to share"],
            ["Credits", "Evidence required (split sheet, contract or label confirmation)"],
            ["Terms", "Creative engagement terms signed"],
            ["Review", "Annual re-confirmation of rights and availability"],
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

export function CompanyProjects() {
  return (
    <DashGrid>
      <Panel title="Projects">
        <DataTable
          caption="Active and recent projects"
          rowKey={(r) => r.ref}
          rows={d.projects}
          minWidth={820}
          columns={[
            { key: "name", header: "Project", rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.ref}</span></> },
            { key: "client", header: "Client", render: (r) => r.client },
            { key: "stage", header: "Stage", render: (r) => r.stage },
            { key: "ms", header: "Milestones", numeric: true, render: (r) => `${r.milestones[0]} / ${r.milestones[1]}` },
            { key: "due", header: "Next due", nowrap: true, render: (r) => r.due },
            { key: "health", header: "Status", render: (r) => <StatusPill status={r.health} /> },
          ]}
        />
      </Panel>
      <Panel title="Tasks" description="Across all active projects.">
        <Board label="Task board" columns={d.taskBoard} />
      </Panel>
      <Panel title="PRJ-0142 milestones" span={5}>
        <Timeline label="Milestones for PRJ-0142" items={d.milestones} />
      </Panel>
      <Panel title="Documents and deliverables" description="Private R2 storage, signed links, virus scanning before anyone can download." span={7}>
        <DataTable
          caption="Latest files"
          rowKey={(r) => r.file}
          rows={d.deliverables}
          minWidth={640}
          columns={[
            { key: "file", header: "File", rowHeader: true, render: (r) => <>{r.file}<span className="cell-sub">{r.visibility}</span></> },
            { key: "version", header: "Version", render: (r) => r.version },
            { key: "scan", header: "Scan", render: (r) => <StatusPill status={r.scan} /> },
            { key: "approval", header: "Approval", render: (r) => (r.approval === "—" ? "—" : <StatusPill status={r.approval} />) },
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

export function CompanyContracts() {
  return (
    <DashGrid>
      <Panel title="Contracts and signatures" actions={<DemoButton>New from template</DemoButton>}>
        <DataTable
          caption="Contracts"
          rowKey={(r) => r.ref}
          rows={d.contracts}
          minWidth={820}
          columns={[
            { key: "title", header: "Agreement", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref}</span></> },
            { key: "parties", header: "Parties", render: (r) => r.parties },
            { key: "project", header: "Project", nowrap: true, render: (r) => r.project },
            { key: "version", header: "Version", render: (r) => r.version },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "date", header: "Date", nowrap: true, render: (r) => r.date },
          ]}
        />
      </Panel>
      <Panel title="Split sheet — PRJ-0142 track 3" description="Validated by the same rule the API enforces: every share is a whole number of basis points and the total is exactly 100%." span={7}>
        <DataTable
          caption="Composition shares"
          rowKey={(r) => r.party}
          rows={d.splitSheetTrack3}
          minWidth={420}
          columns={[
            { key: "party", header: "Party", rowHeader: true, render: (r) => r.party },
            { key: "share", header: "Share", numeric: true, render: (r) => pct(r.bps) },
          ]}
          footer={
            <tr>
              <th scope="row">Total</th>
              <td className="num">{pct(d.splitSheetTrack3.reduce((a, s) => a + s.bps, 0))}</td>
            </tr>
          }
        />
        <Callout icon={d.splitSheetTrack3Check.ok ? "check" : "alert"} tone={d.splitSheetTrack3Check.ok ? undefined : "warn"}>
          {d.splitSheetTrack3Check.ok ? <><strong>Valid.</strong> Shares total 100%. 2 of 3 signatures received.</> : <><strong>Invalid.</strong> {d.splitSheetTrack3Check.reason}</>}
        </Callout>
      </Panel>
      <Panel title="Signature status" span={5}>
        <HBars
          label="Contracts by status"
          items={[
            { label: "Signed", value: d.contracts.filter((c) => c.status === "Signed").length },
            { label: "Partially signed", value: d.contracts.filter((c) => c.status === "Partially signed").length },
            { label: "Awaiting signature", value: d.contracts.filter((c) => c.status === "Awaiting signature").length },
            { label: "Draft", value: d.contracts.filter((c) => c.status === "Draft").length },
          ]}
        />
        <Callout>Electronic signatures arrive in Phase 3. Until then, signed copies are uploaded and verified by staff.</Callout>
      </Panel>
    </DashGrid>
  );
}

export function CompanyFinance() {
  const s = d.settlementExample;
  return (
    <>
      <Callout>{DEMO_NOTE} Commission values are illustrative configurations, not published rates.</Callout>
      <div style={{ height: "1.25rem" }} />
      <DashGrid>
        <Panel title="Payout statement — PRJ-0142" description="Calculated by settleProject(): receipts minus approved costs, commission per contract, the remainder allocated by agreed shares without losing a cent." span={7} tone="accent">
          <DataTable
            caption="Settlement"
            rowKey={(r) => r.label}
            minWidth={420}
            rows={[
              { label: "Client receipts (deposit, milestone, final)", value: fmt(s.grossReceipts) },
              { label: "Approved project costs", value: `− ${fmt(s.approvedCosts)}` },
              { label: "Net before commission", value: fmt(s.netBeforeCommission) },
              { label: `Company commission (${pct((d.settlementInput.commission as { bps: number }).bps)} of net, per contract)`, value: `− ${fmt(s.commission)}` },
              { label: "Creative pool", value: fmt(s.creativePool) },
            ]}
            columns={[
              { key: "l", header: "Line", rowHeader: true, render: (r) => r.label },
              { key: "v", header: "Amount", numeric: true, render: (r) => r.value },
            ]}
          />
          <DataTable
            caption="Creative payouts"
            rowKey={(r) => r.creativeId}
            rows={s.payouts}
            minWidth={420}
            columns={[
              { key: "c", header: "Creative", rowHeader: true, render: (r) => r.creativeId },
              { key: "w", header: "Share", numeric: true, render: (r) => `${d.settlementInput.participants.find((p) => p.creativeId === r.creativeId)?.weight ?? 0}%` },
              { key: "a", header: "Payout", numeric: true, render: (r) => fmt(r.amount) },
            ]}
            footer={
              <tr>
                <th scope="row">Balances to receipts</th>
                <td />
                <td className="num">{fmt(s.grossReceipts)}</td>
              </tr>
            }
          />
        </Panel>
        <Panel title="Commission per contract" description="Configured on each contract — never hard-coded." span={5}>
          <ul className="item-list" role="list">
            {d.commissionConfigs.map((c) => (
              <li key={c.contract}>
                <div className="item-list__main">
                  <strong>{c.contract}</strong>
                  <span>{c.label}</span>
                </div>
                <span className="pill pill--accent">{c.model.kind}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Quotes" span={6}>
          <DataTable
            caption="Recent quotes"
            rowKey={(r) => r.ref}
            rows={d.quotes}
            minWidth={430}
            columns={[
              { key: "ref", header: "Quote", rowHeader: true, render: (r) => <>{r.ref}<span className="cell-sub">{r.client}</span></> },
              { key: "v", header: "Version", render: (r) => r.version },
              { key: "amt", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Invoices" description="Issued only by the contracting legal entity." span={6}>
          <DataTable
            caption="Client invoices"
            rowKey={(r) => r.ref}
            rows={d.invoices}
            minWidth={430}
            columns={[
              { key: "ref", header: "Invoice", rowHeader: true, render: (r) => <>{r.ref}<span className="cell-sub">{r.client}</span></> },
              { key: "due", header: "Due", nowrap: true, render: (r) => r.due },
              { key: "amt", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Payments and reconciliation" description="Provider transaction IDs, currency, fees and exchange rates recorded for every payment. No card details are stored.">
          <DataTable
            caption="Payments received"
            rowKey={(r) => r.ref}
            rows={d.payments}
            minWidth={860}
            columns={[
              { key: "ref", header: "Payment", rowHeader: true, render: (r) => <>{r.ref}<span className="cell-sub">{r.provider}</span></> },
              { key: "pref", header: "Provider ref.", nowrap: true, render: (r) => r.providerRef },
              { key: "cur", header: "Currency", nowrap: true, render: (r) => r.currency },
              { key: "fx", header: "Exchange rate", render: (r) => r.fx },
              { key: "amt", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "fee", header: "Fee", numeric: true, render: (r) => fmt(r.fee) },
              { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Approved costs" span={6}>
          <DataTable
            caption="Project costs"
            rowKey={(r) => r.ref}
            rows={d.approvedCosts}
            minWidth={400}
            columns={[
              { key: "d", header: "Cost", rowHeader: true, render: (r) => <>{r.description}<span className="cell-sub">{r.ref} · {r.project}</span></> },
              { key: "a", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Payouts" description="Paid on the contracted schedule. MFA step-up required to approve." span={6} actions={<DemoButton variant="accent">Approve payouts</DemoButton>}>
          <DataTable
            caption="Payouts due and recent"
            rowKey={(r) => r.ref}
            rows={d.payoutsDue}
            minWidth={400}
            columns={[
              { key: "c", header: "Creative", rowHeader: true, render: (r) => <>{r.creative}<span className="cell-sub">{r.ref} · {r.schedule}</span></> },
              { key: "a", header: "Amount", numeric: true, render: (r) => formatMoney(r.amount, "en-GB") },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
      </DashGrid>
    </>
  );
}

export function CompanyAnalytics() {
  return (
    <>
      <StatGrid
        stats={[
          { label: "Sessions (12 weeks)", value: d.traffic.sessions.reduce((a, b) => a + b, 0).toLocaleString("en-GB"), note: "+79% vs. first week", trend: "up" },
          { label: "Profile views", value: d.traffic.profileViews.reduce((a, b) => a + b, 0).toLocaleString("en-GB") },
          { label: "Brief conversion", value: `${Math.round((d.funnel[1]!.value / d.funnel[0]!.value) * 100)}%`, note: "Started → submitted", accent: true },
          { label: "Win rate", value: `${Math.round((d.funnel[4]!.value / d.funnel[1]!.value) * 100)}%`, note: "Submitted → won" },
        ]}
      />
      <DashGrid>
        <Panel title="Public traffic" description="Anonymous sessions and talent-profile views by week." span={8}>
          <LineChart
            label="Weekly sessions and profile views"
            categories={d.traffic.categories}
            series={[
              { name: "Sessions", values: d.traffic.sessions },
              { name: "Profile views", values: d.traffic.profileViews },
            ]}
          />
        </Panel>
        <Panel title="Brief funnel" span={4}>
          <HBars label="Brief funnel" items={d.funnel} />
        </Panel>
        <Panel title="Top pages" span={6}>
          <HBars label="Top pages by views" items={d.topPages} />
        </Panel>
        <Panel title="Sources" description="Broad referrer categories and campaign tags only." span={6}>
          <HBars label="Traffic sources, percent of sessions" items={d.sources} format={(n) => `${n}%`} />
        </Panel>
        <Panel title="What is measured — and what is not">
          <KeyValues
            items={[
              ["Collected", "Page and section views, anonymous per-tab sessions, broad source, profile views, approved media plays, brief and application starts and submissions"],
              ["Never collected", "Cookies, precise location, passwords, private messages, unsent form content, cross-site identifiers"],
              ["Excluded", "Staff and admin sessions — authenticated bundles never load the public tracker"],
              ["Respected", "Global Privacy Control and Do Not Track"],
            ]}
          />
        </Panel>
      </DashGrid>
    </>
  );
}

export function CompanyPartners() {
  return (
    <DashGrid>
      <Panel title={partnerName} description="Proposed collaboration — not a confirmed partnership. The organisation is not named until written approval is recorded." span={12} tone="accent">
        <StatGrid
          stats={d.partnerReferralStatus.map((s, i) => ({ label: s.label, value: s.value, accent: i === 3 }))}
        />
      </Panel>
      <Panel title="Referral cohorts" description="Aggregated. Individual detail is visible to the partner only where the creative consented." span={8}>
        <DataTable
          caption="Referral outcomes by cohort"
          rowKey={(r) => r.cohort}
          rows={d.partnerReferralsTable}
          minWidth={680}
          columns={[
            { key: "c", header: "Cohort", rowHeader: true, render: (r) => r.cohort },
            { key: "r", header: "Referred", numeric: true, render: (r) => r.referred },
            { key: "o", header: "Onboarded", numeric: true, render: (r) => r.onboarded },
            { key: "v", header: "Verified", numeric: true, render: (r) => r.verified },
            { key: "b", header: "Booked", numeric: true, render: (r) => r.booked },
            { key: "cn", header: "Consent", render: (r) => r.consent },
          ]}
        />
      </Panel>
      <Panel title="Boundaries" span={4}>
        <KeyValues
          items={[
            ["Company sees", "Referral source, programme status, workflow status"],
            ["Company never sees", "Medical, psychological, legal or financial support details"],
            ["Partner sees", "Consented profiles and aggregates only"],
            ["Partner never sees", "Commercial terms, client data, other creatives"],
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

export function CompanyAdmin() {
  const visibleRoles = roles;
  return (
    <DashGrid>
      <Panel title="Staff" actions={<DemoButton>Invite staff member</DemoButton>}>
        <DataTable
          caption="Staff accounts"
          rowKey={(r) => r.email}
          rows={d.staff}
          minWidth={680}
          columns={[
            { key: "n", header: "Name", rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.email}</span></> },
            { key: "r", header: "Role", render: (r) => roleLabels[r.role] },
            { key: "m", header: "MFA", render: (r) => <StatusPill status={r.mfa} tone={r.mfa === "Enabled" ? "good" : "warn"} /> },
            { key: "l", header: "Last active", nowrap: true, render: (r) => r.lastActive },
          ]}
        />
      </Panel>
      <Panel title="Role permissions" description="Generated from the server-side permission matrix (src/domain/permissions.ts). Artists and clients are further limited to records they own; partners need consent.">
        <DataTable
          caption="Permissions by role"
          rowKey={(p) => p}
          rows={[...permissions]}
          minWidth={1080}
          columns={[
            { key: "perm", header: "Permission", rowHeader: true, nowrap: true, render: (p) => <code>{p}</code> },
            ...visibleRoles.map((role) => ({
              key: role,
              header: roleLabels[role].replace(" / ", "/"),
              render: (p: (typeof permissions)[number]) =>
                roleMatrix[role].includes(p) ? (
                  <span className="matrix-yes" aria-label="Allowed">
                    ✓
                  </span>
                ) : (
                  <span className="matrix-no" aria-label="Not allowed">
                    ·
                  </span>
                ),
            })),
          ]}
        />
      </Panel>
      <Panel title="Audit log" description="Append-only. Sensitive changes record the actor and step-up authentication." span={7}>
        <DataTable
          caption="Recent audit events"
          rowKey={(r) => `${r.at}-${r.action}`}
          rows={d.auditLog}
          minWidth={720}
          columns={[
            { key: "at", header: "When", nowrap: true, render: (r) => r.at },
            { key: "actor", header: "Actor", render: (r) => r.actor },
            { key: "action", header: "Action", rowHeader: true, render: (r) => <code>{r.action}</code> },
            { key: "entity", header: "Entity", render: (r) => <>{r.entity}<span className="cell-sub">{r.detail}</span></> },
          ]}
        />
      </Panel>
      <Panel title="Settings and approvals register" description="Brand and approvals come from configuration in the repository." span={5}>
        <KeyValues
          items={[
            ["Company name", `${brand.name} (${brand.nameStatus === "working-name" ? "working name" : "approved"})`],
            ["Contracting entity", brand.legalEntity ?? "To be confirmed"],
            ["Privacy notice version", brand.policyVersions.privacy],
            ["Marketing consent wording", brand.policyVersions.marketingConsent],
            ["Public roster approvals", `${approvedRoster.length} approved`],
            ["Arts-support partner", <StatusPill key="p" status={partnerAssociations.artsSupportPartner.status} tone="warn" />],
            ["Service prices published", commercialApprovals.servicePricesPublished ? "Yes" : "No — awaiting approval"],
            ["Commission rates published", commercialApprovals.commissionRatesPublished ? "Yes" : "No — awaiting approval"],
            ["Website incentive thresholds", commercialApprovals.websiteIncentiveThresholdsPublished ? "Published" : "Not published"],
            ["Submission back end", "Per environment — see docs/PHASE1_IMPLEMENTATION.md"],
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

export const companyViews: Record<string, () => JSX.Element> = {
  overview: CompanyOverview,
  pipeline: CompanyPipeline,
  clients: CompanyClients,
  talent: CompanyTalent,
  projects: CompanyProjects,
  contracts: CompanyContracts,
  finance: CompanyFinance,
  analytics: CompanyAnalytics,
  partners: CompanyPartners,
  admin: CompanyAdmin,
};

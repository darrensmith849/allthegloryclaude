import type { JSX } from "react";
import * as p from "@/platform/demo-data/dashboards/partner";
import { BarChart, Callout, DashGrid, DataTable, DemoButton, HBars, ItemList, KeyValues, Panel, StatGrid, StatusPill, Timeline } from "../primitives";

function PartnerOverview() {
  return (
    <>
      <StatGrid
        stats={[
          { label: "Referred creatives", value: p.partnerStats.referred },
          { label: "Active in programmes", value: p.partnerStats.active },
          { label: "Training completions", value: p.partnerStats.trainingCompletions, accent: true },
          { label: "Open support requests", value: p.partnerStats.openSupport, note: "Status only" },
          { label: "Consent coverage", value: p.partnerStats.consentCoverage },
        ]}
      />
      <DashGrid>
        <Panel title="Paid engagements for referred creatives" description="Aggregated across consenting creatives. Q4 to date." span={7}>
          <BarChart
            label="Paid engagements and training completions by quarter"
            categories={p.impact.quarters}
            series={[
              { name: "Paid engagements", values: p.impact.paidEngagements },
              { name: "Training completions", values: p.impact.trainingCompletions },
            ]}
          />
        </Panel>
        <Panel title="Support workflow" description="Counts by status. No case details." span={5}>
          <HBars label="Support requests by status" items={p.supportByStatus} />
        </Panel>
        <Panel title="Upcoming programme events">
          <Timeline label="Programme events" items={p.events.map((e) => ({ date: e.date, title: e.title, detail: e.detail, status: e.status }))} />
        </Panel>
      </DashGrid>
    </>
  );
}

function PartnerReferrals() {
  return (
    <DashGrid>
      <Panel title="Referred creatives" description="A name is shown only while the creative's consent grant is active." actions={<DemoButton variant="accent">Refer a creative</DemoButton>}>
        <DataTable
          caption="Referrals"
          rowKey={(r) => `${r.member}-${r.referred}`}
          rows={p.referrals}
          minWidth={680}
          columns={[
            { key: "m", header: "Creative", rowHeader: true, render: (r) => r.member },
            { key: "r", header: "Referred", nowrap: true, render: (r) => r.referred },
            { key: "p", header: "Programme", render: (r) => r.programme },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "c", header: "Consent", render: (r) => <StatusPill status={r.consent} tone={r.consent === "Granted" ? "good" : "bad"} /> },
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

function PartnerProgrammes() {
  return (
    <DashGrid>
      <Panel title="Benefits and programme directory" span={7}>
        <ItemList items={p.benefits.map((b) => ({ id: b.name, title: b.name, meta: b.detail, aside: <span className="pill">{b.eligibility}</span> }))} />
      </Panel>
      <Panel title="Training and events" span={5}>
        <Timeline label="Training and events" items={p.events.map((e) => ({ date: e.date, title: e.title, detail: e.detail, status: e.status }))} />
      </Panel>
      <Panel title="Artist Business Passport — proposed joint programme" tone="rings">
        <KeyValues
          items={[
            ["Platform provides", "Verified profile, portfolio, contracts, rights and earnings history, opportunity matching"],
            ["Partner provides", "Advocacy, member support, business training, professional-service referrals"],
            ["Shared", "Consent-controlled impact reporting"],
            ["Status", <StatusPill key="s" status="Proposed" tone="warn" />],
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

function PartnerSupport() {
  return (
    <DashGrid>
      <Panel title="Support requests" description="Category and workflow status only." actions={<DemoButton>Update status</DemoButton>}>
        <DataTable
          caption="Support workflow"
          rowKey={(r) => r.ref}
          rows={p.supportCases}
          minWidth={600}
          columns={[
            { key: "r", header: "Reference", rowHeader: true, nowrap: true, render: (r) => r.ref },
            { key: "c", header: "Category", render: (r) => r.category },
            { key: "o", header: "Opened", nowrap: true, render: (r) => r.opened },
            { key: "u", header: "Updated", nowrap: true, render: (r) => r.updated },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
        <Callout icon="lock">
          <strong>By design, this platform holds no medical, psychological, legal or financial case details.</strong> Those remain with the partner and the professionals it refers to. The company dashboard sees even less: status counts only.
        </Callout>
      </Panel>
    </DashGrid>
  );
}

function PartnerImpact() {
  return (
    <DashGrid>
      <Panel title="Outcomes for consenting creatives" description="Groups smaller than five are suppressed before reporting." span={6}>
        <HBars label="Outcomes" items={p.impact.byOutcome} />
      </Panel>
      <Panel title="Earnings impact" span={6} tone="accent">
        <p style={{ fontSize: "var(--step-2)", fontWeight: 300, color: "var(--accent-2)" }}>{p.impact.earningsBand}</p>
        <p className="muted">Reported as a band, never as individual earnings.</p>
      </Panel>
      <Panel title="By quarter">
        <BarChart
          label="Paid engagements and training completions by quarter"
          categories={p.impact.quarters}
          series={[
            { name: "Paid engagements", values: p.impact.paidEngagements },
            { name: "Training completions", values: p.impact.trainingCompletions },
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

function PartnerConsent() {
  return (
    <DashGrid>
      <Panel title="Consent grants" description="Each grant names its scope and expiry. Creatives can withdraw at any time, and access stops immediately.">
        <DataTable
          caption="Data-sharing consent"
          rowKey={(r) => `${r.member}-${r.granted}`}
          rows={p.consentGrants}
          minWidth={760}
          columns={[
            { key: "m", header: "Creative", rowHeader: true, render: (r) => r.member },
            { key: "s", header: "Scope", render: (r) => r.scope },
            { key: "g", header: "Granted", nowrap: true, render: (r) => r.granted },
            { key: "e", header: "Expires", nowrap: true, render: (r) => r.expires },
            { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Panel>
      <Panel title="Document history">
        <Timeline label="Collaboration documents" items={p.documentHistory.map((d) => ({ date: d.date, title: d.title, detail: d.detail, status: d.status }))} />
      </Panel>
    </DashGrid>
  );
}

export const partnerViews: Record<string, () => JSX.Element> = {
  overview: PartnerOverview,
  referrals: PartnerReferrals,
  programmes: PartnerProgrammes,
  support: PartnerSupport,
  impact: PartnerImpact,
  consent: PartnerConsent,
};

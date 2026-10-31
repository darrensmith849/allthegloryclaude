import type { JSX } from "react";
import { creativeRoles, genres, labelFor } from "@/platform/domain/options";
import type { ArtistWorkspace } from "@/platform/demo-data/dashboards/artist";
import { DEMO_NOTE, fmt, fmtUsdUnits } from "@/platform/demo-data/dashboards/shared";
import {
  BarChart,
  Callout,
  DashGrid,
  DataTable,
  DemoButton,
  HBars,
  ItemList,
  KeyValues,
  LineChart,
  Panel,
  Progress,
  StatGrid,
  StatusPill,
  Timeline,
} from "../primitives";

type View = (props: { w: ArtistWorkspace }) => JSX.Element;
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;

const ArtistOverview: View = ({ w }) => (
  <>
    <StatGrid
      stats={[
        { label: "Matched opportunities", value: w.stats.opportunities, note: "2 new this week", trend: "up" },
        { label: "Active projects", value: w.stats.activeProjects },
        { label: "Awaiting your signature", value: w.stats.pendingSignatures, note: "Split sheet due 04 Nov" },
        { label: "Next payout", value: fmt(w.statement.payouts[0]!.amount), note: "On final client approval", accent: true },
      ]}
    />
    <DashGrid>
      <Panel title="Coming up" span={7}>
        <Timeline label="Upcoming deadlines" items={w.deadlines} />
      </Panel>
      <Panel title="Profile readiness" description="What makes you bookable and listable." span={5}>
        <div style={{ display: "grid", gap: "1rem" }}>
          {w.completeness.map((c) => (
            <Progress key={c.label} label={c.label} value={c.value} max={c.max} detail={`${c.value} of ${c.max}`} />
          ))}
        </div>
      </Panel>
      <Panel title="Artist Business Passport" description="One verified professional record you can share with clients, funders and partners — with your consent." span={6} tone="rings">
        <ItemList items={w.passport.map((p) => ({ id: p.item, title: p.item, aside: <StatusPill status={p.status} /> }))} />
      </Panel>
      <Panel title="Earnings" description={DEMO_NOTE} span={6}>
        <BarChart label="Monthly earnings in USD" categories={w.earningsChart.categories} series={[{ name: "Earnings", values: w.earningsChart.values }]} format={fmtUsdUnits} height={180} />
      </Panel>
    </DashGrid>
  </>
);

const ArtistProfile: View = ({ w }) => (
  <DashGrid>
    <Panel title="Public profile" description="Shown on the roster only after verification and your public-listing approval." span={6} actions={<DemoButton>Edit profile</DemoButton>}>
      <KeyValues
        items={[
          ["Name", `${w.profile.name} (sample)`],
          ["Headline", w.profile.headline],
          ["Roles", w.profile.roles.map((r) => labelFor(creativeRoles, r)).join(", ")],
          ["Genres", w.profile.genres.map((g) => labelFor(genres, g)).join(", ")],
          ["Languages", w.profile.languages.join(", ")],
          ["Based in", `${w.profile.city}, ${w.profile.country}`],
          ["Working modes", w.profile.workingModes.join(", ")],
          ["Listing status", <StatusPill key="s" status="Pending" />],
        ]}
      />
    </Panel>
    <Panel title="Media and portfolio" description="Nothing is public until you approve it. Unreleased music stays private in signed storage." span={6} actions={<DemoButton>Upload media</DemoButton>}>
      <DataTable
        caption="Media assets"
        rowKey={(r) => r.title}
        rows={w.media}
        minWidth={460}
        columns={[
          { key: "t", header: "Asset", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.type}</span></> },
          { key: "v", header: "Visibility", render: (r) => <StatusPill status={r.visibility} /> },
          { key: "p", header: "Plays", numeric: true, render: (r) => r.plays },
        ]}
      />
    </Panel>
    <Panel title="Credits" description="Credits are published only with evidence. Unverified credits are never shown publicly.">
      <DataTable
        caption="Submitted credits"
        rowKey={(r) => r.work}
        rows={w.credits}
        minWidth={640}
        columns={[
          { key: "w", header: "Work", rowHeader: true, render: (r) => r.work },
          { key: "c", header: "Credit", render: (r) => r.credit },
          { key: "e", header: "Evidence", render: (r) => r.evidence },
          { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
        ]}
      />
    </Panel>
  </DashGrid>
);

const ArtistOpportunities: View = ({ w }) => (
  <DashGrid>
    <Panel title="Matched for you" description="Based on your verified roles, genres and working modes." span={7}>
      <DataTable
        caption="Matched opportunities"
        rowKey={(r) => r.ref}
        rows={w.opportunities}
        minWidth={520}
        columns={[
          { key: "t", header: "Opportunity", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref}</span></> },
          { key: "f", header: "Fit", render: (r) => r.fit },
          { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
        ]}
      />
    </Panel>
    <Panel title="Your applications" span={5}>
      <ItemList items={w.applications.map((a) => ({ id: a.ref, title: a.opportunity, meta: `${a.ref} · submitted ${a.submitted}`, aside: <StatusPill status={a.status} /> }))} />
    </Panel>
    <Panel title="Enquiries" description="Client enquiries reach you through the company, so terms, fees and splits are agreed in writing before work starts.">
      <DataTable
        caption="Enquiries"
        rowKey={(r) => r.subject}
        rows={w.enquiries}
        minWidth={560}
        columns={[
          { key: "f", header: "From", rowHeader: true, render: (r) => r.from },
          { key: "s", header: "Subject", render: (r) => r.subject },
          { key: "r", header: "Received", nowrap: true, render: (r) => r.received },
          { key: "st", header: "Status", render: (r) => <StatusPill status={r.status} /> },
        ]}
      />
    </Panel>
  </DashGrid>
);

const ArtistSchedule: View = ({ w }) => (
  <DashGrid>
    <Panel title="November 2026" description="You control availability. Bookings come only from contracted work." span={7} actions={<DemoButton>Block dates</DemoButton>}>
      <div style={{ display: "grid", gap: "4px" }}>
        <div className="calendar" aria-hidden="true">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d} className="calendar__dow">
              {d}
            </span>
          ))}
        </div>
        <ul className="calendar" role="list" aria-label="Availability, November 2026" style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {w.calendar.map((day, i) =>
            day.day ? (
              <li key={i} className="calendar__day" data-state={day.state}>
                <span>
                  {day.day}
                  <span className="visually-hidden"> November: {day.state === "free" ? "available" : day.state === "off" ? "unavailable" : day.state}</span>
                </span>
                {day.state === "booked" || day.state === "hold" ? (
                  <span className="calendar__state" aria-hidden="true">
                    {day.state}
                  </span>
                ) : null}
              </li>
            ) : (
              <li key={i} className="calendar__day" data-state="pad" aria-hidden="true" />
            ),
          )}
        </ul>
      </div>
      <div className="legend-row" aria-hidden="true">
        <span><i style={{ background: "var(--accent)" }} />Booked</span>
        <span><i style={{ background: "var(--accent-soft)" }} />Hold</span>
        <span><i style={{ background: "var(--glass)" }} />Available</span>
        <span><i style={{ background: "repeating-linear-gradient(135deg, var(--glass-strong) 0 3px, transparent 3px 6px)" }} />Unavailable</span>
      </div>
    </Panel>
    <Panel title="Bookings" span={5}>
      <ItemList items={w.bookings.map((b) => ({ id: b.ref, title: b.what, meta: `${b.ref} · ${b.when}`, aside: <StatusPill status={b.status} /> }))} />
      <Callout>Holds expire automatically after 72 hours unless the client confirms and the engagement is contracted.</Callout>
    </Panel>
  </DashGrid>
);

const ArtistProjects: View = ({ w }) => (
  <DashGrid>
    <Panel title="Briefs" span={6}>
      <ItemList items={w.briefs.map((b) => ({ id: b.ref, title: b.title, meta: `${b.ref} · ${b.client} · due ${b.due}`, aside: <StatusPill status={b.stage === "Client review" ? "Client review" : "In progress"} /> }))} />
    </Panel>
    <Panel title="Deadlines" span={6}>
      <Timeline label="Project deadlines" items={w.deadlines} />
    </Panel>
    <Panel title="File submissions" description="Upload to private storage; files are scanned, versioned and released to the client only after quality control." actions={<DemoButton variant="accent">Submit a file</DemoButton>}>
      <DataTable
        caption="Your submissions"
        rowKey={(r) => r.file}
        rows={w.submissions}
        minWidth={560}
        columns={[
          { key: "f", header: "File", rowHeader: true, render: (r) => r.file },
          { key: "p", header: "Project", nowrap: true, render: (r) => r.project },
          { key: "d", header: "Submitted", nowrap: true, render: (r) => r.submitted },
          { key: "s", header: "Approval", render: (r) => <StatusPill status={r.status} /> },
        ]}
      />
    </Panel>
  </DashGrid>
);

function SplitTable({ caption, rows }: { caption: string; rows: { party: string; bps: number }[] }) {
  return (
    <DataTable
      caption={caption}
      rowKey={(r) => r.party}
      rows={rows}
      minWidth={420}
      columns={[
        { key: "p", header: "Party", rowHeader: true, render: (r) => r.party },
        { key: "s", header: "Share", numeric: true, render: (r) => pct(r.bps) },
      ]}
      footer={
        <tr>
          <th scope="row">Total</th>
          <td className="num">{pct(rows.reduce((a, r) => a + r.bps, 0))}</td>
        </tr>
      }
    />
  );
}

const ArtistRights: View = ({ w }) => (
  <DashGrid>
    <Panel title="Your agreements">
      <DataTable
        caption="Contracts you are party to"
        rowKey={(r) => r.ref}
        rows={w.contracts}
        minWidth={560}
        columns={[
          { key: "t", header: "Agreement", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref}</span></> },
          { key: "d", header: "Date", nowrap: true, render: (r) => r.date },
          { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
        ]}
      />
    </Panel>
    <Panel title="Split sheet — track 3" description="Ready to sign." span={6} actions={<DemoButton variant="accent">Review and sign</DemoButton>}>
      <SplitTable caption="Composition shares, track 3" rows={w.splitSigned} />
      <Callout icon={w.splitSignedCheck.ok ? "check" : "alert"} tone={w.splitSignedCheck.ok ? undefined : "warn"}>
        {w.splitSignedCheck.ok ? <><strong>Valid.</strong> Shares total exactly 100%.</> : <><strong>Cannot be sent.</strong> {w.splitSignedCheck.reason}</>}
      </Callout>
    </Panel>
    <Panel title="Split sheet — new single (draft)" description="The validator blocks sending until it balances." span={6}>
      <SplitTable caption="Draft composition shares" rows={w.splitDraft} />
      <Callout icon={w.splitDraftCheck.ok ? "check" : "alert"} tone={w.splitDraftCheck.ok ? undefined : "warn"}>
        {w.splitDraftCheck.ok ? <><strong>Valid.</strong> Shares total exactly 100%.</> : <><strong>Cannot be sent yet.</strong> {w.splitDraftCheck.reason}.</>}
      </Callout>
    </Panel>
  </DashGrid>
);

const ArtistEarnings: View = ({ w }) => {
  const s = w.statement;
  const mine = s.payouts[0]!;
  return (
    <>
      <Callout>{DEMO_NOTE}</Callout>
      <div style={{ height: "1.25rem" }} />
      <DashGrid>
        <Panel title="Statement PST-0142-1" description="Exactly how your payout was calculated, line by line." span={7} tone="accent">
          <DataTable
            caption="Project settlement"
            rowKey={(r) => r.label}
            minWidth={420}
            rows={[
              { label: "Client paid for the project", value: fmt(s.grossReceipts) },
              { label: "Approved project costs (receipted)", value: `− ${fmt(s.approvedCosts)}` },
              { label: "Company commission (per your contract)", value: `− ${fmt(s.commission)}` },
              { label: "Creative pool", value: fmt(s.creativePool) },
              { label: "Other contributors (combined, per split)", value: `− ${fmt(s.payouts[1]!.amount)}` },
            ]}
            columns={[
              { key: "l", header: "Line", rowHeader: true, render: (r) => r.label },
              { key: "v", header: "Amount", numeric: true, render: (r) => r.value },
            ]}
            footer={
              <tr>
                <th scope="row">Your payout</th>
                <td className="num">{fmt(mine.amount)}</td>
              </tr>
            }
          />
        </Panel>
        <Panel title="Payment request" description="Prepare a draft for work outside a managed project. Only the contracting legal entity issues the official client invoice." span={5}>
          <KeyValues
            items={[
              ["Draft", "PRQ-0007 (not yet submitted)"],
              ["For", "Additional arrangement — track 4"],
              ["Amount", fmt(w.statements[1]!.amount)],
              ["Goes to", "Company finance for approval"],
            ]}
          />
          <DemoButton variant="accent">Submit for approval</DemoButton>
        </Panel>
        <Panel title="Statements and payouts" span={7}>
          <DataTable
            caption="Payout statements"
            rowKey={(r) => r.ref}
            rows={w.statements}
            minWidth={520}
            columns={[
              { key: "r", header: "Statement", rowHeader: true, render: (r) => <>{r.ref}<span className="cell-sub">{r.project}</span></> },
              { key: "p", header: "Period", nowrap: true, render: (r) => r.period },
              { key: "a", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Earnings by month" span={5}>
          <BarChart label="Monthly earnings in USD" categories={w.earningsChart.categories} series={[{ name: "Earnings", values: w.earningsChart.values }]} format={fmtUsdUnits} height={170} />
        </Panel>
      </DashGrid>
    </>
  );
};

const ArtistDocuments: View = ({ w }) => (
  <DashGrid>
    <Panel title="Compliance status" description="Status only. Identity, tax and banking documents are held in private storage and are visible only to authorised finance and roster staff.">
      <DataTable
        caption="Compliance items"
        rowKey={(r) => r.item}
        rows={w.compliance}
        minWidth={620}
        columns={[
          { key: "i", header: "Item", rowHeader: true, render: (r) => r.item },
          { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          { key: "n", header: "Note", render: (r) => r.note },
        ]}
      />
    </Panel>
    <Panel title="Your data" span={6}>
      <KeyValues
        items={[
          ["Export", "Download everything held about you"],
          ["Correct", "Request a correction to any record"],
          ["Delete", "Request deletion, subject to contract and tax retention"],
          ["Consent", "Manage who can see your passport and statements"],
        ]}
      />
    </Panel>
    <Panel title="Renewals" span={6}>
      <Timeline label="Upcoming renewals" items={[{ date: "Oct 2027", title: "Rights confirmation renewal" }, { date: "When needed", title: "Work permit — only for in-person bookings abroad", status: "Not started" }]} />
    </Panel>
  </DashGrid>
);

const ArtistInsights: View = ({ w }) => (
  <DashGrid>
    <Panel title="Profile views and plays" description="First-party, cookie-free. Your own visits are not counted." span={8}>
      <LineChart
        label="Weekly profile views and approved media plays"
        categories={w.insights.categories}
        series={[
          { name: "Profile views", values: w.insights.profileViews },
          { name: "Media plays", values: w.insights.plays },
        ]}
      />
    </Panel>
    <Panel title="Where visitors came from" span={4}>
      <HBars label="Referrers, percent of profile visits" items={w.insights.referrers} format={(n) => `${n}%`} />
    </Panel>
    <Panel title="Website and release pages" description="Hosted on the same platform as your workspace.">
      <StatGrid
        stats={[
          { label: "Website visits (30 days)", value: "1,284" },
          { label: "Release page clicks", value: "312", note: "Campaign-tagged links" },
          { label: "Press-kit downloads", value: "41" },
          { label: "Brief requests naming you", value: "3", accent: true },
        ]}
      />
    </Panel>
  </DashGrid>
);

const ArtistSupport: View = ({ w }) => (
  <DashGrid>
    <Panel title="Training pathway" span={6}>
      <div style={{ display: "grid", gap: "1rem" }}>
        {w.training.map((t) => (
          <Progress key={t.label} label={t.label} value={t.value} max={t.max} detail={`${t.value} of ${t.max} modules`} />
        ))}
      </div>
    </Panel>
    <Panel title="Support referrals" description="You see the status of your own requests. Details are held by the partner organisation, never in this platform." span={6}>
      <ItemList items={w.support.map((s) => ({ id: s.ref, title: `${s.ref} · ${s.type}`, meta: `${s.partner} · updated ${s.updated}`, aside: <StatusPill status={s.status} /> }))} />
      <Callout>The partner collaboration is proposed and not yet confirmed. Referrals shown here are demonstration data.</Callout>
    </Panel>
  </DashGrid>
);

export const artistViews: Record<string, View> = {
  overview: ArtistOverview,
  profile: ArtistProfile,
  opportunities: ArtistOpportunities,
  schedule: ArtistSchedule,
  projects: ArtistProjects,
  rights: ArtistRights,
  earnings: ArtistEarnings,
  documents: ArtistDocuments,
  insights: ArtistInsights,
  support: ArtistSupport,
};

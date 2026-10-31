import type { JSX } from "react";
import * as c from "@/platform/demo-data/dashboards/client";
import { DEMO_NOTE, fmt } from "@/platform/demo-data/dashboards/shared";
import { Callout, DashGrid, DataTable, DemoButton, ItemList, KeyValues, Panel, Progress, StatGrid, StatusPill, Timeline } from "../primitives";

const pct = (bps: number) => `${bps / 100}%`;

function ClientOverview() {
  return (
    <>
      <StatGrid
        stats={[
          { label: "Project stage", value: "Mixing", note: "3 of 5 milestones complete" },
          { label: "Next payment", value: fmt(c.schedule[1]!.amount), note: "Invoice INV-0318 · due 13 Nov", accent: true },
          { label: "Needs your decision", value: 2, note: "1 draft · 1 change request" },
          { label: "Revision rounds left", value: `${c.revisions.contracted - c.revisions.used} of ${c.revisions.contracted}` },
        ]}
      />
      <DashGrid>
        <Panel title="Milestones" span={7}>
          <Timeline label="Project milestones" items={c.milestoneApprovals} />
        </Panel>
        <Panel title="Waiting on you" span={5}>
          <ItemList
            items={[
              { id: "a1", title: "Review Track 3 — mix v2", meta: "Submitted 30 Oct", aside: <StatusPill status="Awaiting approval" /> },
              { id: "a2", title: "Sign change request CTR-0142-X1", meta: "Adds vinyl pre-master", aside: <StatusPill status="Awaiting signature" /> },
              { id: "a3", title: "Pay milestone invoice INV-0318", meta: "Due 13 Nov", aside: <StatusPill status="Issued" /> },
            ]}
          />
        </Panel>
        <Panel title="Your project team" description="Assigned creatives have accepted their part, fee and split before work began.">
          <KeyValues
            items={[
              ["Project lead", "Project manager (demo)"],
              ["Production", "Msasa Room (sample)"],
              ["Mixing and mastering", "Kopje Sound (sample)"],
              ["Session players", "Granite Hour (sample), Lowveld Keys (sample)"],
            ]}
          />
        </Panel>
      </DashGrid>
    </>
  );
}

function ClientBrief() {
  return (
    <DashGrid>
      <Panel title="Agreed brief (v3)" span={7} actions={<DemoButton>Suggest a refinement</DemoButton>}>
        <p style={{ color: "var(--ink-soft)" }}>{c.brief.summary}</p>
        <KeyValues
          items={[
            ["Services", c.brief.services.join(", ")],
            ["Budget range", c.brief.budget],
            ["Timeline", c.brief.timeline],
            ["References", c.brief.references.join(" · ")],
          ]}
        />
      </Panel>
      <Panel title="Version history" span={5}>
        <Timeline label="Brief versions" items={c.briefVersions.map((v) => ({ date: v.date, title: `${v.version} — ${v.change}`, detail: `By ${v.by}`, done: true }))} />
      </Panel>
    </DashGrid>
  );
}

function ClientQuote() {
  return (
    <DashGrid>
      <Panel title="Quote QUO-0142 v2 — accepted" description={`Fixed price for the written scope. ${DEMO_NOTE}`} span={7} tone="accent">
        <DataTable
          caption="Scope and price"
          rowKey={(r) => r.item}
          rows={c.quoteLines}
          minWidth={460}
          columns={[
            { key: "i", header: "Item", rowHeader: true, render: (r) => r.item },
            { key: "a", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
          ]}
          footer={
            <tr>
              <th scope="row">Total (fixed)</th>
              <td className="num">{fmt(c.quoteTotal)}</td>
            </tr>
          }
        />
      </Panel>
      <Panel title="What the quote includes" span={5}>
        <KeyValues
          items={[
            ["Revision rounds", `${c.revisions.contracted} per track, contracted`],
            ["Changes beyond scope", "Only by signed change request"],
            ["Rights", "Master and licence terms in CTR-0142-L"],
            ["Splits", "Every contributor on a signed split sheet"],
            ["Payment", "40% deposit · 40% milestone · 20% on approval"],
          ]}
        />
      </Panel>
      <Panel title="Agreements" actions={<DemoButton variant="accent">Review and sign</DemoButton>}>
        <DataTable
          caption="Agreements for this project"
          rowKey={(r) => r.ref}
          rows={c.agreements}
          minWidth={560}
          columns={[
            { key: "t", header: "Agreement", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref}</span></> },
            { key: "v", header: "Version", render: (r) => r.version },
            { key: "d", header: "Date", nowrap: true, render: (r) => r.date },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Panel>
    </DashGrid>
  );
}

function ClientPayments() {
  const paid = c.receipts.reduce((a, r) => a + r.amount.amountMinor, 0);
  return (
    <>
      <Callout>{DEMO_NOTE} Online payment is not active in this demonstration; no card details are ever stored by the platform.</Callout>
      <div style={{ height: "1.25rem" }} />
      <DashGrid>
        <Panel title="Payment schedule" description={`Instalments total ${c.scheduleCheck ? "exactly 100%" : "an invalid amount"} of the fixed quote.`} span={7}>
          <DataTable
            caption="Instalments"
            rowKey={(r) => r.label}
            rows={c.schedule}
            minWidth={520}
            columns={[
              { key: "l", header: "Instalment", rowHeader: true, render: (r) => <>{r.label}<span className="cell-sub">{pct(r.bps)} of quote</span></> },
              { key: "d", header: "Due", nowrap: true, render: (r) => r.due },
              { key: "a", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Paid so far" span={5} tone="rings">
          <p className="figure-big">{fmt({ amountMinor: paid, currency: "USD" })}</p>
          <Progress label="Of the fixed quote" value={paid} max={c.quoteTotal.amountMinor} />
          <DemoButton variant="accent">Pay INV-0318</DemoButton>
        </Panel>
        <Panel title="Invoices" description="Issued by the contracting company." span={7}>
          <DataTable
            caption="Invoices"
            rowKey={(r) => r.ref}
            rows={c.invoices}
            minWidth={560}
            columns={[
              { key: "r", header: "Invoice", rowHeader: true, render: (r) => <>{r.ref}<span className="cell-sub">{r.description}</span></> },
              { key: "d", header: "Due", nowrap: true, render: (r) => r.due },
              { key: "a", header: "Amount", numeric: true, render: (r) => fmt(r.amount) },
              { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Receipts" span={5}>
          <ItemList items={c.receipts.map((r) => ({ id: r.ref, title: `${r.ref} · ${fmt(r.amount)}`, meta: `${r.method} · received ${r.received} · for ${r.invoice}`, aside: <DemoButton>Download</DemoButton> }))} />
        </Panel>
      </DashGrid>
    </>
  );
}

function ClientReview() {
  return (
    <DashGrid>
      <Panel title="Drafts for review" actions={<DemoButton variant="accent">Open player</DemoButton>}>
        <DataTable
          caption="Drafts"
          rowKey={(r) => r.ref}
          rows={c.drafts}
          minWidth={560}
          columns={[
            { key: "t", header: "Draft", rowHeader: true, render: (r) => <>{r.title}<span className="cell-sub">{r.ref}</span></> },
            { key: "m", header: "Milestone", render: (r) => r.milestone },
            { key: "d", header: "Submitted", nowrap: true, render: (r) => r.submitted },
            { key: "s", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
        />
      </Panel>
      <Panel title="Revision rounds" description="Contracted rounds are included in the price. Anything more becomes a change request you approve first." span={5}>
        <Progress label="Rounds used on Track 2" value={c.revisions.used} max={c.revisions.contracted} detail={`${c.revisions.used} of ${c.revisions.contracted}`} />
        <DemoButton>Request a revision</DemoButton>
      </Panel>
      <Panel title="Open revision requests" span={7}>
        <ItemList items={c.revisionRequests.map((r) => ({ id: r.ref, title: `${r.ref} · ${r.draft}`, meta: `“${r.request}” · raised ${r.raised}`, aside: <StatusPill status={r.status} /> }))} />
      </Panel>
      <Panel title="Milestone approvals">
        <Timeline label="Milestone approvals" items={c.milestoneApprovals} />
      </Panel>
    </DashGrid>
  );
}

function ClientFiles() {
  return (
    <DashGrid>
      <Panel title="Your reference uploads" description="Private by default. Every upload is virus-scanned before the team can open it." actions={<DemoButton>Upload reference</DemoButton>}>
        <DataTable
          caption="Reference files"
          rowKey={(r) => r.name}
          rows={c.referenceFiles}
          minWidth={620}
          columns={[
            { key: "n", header: "File", rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.access}</span></> },
            { key: "z", header: "Size", numeric: true, render: (r) => r.size },
            { key: "u", header: "Uploaded", nowrap: true, render: (r) => r.uploaded },
            { key: "s", header: "Scan", render: (r) => <StatusPill status={r.scan} /> },
          ]}
        />
      </Panel>
      <Panel title="Final files" description="Released through time-limited signed links once approved and paid in full.">
        <ItemList items={c.finalFiles.map((f) => ({ id: f.name, title: f.name, meta: `Available: ${f.available}`, aside: <StatusPill status={f.status} /> }))} />
      </Panel>
    </DashGrid>
  );
}

function ClientMessages() {
  return (
    <DashGrid>
      <Panel title={`${c.projectRef} · ${c.projectName}`} description="Messages are kept with the project record. Email is a notification, not the only copy.">
        <div className="thread">
          {c.messages.map((m) => (
            <article key={m.at} className={`message${m.own ? " message--own" : ""}`}>
              <span className="message__meta">
                {m.from} · {m.at}
              </span>
              <p>{m.body}</p>
            </article>
          ))}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="demo-reply">
            Reply
          </label>
          <textarea id="demo-reply" className="textarea" rows={3} disabled placeholder="Messaging is not active in this demonstration" />
        </div>
      </Panel>
    </DashGrid>
  );
}

export const clientViews: Record<string, () => JSX.Element> = {
  overview: ClientOverview,
  brief: ClientBrief,
  quote: ClientQuote,
  payments: ClientPayments,
  review: ClientReview,
  files: ClientFiles,
  messages: ClientMessages,
};

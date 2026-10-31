"use client";

import Link from "@/platform/components/ui/Link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { consentWording } from "@/platform/domain/consent";
import { budgetBands, clientTypes, services, timelines } from "@/platform/domain/options";
import { enquirySchema } from "@/platform/domain/schemas";
import { sampleRoster } from "@/platform/demo-data/roster";
import { submissionsOpen } from "@/platform/config/client-env";
import { track } from "@/platform/lib/analytics";
import { CheckField, ChipGroup, ErrorSummary, LinkListField, SelectField, TextArea, TextField } from "./fields";
import { Turnstile } from "./Turnstile";
import { useSubmission } from "./useSubmission";

const labels: Record<string, string> = {
  name: "Your name",
  email: "Email",
  phone: "Phone",
  organisation: "Organisation",
  clientType: "You are",
  country: "Based in",
  services: "Services",
  budgetBand: "Budget range",
  timeline: "Timeline",
  brief: "The brief",
  references: "Reference links",
  privacyAccepted: "Privacy notice",
};

const serviceValues = new Set<string>(services.map((s) => s.value));

/** The recorded consent wording, with the privacy notice linked in place. */
export function PrivacyWording() {
  const [before, after] = consentWording.privacy.split("privacy notice");
  return (
    <>
      {before}
      <Link href="/privacy" target="_blank" rel="noopener">
        privacy notice<span className="visually-hidden"> (opens in a new tab)</span>
      </Link>
      {after}
    </>
  );
}

/**
 * Reads booking pre-selection ("Request for a project" on a profile, or a
 * service link) from the URL. Render inside <Suspense fallback={<BriefForm />}>:
 * the static HTML shows the same form without pre-selection, so there is no
 * layout shift when the URL-aware version takes over.
 */
export function BriefFormFromUrl() {
  const params = useSearchParams();
  const talent = params.get("talent") ?? undefined;
  const service = params.get("service") ?? undefined;
  return <BriefForm key={`${talent}|${service}`} talent={talent} service={service} />;
}

export function BriefForm({ talent, service }: { talent?: string; service?: string }) {
  const { state, submit, markStarted } = useSubmission("/api/enquiries", enquirySchema);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [website, setWebsite] = useState("");
  const started = useRef(false);

  const [form, setForm] = useState(() => {
    return {
      name: "",
      email: "",
      phone: "",
      organisation: "",
      clientType: "",
      country: "",
      services: service && serviceValues.has(service) ? [service] : ([] as string[]),
      talentSlugs: talent && sampleRoster.some((p) => p.slug === talent) ? [talent] : ([] as string[]),
      budgetBand: "",
      timeline: "",
      brief: "",
      references: [""],
      privacyAccepted: false,
      marketingOptIn: false,
    };
  });

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      if (!started.current) {
        started.current = true;
        markStarted();
        track("brief_start");
      }
      setForm((f) => ({ ...f, [key]: value }));
    },
    [markStarted],
  );

  const errors = state.status === "invalid" ? state.errors : {};

  useEffect(() => {
    if (state.status === "invalid") document.getElementById("error-summary")?.focus();
    if (state.status === "success") {
      track("brief_submit");
      document.getElementById("form-result")?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="form-success" id="form-result" tabIndex={-1} role="status">
        <p className="eyebrow">Brief received</p>
        <h2>Thank you, {form.name.split(" ")[0]}.</h2>
        <p className="lede">{state.message}</p>
        <p>
          Your reference is <span className="reference">{state.reference}</span>
        </p>
        <p className="muted">Keep it for any follow-up. We do not add you to marketing unless you ticked that box.</p>
        <div className="cluster">
          <Link className="btn btn--accent" href="/roster">
            Explore the roster
          </Link>
          <Link className="btn" href="/how-it-works">
            What happens next
          </Link>
        </div>
      </div>
    );
  }

  const selectedTalent = sampleRoster.filter((p) => form.talentSlugs.includes(p.slug));

  return (
    <form
      className="form"
      noValidate
      aria-describedby="brief-intro"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({ ...form, references: form.references.map((r) => r.trim()).filter(Boolean) }, { turnstileToken, website });
        // Turnstile tokens are single-use: request a fresh one after any failed attempt.
        if (!ok) setResetSignal((n) => n + 1);
      }}
    >
      <p id="brief-intro" className="visually-hidden">
        Project brief. Required fields are marked as required to assistive technology; optional fields say “optional”.
      </p>

      {!submissionsOpen ? (
        <div className="form-status form-status--info" role="note">
          <strong>Submissions open at launch.</strong> You can explore this form now; sending is switched off until the platform goes live.
        </div>
      ) : null}
      {state.status === "invalid" ? <ErrorSummary errors={errors} labels={labels} /> : null}
      {state.status === "error" ? (
        <div className="form-status form-status--error" role="alert">
          {state.message}
        </div>
      ) : null}

      <fieldset className="form-section">
        <legend>
          <span className="eyebrow">
            <span className="eyebrow__index">01</span> About you
          </span>
          Who should we reply to?
        </legend>
        <div className="form-row">
          <TextField id="name" label="Your name" value={form.name} onChange={(v) => set("name", v)} error={errors.name} autoComplete="name" maxLength={120} />
          <TextField id="email" label="Email" type="email" inputMode="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" maxLength={254} />
        </div>
        <div className="form-row">
          <TextField id="phone" label="Phone or WhatsApp" type="tel" inputMode="tel" optional value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} autoComplete="tel" hint="International format, e.g. +263 77 000 0000" />
          <TextField id="organisation" label="Organisation" optional value={form.organisation} onChange={(v) => set("organisation", v)} error={errors.organisation} autoComplete="organization" maxLength={160} />
        </div>
        <div className="form-row">
          <SelectField id="clientType" label="You are" value={form.clientType} onChange={(v) => set("clientType", v)} options={clientTypes} error={errors.clientType} />
          <TextField id="country" label="Based in" value={form.country} onChange={(v) => set("country", v)} error={errors.country} autoComplete="country-name" hint="Country, and city if useful" maxLength={80} />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>
          <span className="eyebrow">
            <span className="eyebrow__index">02</span> The project
          </span>
          What are you making?
        </legend>
        <ChipGroup id="services" legend="Services" hint="Choose all that apply." options={services} values={form.services} onChange={(v) => set("services", v)} error={errors.services} />
        {selectedTalent.length ? (
          <div className="field">
            <p className="field__label">Requested creatives</p>
            <ul className="chips" role="list">
              {selectedTalent.map((p) => (
                <li key={p.slug} className="chip">
                  <button type="button" className="btn btn--sm" onClick={() => set("talentSlugs", form.talentSlugs.filter((s) => s !== p.slug))} aria-label={`Remove ${p.name} (sample profile)`}>
                    {p.name} · sample · Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="form-row">
          <SelectField id="budgetBand" label="Budget range" value={form.budgetBand} onChange={(v) => set("budgetBand", v)} options={budgetBands} error={errors.budgetBand} hint="Your indication — not our price." />
          <SelectField id="timeline" label="Timeline" value={form.timeline} onChange={(v) => set("timeline", v)} options={timelines} error={errors.timeline} hint="When do you need final delivery?" />
        </div>
        <TextArea
          id="brief"
          label="The brief"
          value={form.brief}
          onChange={(v) => set("brief", v)}
          error={errors.brief}
          maxLength={4000}
          hint="What it is, who it is for, the sound you are after, deliverables and any rights you need."
        />
        <LinkListField id="references" label="Reference links" min={1} hint="Optional — songs, videos or briefs that show what you mean." values={form.references} onChange={(v) => set("references", v)} error={errors.references} />
      </fieldset>

      <fieldset className="form-section">
        <legend>
          <span className="eyebrow">
            <span className="eyebrow__index">03</span> Consent
          </span>
          Your details, your choice
        </legend>
        <CheckField id="privacyAccepted" required checked={form.privacyAccepted} onChange={(v) => set("privacyAccepted", v)} error={errors.privacyAccepted}>
          <PrivacyWording />
        </CheckField>
        <CheckField id="marketingOptIn" checked={form.marketingOptIn} onChange={(v) => set("marketingOptIn", v)}>
          <span className="field__optional">Optional. </span>
          {consentWording.marketing}
        </CheckField>
      </fieldset>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="form-submit">
        <Turnstile action="project-brief" onToken={setTurnstileToken} resetSignal={resetSignal} />
        <div className="cluster">
          <button type="submit" className="btn btn--solid" disabled={!submissionsOpen || state.status === "submitting"} aria-describedby="submit-note">
            {state.status === "submitting" ? "Sending…" : "Send the brief"}
          </button>
        </div>
        <p id="submit-note" className="field__hint">
          A project lead reviews every brief. Submitting does not commit you to anything.
        </p>
      </div>
    </form>
  );
}

"use client";

import Link from "@/platform/components/ui/Link";
import { useCallback, useEffect, useRef, useState } from "react";
import { consentWording } from "@/platform/domain/consent";
import { creativeRoles, experienceLevels, genres } from "@/platform/domain/options";
import { applicationSchema } from "@/platform/domain/schemas";
import { submissionsOpen } from "@/platform/config/client-env";
import { track } from "@/platform/lib/analytics";
import { PrivacyWording } from "./BriefForm";
import { CheckField, ChipGroup, ErrorSummary, LinkListField, SelectField, TextArea, TextField } from "./fields";
import { Turnstile } from "./Turnstile";
import { useSubmission } from "./useSubmission";

const labels: Record<string, string> = {
  name: "Your name",
  stageName: "Stage or project name",
  email: "Email",
  phone: "Phone",
  country: "Country",
  city: "City",
  roles: "Roles",
  genres: "Genres",
  experience: "Experience",
  portfolioLinks: "Links to your work",
  credits: "Credits",
  statement: "About your work",
  rightsConfirmed: "Rights confirmation",
  privacyAccepted: "Privacy notice",
};

export function ApplicationForm() {
  const { state, submit, markStarted } = useSubmission("/api/applications", applicationSchema);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [website, setWebsite] = useState("");
  const started = useRef(false);

  const [form, setForm] = useState({
    name: "",
    stageName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    roles: [] as string[],
    genres: [] as string[],
    experience: "",
    portfolioLinks: [""],
    credits: "",
    remoteReady: false,
    statement: "",
    rightsConfirmed: false,
    privacyAccepted: false,
    marketingOptIn: false,
  });

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      if (!started.current) {
        started.current = true;
        markStarted();
        track("application_start");
      }
      setForm((f) => ({ ...f, [key]: value }));
    },
    [markStarted],
  );

  const errors = state.status === "invalid" ? state.errors : {};

  useEffect(() => {
    if (state.status === "invalid") document.getElementById("error-summary")?.focus();
    if (state.status === "success") {
      track("application_submit");
      document.getElementById("form-result")?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="form-success" id="form-result" tabIndex={-1} role="status">
        <p className="eyebrow">Application received</p>
        <h2>Thank you, {form.name.split(" ")[0]}.</h2>
        <p className="lede">{state.message}</p>
        <p>
          Your reference is <span className="reference">{state.reference}</span>
        </p>
        <p className="muted">Nothing is published about you until you approve your profile after verification.</p>
        <div className="cluster">
          <Link className="btn btn--accent" href="/artist-business-suite">
            See the Artist Business Suite
          </Link>
          <Link className="btn" href="/creatives">
            How joining works
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({ ...form, portfolioLinks: form.portfolioLinks.map((r) => r.trim()).filter(Boolean) }, { turnstileToken, website });
        // Turnstile tokens are single-use: request a fresh one after any failed attempt.
        if (!ok) setResetSignal((n) => n + 1);
      }}
    >
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
          Who are you?
        </legend>
        <div className="form-row">
          <TextField id="name" label="Your name" value={form.name} onChange={(v) => set("name", v)} error={errors.name} autoComplete="name" maxLength={120} />
          <TextField id="stageName" label="Stage or project name" optional value={form.stageName} onChange={(v) => set("stageName", v)} error={errors.stageName} maxLength={120} />
        </div>
        <div className="form-row">
          <TextField id="email" label="Email" type="email" inputMode="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" maxLength={254} />
          <TextField id="phone" label="Phone or WhatsApp" type="tel" inputMode="tel" optional value={form.phone} onChange={(v) => set("phone", v)} error={errors.phone} autoComplete="tel" hint="International format, e.g. +263 77 000 0000" />
        </div>
        <div className="form-row">
          <TextField id="country" label="Country" value={form.country} onChange={(v) => set("country", v)} error={errors.country} autoComplete="country-name" maxLength={80} />
          <TextField id="city" label="City" optional value={form.city} onChange={(v) => set("city", v)} error={errors.city} autoComplete="address-level2" maxLength={80} />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>
          <span className="eyebrow">
            <span className="eyebrow__index">02</span> Your work
          </span>
          What do you do?
        </legend>
        <ChipGroup id="roles" legend="Roles" hint="Up to five." options={creativeRoles} values={form.roles} onChange={(v) => set("roles", v)} error={errors.roles} />
        <ChipGroup id="genres" legend="Genres" hint="Up to six." options={genres} values={form.genres} onChange={(v) => set("genres", v)} error={errors.genres} />
        <SelectField id="experience" label="Experience" value={form.experience} onChange={(v) => set("experience", v)} options={experienceLevels} error={errors.experience} />
        <LinkListField id="portfolioLinks" label="Links to your work" hint="Streaming profiles, videos, a website or a private listening link." values={form.portfolioLinks} onChange={(v) => set("portfolioLinks", v)} error={errors.portfolioLinks} />
        <TextArea id="credits" label="Credits" optional value={form.credits} onChange={(v) => set("credits", v)} error={errors.credits} maxLength={1500} hint="Releases you worked on and your role. We verify credits with the release owner before publishing any." />
        <TextArea id="statement" label="About your work" value={form.statement} onChange={(v) => set("statement", v)} error={errors.statement} maxLength={2000} hint="Your sound, the work you want more of, and your recording set-up if you work remotely." />
        <CheckField id="remoteReady" checked={form.remoteReady} onChange={(v) => set("remoteReady", v)}>
          I can record and deliver remotely to a professional standard.
        </CheckField>
      </fieldset>

      <fieldset className="form-section">
        <legend>
          <span className="eyebrow">
            <span className="eyebrow__index">03</span> Rights and consent
          </span>
          Confirmations
        </legend>
        <CheckField id="rightsConfirmed" required checked={form.rightsConfirmed} onChange={(v) => set("rightsConfirmed", v)} error={errors.rightsConfirmed}>
          I have the right to share the work linked above for review, and the credits I listed are accurate.
        </CheckField>
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
        <Turnstile action="roster-application" onToken={setTurnstileToken} resetSignal={resetSignal} />
        <div className="cluster">
          <button type="submit" className="btn btn--solid" disabled={!submissionsOpen || state.status === "submitting"}>
            {state.status === "submitting" ? "Sending…" : "Send my application"}
          </button>
        </div>
        <p className="field__hint">Applying is free and does not make you exclusive to us.</p>
      </div>
    </form>
  );
}

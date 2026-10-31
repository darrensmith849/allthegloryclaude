"use client";

import type { ReactNode } from "react";
import { Icon } from "@/platform/components/ui/Icon";

// Accessible field primitives: every control has a visible label, hints and
// errors are linked through aria-describedby, and invalid state is announced.

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p className="field__error" id={`${id}-error`}>
      <Icon name="alert" className="btn__icon" />
      {error}
    </p>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  optional,
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  type?: "text" | "email" | "tel" | "url";
  optional?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "url";
  maxLength?: number;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label} {optional ? <span className="field__optional">(optional)</span> : null}
      </label>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={id}
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={optional ? undefined : true}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  maxLength,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  maxLength: number;
  optional?: boolean;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label} {optional ? <span className="field__optional">(optional)</span> : null}
      </label>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <textarea
        id={id}
        name={id}
        className="textarea"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required={optional ? undefined : true}
      />
      <p className="field__hint tabular" aria-hidden="true" style={{ justifySelf: "end" }}>
        {value.length.toLocaleString()} / {maxLength.toLocaleString()}
      </p>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  placeholder = "Choose…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <select
        id={id}
        name={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        aria-required
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function ChipGroup({
  id,
  legend,
  options,
  values,
  onChange,
  error,
  hint,
}: {
  id: string;
  legend: string;
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  hint?: ReactNode;
}) {
  return (
    <fieldset className="field" id={id} aria-describedby={describedBy(id, hint, error)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} tabIndex={-1}>
      <legend className="field__label" style={{ padding: 0, marginBottom: "0.4rem" }}>
        {legend}
      </legend>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <div className="chips">
        {options.map((o) => {
          const checked = values.includes(o.value);
          return (
            <label className="chip" key={o.value}>
              <input
                type="checkbox"
                name={id}
                value={o.value}
                checked={checked}
                onChange={() => onChange(checked ? values.filter((v) => v !== o.value) : [...values, o.value])}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

export function CheckField({
  id,
  checked,
  onChange,
  children,
  error,
  required,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label className="check" htmlFor={id}>
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required ? true : undefined}
        />
        <span>{children}</span>
      </label>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function LinkListField({
  id,
  label,
  values,
  onChange,
  error,
  hint,
  max = 5,
  min = 1,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  hint?: ReactNode;
  max?: number;
  min?: number;
}) {
  return (
    <fieldset className="field" id={id} aria-describedby={describedBy(id, hint, error)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} tabIndex={-1}>
      <legend className="field__label" style={{ padding: 0, marginBottom: "0.4rem" }}>
        {label}
      </legend>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <div className="stack" style={{ ["--stack-gap" as string]: "0.5rem" }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
            <label className="visually-hidden" htmlFor={`${id}-${i}`}>
              {label} {i + 1}
            </label>
            <input
              id={`${id}-${i}`}
              className="input"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={v}
              aria-invalid={error ? true : undefined}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
            />
            {values.length > min ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label={`Remove link ${i + 1}`}>
                Remove
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
      {values.length < max ? (
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange([...values, ""])}>
            Add another link
          </button>
        </div>
      ) : null}
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

export function ErrorSummary({ errors, labels }: { errors: Record<string, string>; labels: Record<string, string> }) {
  const entries = Object.entries(errors).filter(([k]) => k !== "_form");
  if (!entries.length) return null;
  return (
    <div className="form-status form-status--error" role="alert" tabIndex={-1} id="error-summary">
      <p style={{ fontWeight: 600 }}>Please check {entries.length === 1 ? "one answer" : `${entries.length} answers`}:</p>
      <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`}>{labels[field] ?? field}</a>: {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

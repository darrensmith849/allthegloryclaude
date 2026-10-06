"use client";

// A password box with an eye button to show or hide what's typed. While it's
// shown it is plain text, so phones are told not to capitalise, correct or
// "smarten" it (the server tidies those too - tidyPassword in
// src/lib/admin-auth.ts). Takes the same props as <input>.

import { forwardRef, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

const Eye = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const EyeOff = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-2.9 3.7M6.6 6.9C4 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput({ style, ...props }, ref) {
  const [shown, setShown] = useState(false);
  return (
    <span className="pw-field">
      <input
        {...props}
        ref={ref}
        type={shown ? "text" : "password"}
        style={{ ...style, paddingRight: 50 }}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="pw-eye"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        title={shown ? "Hide password" : "Show password"}
      >
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </span>
  );
});

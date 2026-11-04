"use client";

// 🔊 - reads a name (or its meaning) aloud with the phone's / computer's own
// voice. Respellings like "el shah-DYE" are read syllable by syllable, in
// lower case so capitals aren't spelled out letter by letter. Hidden where
// the browser can't speak.

import { useEffect, useState } from "react";

export const speakable = (s: string) => s.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /^en-(GB|ZA|IE|AU)/i.test(v.lang) && v.localService) ??
    voices.find((v) => /^en-(GB|ZA|IE|AU)/i.test(v.lang)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    null
  );
}

export function SayIt({
  text,
  label,
  slow = true,
  className = "",
}: {
  text: string; // what to say
  label: string; // for screen readers, e.g. "Say El Shaddai"
  slow?: boolean;
  className?: string;
}) {
  const [can, setCan] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setCan(true);
    window.speechSynthesis.getVoices(); // starts loading the voices
  }, []);
  if (!can) return null;

  function speak() {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (on) return setOn(false);
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-GB";
    u.rate = slow ? 0.8 : 0.95;
    u.onend = () => setOn(false);
    u.onerror = () => setOn(false);
    setOn(true);
    synth.speak(u);
  }

  return (
    <button
      type="button"
      className={`say-it ${on ? "is-on" : ""} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        speak();
      }}
      aria-label={label}
      title="Hear it said"
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        <path
          d={on ? "M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" : "M15.5 9a4 4 0 0 1 0 6"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

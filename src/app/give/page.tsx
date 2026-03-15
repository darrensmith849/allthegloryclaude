"use client";
import { useState } from "react";

export default function GivePage() {
  const [amount, setAmount] = useState("10");

  async function donate() {
    const res = await fetch("/api/checkout-donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else alert(data?.error ?? "Donations not configured.");
  }

  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Give</h1>
        <p className="mt-4 text-white/70">
          The album is free — but if it blessed you, your giving helps fund what's next.
        </p>

        <div className="mt-8 panel-scrim p-6">
          <label className="text-xs uppercase tracking-[0.28em] text-white/60">Amount (USD)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none"
          />
          <button onClick={donate} className="mt-5 btn btn-primary">Donate →</button>

          <p className="mt-4 text-xs text-white/55">
            Every gift goes straight into recording, production, and releasing new music.
          </p>
        </div>
      </div>
    </main>
  );
}

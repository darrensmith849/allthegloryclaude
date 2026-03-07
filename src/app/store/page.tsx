"use client";

export default function StorePage() {
  async function buy() {
    const res = await fetch("/api/checkout-album", { method: "POST" });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else alert(data?.error ?? "Checkout not configured.");
  }

  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Buy the album</h1>
        <p className="mt-4 text-white/70">Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓 — digital download.</p>

        <div className="mt-8 panel-scrim p-6">
          <div className="text-xl font-semibold text-white">$10</div>
          <button onClick={buy} className="mt-5 btn btn-primary">Checkout →</button>

          <p className="mt-4 text-xs text-white/55">
            Buying supports new releases directly. Streaming helps, but a single purchase funds far more creation than many listens.
          </p>
        </div>
      </div>
    </main>
  );
}

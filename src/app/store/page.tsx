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
        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Buy the album
        </h1>

        <p className="mt-4 text-white/70">
          From Darkness To Light — digital album download.
        </p>

        <div className="mt-8 panel-scrim p-6">
          <div className="text-xl font-semibold text-white">$20</div>

          <button onClick={buy} className="mt-5 btn btn-primary">
            Checkout →
          </button>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            Purchasing the album is a meaningful way to support the work — and it shows you value what's being made.
          </p>

          <p className="mt-3 text-xs text-white/55 leading-relaxed">
            Every purchase and gift goes back into recording, production, and releasing new music.
          </p>

          <a href="/give" className="mt-5 inline-flex btn btn-ghost">
            Give / donate →
          </a>
        </div>
      </div>
    </main>
  );
}

export default function StorePage() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Download the album
        </h1>

        <p className="mt-4 text-white/70">
          From Darkness To Light — free digital download.
        </p>

        <div className="mt-8 panel-scrim p-6">
          <div className="text-xl font-semibold text-white">Free</div>

          <a
            href="/downloads/from-darkness-to-light.zip"
            className="mt-5 inline-flex btn btn-primary"
          >
            Download album →
          </a>

          <p className="mt-4 text-sm text-white/65 leading-relaxed">
            I didn't want to put a price on worship — this is an offering unto the Lord.
          </p>

          <p className="mt-3 text-xs text-white/55 leading-relaxed">
            If this blessed you and you'd like to support what's next, your giving helps fund
            recording, production, and future releases.
          </p>

          <a href="/give" className="mt-5 inline-flex btn btn-ghost">
            Give / donate →
          </a>
        </div>
      </div>
    </main>
  );
}

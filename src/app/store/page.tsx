import Link from "next/link";

export default function StorePage() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Free album download
        </h1>

        <p className="mt-4 text-white/70">
          From Darkness To Light — digital download.
        </p>

        <div className="mt-8 panel-scrim p-6">
          <a
            href="/downloads/from-darkness-to-light.zip"
            className="btn btn-primary"
          >
            Download free →
          </a>

          <p className="mt-5 text-sm text-white/65 leading-relaxed">
            I didn't want to put a price on worship — this is an offering unto the Lord.
          </p>

          <p className="mt-3 text-xs text-white/55 leading-relaxed">
            If you feel led to support the work, your gift goes directly into recording, production,
            and releasing more music.
          </p>

          <Link href="/give" className="mt-5 inline-flex btn btn-ghost">
            Give / donate →
          </Link>

          <p className="mt-4 text-xs text-white/50">
            Upload the album zip to: public/downloads/from-darkness-to-light.zip
          </p>
        </div>
      </div>
    </main>
  );
}

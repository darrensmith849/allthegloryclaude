import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-2xl px-6 pt-36 md:pt-44 pb-24 min-h-[78vh] flex flex-col items-center text-center">
        <div className="eyebrow eyebrow-amber">404</div>

        <h1 className="font-display mt-4 text-5xl md:text-7xl font-normal text-white tracking-tight">
          Lost in the wilderness
        </h1>

        <p className="mt-6 font-display italic text-lg md:text-xl text-white/70 leading-relaxed max-w-lg">
          &ldquo;For the Son of Man came to seek and to save the lost.&rdquo;
        </p>
        <div className="mt-2 eyebrow text-white/40">- Luke 19:10</div>

        <p className="mt-10 text-sm md:text-base text-white/55 max-w-md leading-relaxed">
          The page you were looking for isn&apos;t here - but you are, and
          that&apos;s enough. Head home and start again.
        </p>

        <div className="mt-9 flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn btn-primary">
            Return home →
          </Link>
          <Link href="/album/from-darkness-to-light" className="btn btn-ghost">
            Listen to the album →
          </Link>
        </div>
      </div>
    </main>
  );
}

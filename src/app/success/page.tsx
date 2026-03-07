export default function SuccessPage() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Thank you 🙏</h1>
        <p className="mt-4 text-white/70">Your support makes new music possible.</p>

        <a href="/downloads/from-darkness-to-light.zip" className="mt-8 inline-flex btn btn-primary">
          Download album →
        </a>

        <p className="mt-3 text-xs text-white/55">
          Upload your zip to public/downloads/from-darkness-to-light.zip
        </p>
      </div>
    </main>
  );
}

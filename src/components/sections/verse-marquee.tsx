export default function VerseMarquee() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="panel-soft px-5 py-5 md:px-6 md:py-6">
          <div className="relative overflow-hidden">
            <div className="marquee-single">
              <div className="marquee-single-track">
                <div className="verse-block">
                  <div className="verse-text">
                    &ldquo;The light shines in the darkness, and the darkness
                    has not overcome it.&rdquo;
                  </div>
                </div>
              </div>
            </div>

            {/* Soft edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/30 to-transparent" />
          </div>

          {/* Reference centred underneath */}
          <div className="mt-3 text-center verse-ref-center">John 1:5</div>
        </div>
      </div>
    </section>
  );
}

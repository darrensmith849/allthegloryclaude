import ModoHero from "@/components/sections/modo-hero";
import VerseMarquee from "@/components/sections/verse-marquee";
import Testimony from "@/components/sections/testimony";
import AlbumPromo from "@/components/sections/album-promo";

export default function HomePage() {
  return (
    <>
      <ModoHero />
      <VerseMarquee />
      {/* Testimony Section Preview on home — eyebrow + title + the
          two preview paragraphs and the "Read The Full Story →" CTA.
          titleClassName mirrors the /album page hero's h1 (no
          font-display, .subtitle-glyph on the h2 itself) so the
          unicode-glyph wordmark renders through the same font
          fallback chain on both pages. */}
      <Testimony
        preview
        eyebrow="Testimony"
        titleClassName="subtitle-glyph mt-3 text-2xl md:text-4xl font-semibold text-white"
        title={
          <>
            <span aria-hidden="true">Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓</span>
            <span className="sr-only">From Darkness to Light</span>
          </>
        }
      />
      <AlbumPromo />
    </>
  );
}

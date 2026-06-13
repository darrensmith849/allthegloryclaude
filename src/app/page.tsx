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
          Title uses the same inverted-glyph "Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓"
          treatment as the hero's top-corner micro labels, so the
          motif carries through the page. .subtitle-glyph fixes the
          glyph line clipping; the sr-only span gives screen readers
          the clean readable phrase. */}
      <Testimony
        preview
        eyebrow="Testimony"
        title={
          <>
            <span aria-hidden="true" className="subtitle-glyph">
              Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
            </span>
            <span className="sr-only">From Darkness to Light</span>
          </>
        }
      />
      <AlbumPromo />
    </>
  );
}

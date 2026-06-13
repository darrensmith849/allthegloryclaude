import ModoHero from "@/components/sections/modo-hero";
import VerseMarquee from "@/components/sections/verse-marquee";
import Testimony from "@/components/sections/testimony";
import AlbumPromo from "@/components/sections/album-promo";

export default function HomePage() {
  return (
    <>
      <ModoHero />
      <VerseMarquee />
      {/* Press-kit copy spec — "Testimony Section Preview" on home.
          Heading + eyebrow per the spec; the two preview paragraphs
          and the "Read The Full Story →" CTA live in the Testimony
          component itself when preview is set. /about renders the
          same component without `preview` to show the full long-form
          About All The Glory body. */}
      <Testimony
        preview
        eyebrow="Testimony"
        title="The Story Behind The Songs"
      />
      <AlbumPromo />
    </>
  );
}

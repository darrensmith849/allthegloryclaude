import ModoHero from "@/components/sections/modo-hero";
import VerseMarquee from "@/components/sections/verse-marquee";
import Testimony from "@/components/sections/testimony";
import AlbumPromo from "@/components/sections/album-promo";

export default function HomePage() {
  return (
    <>
      <ModoHero />
      <VerseMarquee />
      {/* Teaser mode — shows the first two paragraphs of Daniel's story
          plus a "Read the full story →" link to /about. /about renders
          the same component without `preview` to show all five paragraphs,
          so the home + about pages each have distinct value instead of
          duplicating the entire testimony. */}
      <Testimony preview />
      <AlbumPromo />
    </>
  );
}

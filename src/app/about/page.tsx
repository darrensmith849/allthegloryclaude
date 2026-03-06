import type { Metadata } from "next";
import Testimony from "@/components/sections/testimony";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind All The Glory — from darkness to light.",
};

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero banner */}
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">About</h1>
          <p className="text-lg md:text-xl text-colour-fg/60 max-w-2xl mx-auto">
            The story behind the music — a testimony of grace, surrender, and
            the relentless pursuit of light in the darkest places.
          </p>
        </div>
      </section>

      <Testimony />

      {/* Additional about content */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-colour-fg mb-8">
            The Mission
          </h2>
          <div className="space-y-6 text-colour-fg/70 text-lg leading-relaxed">
            <p>
              All The Glory exists to create music that speaks into the silence,
              that reaches into the dark corners where hope feels like a foreign
              language, and translates it into something the heart can understand.
            </p>
            <p>
              Every song is a marker on the journey — a reminder that the God who
              began a good work is faithful to complete it. The music is raw,
              honest, and unapologetically hopeful.
            </p>
            <p>
              Whether on stage or in the studio, the aim is the same: to point
              beyond the art to the Artist, beyond the song to the Singer, beyond
              the story to the Author.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

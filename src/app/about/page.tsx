import type { Metadata } from "next";
import Image from "next/image";
import Testimony from "@/components/sections/testimony";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind All The Glory — from darkness to light.",
};

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Dad image — no background, fades into page */}
      <section className="w-full pt-20 md:pt-28 pb-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="relative w-56 h-56 md:w-72 md:h-72">
            <Image
              src="/media/dad.jpg"
              alt="All The Glory"
              fill
              sizes="288px"
              className="object-cover"
              style={{
                maskImage: "radial-gradient(ellipse 50% 50% at 50% 45%, black 60%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 45%, black 60%, transparent 100%)",
              }}
            />
          </div>

          <p className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl">
            The story behind the music — a testimony of grace, surrender, and
            the relentless pursuit of light in the darkest places.
          </p>
        </div>
      </section>

      <Testimony />

      {/* The Mission — glass panel */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="panel-scrim p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">
              The Mission
            </h2>
            <div className="space-y-6 text-white/70 text-lg leading-relaxed">
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
        </div>
      </section>
    </div>
  );
}

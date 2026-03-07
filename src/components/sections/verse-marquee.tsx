"use client";

const verses = [
  "For God so loved the world that He gave His only begotten Son — John 3:16",
  "The light shines in the darkness, and the darkness has not overcome it — John 1:5",
  "I am the way, the truth, and the life — John 14:6",
  "By grace you have been saved through faith — Ephesians 2:8",
  "He has delivered us from the domain of darkness and transferred us to the kingdom of His beloved Son — Colossians 1:13",
];

const SEPARATOR = "   \u2022   ";

export default function VerseMarquee() {
  const text = verses.join(SEPARATOR) + SEPARATOR;

  return (
    <section className="relative w-full overflow-hidden py-10 md:py-14 bg-transparent select-none">
      <div className="marquee-track">
        <span className="marquee-content" aria-label="Scripture verses">
          {text}
        </span>
        <span className="marquee-content" aria-hidden="true">
          {text}
        </span>
      </div>
    </section>
  );
}

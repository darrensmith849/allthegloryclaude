"use client";

import { motion } from "framer-motion";
import { homeGallery } from "@/content/gallery";
import { useState } from "react";

function Tile({
  src,
  alt,
  caption,
  index,
}: {
  src: string;
  alt: string;
  caption?: string;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="image-flow-tile aspect-[3/4]"
    >
      {!imgError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full fallback-gradient" />
      )}
      <div className="image-flow-gradient" />
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <p className="text-sm font-medium tracking-wide" style={{ color: "var(--colour-ink)", opacity: 0.9 }}>
            {caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function ImageFlow() {
  return (
    <section className="relative w-full py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          {homeGallery.map((item, i) => (
            <Tile
              key={i}
              src={item.src}
              alt={item.alt}
              caption={item.caption}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

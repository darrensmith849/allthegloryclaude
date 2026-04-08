"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export default function ImageFlow() {
  const reduce = useReducedMotion();
  const transition = reduce
    ? { duration: 0.01 }
    : { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <section className="relative w-full py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={transition}
        className="w-full"
      >
        <Image
          src="/media/guitar.jpg"
          alt="Daniel Jenkins with guitar"
          width={3960}
          height={2275}
          sizes="100vw"
          className="w-full h-auto object-cover"
          style={{ maxHeight: "80vh" }}
        />
      </motion.div>
    </section>
  );
}

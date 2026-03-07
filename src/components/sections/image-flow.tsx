"use client";

import { motion } from "framer-motion";

export default function ImageFlow() {
  return (
    <section className="relative w-full py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <img
          src="/media/guitar.jpg"
          alt="Daniel Jenkins with guitar"
          className="w-full h-auto object-cover"
          style={{ maxHeight: "80vh" }}
        />
      </motion.div>
    </section>
  );
}

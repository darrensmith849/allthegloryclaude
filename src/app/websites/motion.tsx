"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// Fades and lifts its children in once they scroll into view.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Copies the email address, for people whose computer has no mail app set up.
export function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(email).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => {},
        );
      }}
      className="btn btn-ghost !px-4 !py-2 !text-[11px]"
      aria-label={`Copy ${email}`}
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

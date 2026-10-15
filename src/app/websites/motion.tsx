"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// Fades and lifts its children in once they scroll into view.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
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
      transition={{ duration: reduce ? 0.01 : 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// One line of a big headline, rising up out of a mask. The mask is what's
// watched for coming into view - the text itself starts hidden below it.
export function Rise({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`block overflow-hidden pb-[0.08em] ${className}`}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true }}
    >
      <motion.span
        className="block"
        variants={{ hidden: { y: reduce ? 0 : "110%" }, shown: { y: 0 } }}
        transition={{ duration: reduce ? 0.01 : 1.15, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

// Daniel's local time, ticking. Blank until mounted so the server and
// browser render the same thing.
export function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Johannesburg" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{now || "--:--"}</span>;
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
      className="ws-copy ws-mono"
      aria-label={`Copy ${email}`}
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

"use client";

/**
 * Light-touch page transition. Every route change remounts the children
 * under a new `key={pathname}`, and framer-motion fades them in. We
 * deliberately don't animate exits - the Next App Router cycle makes
 * AnimatePresence-on-exit fiddly, and a calm fade-in is enough to give
 * navigation a premium feel without the complexity.
 *
 * The Study and the dashboard are apps with their own persistent shells
 * (The Study's album player keeps playing between pages), so each keeps
 * one key for all its pages instead of remounting on every route.
 */

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const key = pathname?.startsWith("/study") ? "/study" : pathname?.startsWith("/dashboard") ? "/dashboard" : pathname;

  return (
    <motion.div
      key={key}
      // `initial` must match between server and client renders, so we
      // can't branch on useReducedMotion() here (it returns null on the
      // server and is client-only). Keep the same initial everywhere
      // and collapse the *duration* to near-zero when reduced motion
      // is on - same pattern the rest of the site uses.
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0.01 : 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

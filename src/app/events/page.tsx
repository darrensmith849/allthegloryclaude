"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { eventsConfig } from "@/content/events";
import { site } from "@/content/site";

export default function BookingsPage() {
  const reduce = useReducedMotion();
  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.1, ease: "easeOut" as const };
  const cardTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.35, ease: [0.06, 1, 0.18, 1] as const };
  const secondaryTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.55, ease: [0.06, 1, 0.18, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-3xl px-6 pt-32 md:pt-40 pb-20 md:pb-28 min-h-[78vh] md:min-h-[82vh] flex flex-col">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={headerTransition}
          className="text-center"
        >
          <div className="eyebrow">Bookings & Enquiries</div>
          <h1 className="font-display mt-4 text-4xl md:text-6xl font-normal text-white tracking-tight">
            Live & in person
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-lg mx-auto leading-relaxed">
            No public dates at the moment — for invitations, appearances,
            ministry enquiries, or custom songs written upon request, get
            in touch.
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={cardTransition}
          className="mt-10 md:mt-14 panel-scrim p-7 md:p-10"
          aria-labelledby="bookings-heading"
        >
          <h2
            id="bookings-heading"
            className="eyebrow eyebrow-amber"
          >
            Invite Daniel
          </h2>
          <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed">
            Daniel is available for worship nights, church services, conferences,
            and intimate gatherings. Whether across Zimbabwe or further afield,
            every invitation is prayed over and considered carefully.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/contact" className="btn btn-primary">
              Enquire about a booking →
            </Link>
            <a
              href={site.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Watch online ↗
            </a>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={secondaryTransition}
          className="mt-8 text-center"
        >
          <p className="text-xs uppercase tracking-[0.26em] text-white/45">
            Stay connected
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.22em] text-white/55">
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram ↗
            </a>
            <a
              href={site.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              YouTube ↗
            </a>
            <a
              href={site.socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Spotify ↗
            </a>
          </div>
        </motion.aside>

        {/* Future-ready: when real public dates are added to events.ts,
            they'll render below the bookings card automatically. */}
        {eventsConfig.length > 0 && (
          <section className="mt-12 md:mt-16">
            <h2 className="text-xs uppercase tracking-[0.26em] text-white/60 text-center">
              Upcoming dates
            </h2>
            <div className="mt-6 space-y-3">
              {eventsConfig.map((event, i) => {
                const date = new Date(event.date);
                const month = date.toLocaleDateString("en-GB", { month: "short" });
                const day = date.getDate();
                return (
                  <div
                    key={i}
                    className="panel-scrim flex items-center gap-5 px-5 py-4"
                  >
                    <div className="flex-shrink-0 w-14 text-center">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--colour-amber)]">
                        {month}
                      </p>
                      <p className="text-2xl font-semibold text-white">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {event.title}
                      </h3>
                      <p className="text-xs text-white/55 mt-1">
                        {event.venue} · {event.location}
                      </p>
                    </div>
                    {event.ticketUrl && (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs uppercase tracking-[0.22em] text-[var(--colour-amber)] hover:text-white transition-colors"
                      >
                        Tickets ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

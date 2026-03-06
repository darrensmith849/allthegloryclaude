import type { Metadata } from "next";
import { eventsConfig } from "@/content/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events and live performances by All The Glory.",
};

export default function EventsPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">Events</h1>
          <p className="text-lg md:text-xl text-colour-fg/60">
            Upcoming live performances and appearances.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {eventsConfig.length === 0 ? (
            <p className="text-center text-colour-fg/50 text-lg">
              No upcoming events. Check back soon.
            </p>
          ) : (
            eventsConfig.map((event, i) => {
              const date = new Date(event.date);
              const month = date.toLocaleDateString("en-GB", {
                month: "short",
              });
              const day = date.getDate();

              return (
                <div
                  key={i}
                  className="flex gap-6 p-6 bg-colour-surface rounded-lg hover:bg-colour-fg/5 transition-colors"
                >
                  {/* Date block */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-sm text-colour-accent uppercase tracking-widest">
                      {month}
                    </p>
                    <p className="text-3xl font-bold text-colour-fg">{day}</p>
                  </div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-colour-fg truncate">
                      {event.title}
                    </h2>
                    <p className="text-sm text-colour-fg/50 mt-1">
                      {event.venue} &middot; {event.location}
                    </p>
                  </div>

                  {/* Ticket link */}
                  {event.ticketUrl && (
                    <div className="flex-shrink-0 self-center">
                      <a
                        href={event.ticketUrl}
                        className="px-5 py-2 text-sm font-semibold uppercase tracking-widest border border-colour-accent text-colour-accent hover:bg-colour-accent hover:text-colour-bg transition-colors"
                      >
                        Tickets
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give",
  description: "Support the ministry of All The Glory through a donation.",
};

const tiers = [
  { label: "£5", description: "A coffee for the journey", stripeLink: "#" },
  { label: "£15", description: "Support a recording session", stripeLink: "#" },
  { label: "£50", description: "Fund worship events", stripeLink: "#" },
  { label: "Custom", description: "Give any amount", stripeLink: "#" },
];

export default function GivePage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">Give</h1>
          <p className="text-lg md:text-xl text-colour-fg/60 max-w-2xl mx-auto">
            Every gift fuels the mission — creating music that points people
            from darkness to light.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier, i) => (
              <a
                key={i}
                href={tier.stripeLink}
                className="surface rounded-2xl p-6 text-center hover:border-white/20 transition-colors group"
              >
                <div className="text-3xl font-bold text-colour-accent group-hover:scale-105 transition-transform">
                  {tier.label}
                </div>
                <p className="mt-3 text-xs text-colour-fg/50">
                  {tier.description}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-16 surface rounded-2xl p-6 md:p-8 text-center">
            <h2 className="text-xl font-semibold text-colour-fg mb-3">
              Why Give?
            </h2>
            <p className="text-colour-fg/60 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              All The Glory is an independent ministry. Your generosity directly
              funds studio time, worship events, and getting the message of hope
              to those who need it most. Thank you for sowing into this work.
            </p>
          </div>

          <p className="text-center text-sm text-colour-fg/40 mt-12">
            Donations processed securely via Stripe. Stripe Checkout links will be configured once your Stripe account is connected.
          </p>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
  description: "Buy the album — From Darkness To Light by All The Glory.",
};

const products = [
  {
    name: "From Darkness To Light — Digital Album",
    price: "£9.99",
    description: "Full digital download. All tracks, high-quality audio.",
    stripeLink: "#",
  },
  {
    name: "From Darkness To Light — Physical CD",
    price: "£14.99",
    description: "Physical CD with artwork booklet. Free UK shipping.",
    stripeLink: "#",
  },
];

export default function StorePage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">Store</h1>
          <p className="text-lg md:text-xl text-colour-fg/60">
            Support the music. Own the album.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {products.map((product, i) => (
            <div
              key={i}
              className="surface rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-colour-fg">
                  {product.name}
                </h2>
                <p className="mt-2 text-colour-fg/60 text-sm">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-colour-accent">
                  {product.price}
                </span>
                <a
                  href={product.stripeLink}
                  className="px-6 py-3 bg-colour-accent text-colour-bg text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
                >
                  Buy Now
                </a>
              </div>
            </div>
          ))}

          <p className="text-center text-sm text-colour-fg/40 mt-12">
            Payments processed securely via Stripe. Stripe Checkout links will be configured once your Stripe account is connected.
          </p>
        </div>
      </section>
    </div>
  );
}

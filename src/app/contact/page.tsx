"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(formData: FormData) {
    const errs: Record<string, string> = {};
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const honeypot = formData.get("website") as string;

    if (honeypot) return { __bot: "true" };

    if (!name || name.trim().length < 2) errs.name = "Please enter your name.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Please enter a valid email address.";
    if (!message || message.trim().length < 10)
      errs.message = "Message must be at least 10 characters.";

    return errs;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const validationErrors = validate(formData);

    if (validationErrors.__bot) {
      setSubmitted(true);
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  return (
    <div className="pt-24">
      <section className="w-full pt-20 md:pt-28 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 0.3, ease: "easeOut" }}
          className="max-w-4xl mx-auto px-6 text-center"
        >
          <h1 className="modo-title text-colour-fg mb-6">Contact</h1>
          <p className="text-lg md:text-xl text-colour-fg/60">
            Get in touch.
          </p>
        </motion.div>
      </section>

      <section className="w-full py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 3, delay: 1, ease: [0.06, 1, 0.18, 1] }}
          className="max-w-xl mx-auto px-6"
        >
          {submitted ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-colour-fg mb-4">
                Thank you
              </h2>
              <p className="text-colour-fg/60">
                Your message has been received. We&apos;ll be in touch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  name="website"
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-colour-fg/70 mb-2"
                >
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  required
                  rows={6}
                  className="w-full bg-colour-surface border border-colour-fg/10 rounded px-4 py-3 text-colour-fg placeholder:text-colour-fg/30 focus:outline-none focus:border-colour-accent transition-colors resize-none"
                  placeholder="Your message..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-colour-accent text-colour-bg font-semibold text-sm uppercase tracking-widest hover:bg-colour-fg transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}

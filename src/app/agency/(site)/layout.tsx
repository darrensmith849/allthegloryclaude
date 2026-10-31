import type { ReactNode } from "react";
import { AudioProvider } from "@/platform/components/roster/AudioPlayer";
import { Footer } from "@/platform/components/site/Footer";
import { Header } from "@/platform/components/site/Header";
import { RevealObserver } from "@/platform/components/site/motion";
import { PageViewTracker } from "@/platform/components/site/PageViewTracker";
import "@/platform/styles/site.css";

// Public website shell. The demonstrations under /demo use their own layout
// and stylesheet, so public pages never ship dashboard code.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <PageViewTracker />
      <RevealObserver />
    </AudioProvider>
  );
}

import type { Metadata } from "next";

// alltheglory.co.za/join - the short link to share (WhatsApp, email): The
// Study page, with a "starting again at Genesis 1" preview picture and The
// Study's light dove as its icon.

const title = "Join The Study - All The Glory";
const description =
  "Read the whole Bible together - starting again at Genesis 1, one day at a time, in the order it happened. Free: your own journal, the Hebrew and Greek behind the words, and Daniel's notes for each day.";

export const metadata: Metadata = {
  title: "Join The Study",
  description,
  alternates: { canonical: "/the-study" },
  icons: {
    icon: [{ url: "/study/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: "/study/apple-icon.png",
  },
  openGraph: {
    title,
    description,
    url: "/join",
    images: [{ url: "/study/og-join.jpg", width: 1200, height: 630, alt: "The Study - starting again at Genesis 1" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/study/og-join.jpg"] },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}

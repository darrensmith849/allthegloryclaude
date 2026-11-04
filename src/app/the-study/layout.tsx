import type { Metadata } from "next";

const description =
  "A free daily Bible study from All The Glory - read through the Bible in the order it happened, keep your own journal, and follow Daniel's notes.";

export const metadata: Metadata = {
  title: "The Study",
  description,
  alternates: { canonical: "/the-study" },
  icons: {
    icon: [{ url: "/study/favicon.png", sizes: "64x64", type: "image/png" }],
    apple: "/study/apple-icon.png",
  },
  openGraph: {
    title: "The Study - All The Glory",
    description,
    url: "/the-study",
    images: [{ url: "/study/og.jpg", width: 1200, height: 630, alt: "The Study - All The Glory" }],
  },
  twitter: { card: "summary_large_image", title: "The Study - All The Glory", description, images: ["/study/og.jpg"] },
};

export default function TheStudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

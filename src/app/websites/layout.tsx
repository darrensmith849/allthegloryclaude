import type { Metadata } from "next";
import "./websites.css";

// /websites - Daniel's web design page, styled after the Manuchie site in
// his own colours (./websites.css). It uses the site's own fonts (Fraunces
// + Inter from the root layout) but stands alone: the album nav, footer,
// socials, music player and sky backdrop are hidden here (see
// components/site/*).

const title = "Websites by Daniel Jenkins";
// What shows in Google: names the job and the places, so searches like
// "website designer South Africa / Zimbabwe" can find the page.
const searchTitle = "Website Designer in South Africa & Zimbabwe | Daniel Jenkins";
const description =
  "Beautiful websites, built with purpose. Custom websites for companies, ministries and people - see sites I've built and start a project.";
const searchDescription =
  "Custom websites designed and built from scratch for businesses, brands and ministries across South Africa and Zimbabwe - fast, found on Google and easy to reach you on WhatsApp. See sites I've built.";

export const metadata: Metadata = {
  title: { absolute: searchTitle },
  description: searchDescription,
  alternates: { canonical: "/websites" },
  robots: { index: true, follow: true },
  icons: { icon: "/media/websites/icon.png?v=dove", apple: "/media/websites/apple-icon.png?v=dove" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/websites",
    images: [{ url: "/media/websites/og.jpg", width: 1200, height: 630, alt: "Websites by Daniel Jenkins" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: "/media/websites/og.jpg", width: 1200, height: 630, alt: "Websites by Daniel Jenkins" }],
  },
};

// Tells Google this page is a web design service, who runs it and where.
const serviceData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Websites by Daniel Jenkins",
  description: searchDescription,
  url: "https://alltheglory.co.za/websites",
  image: "https://alltheglory.co.za/media/websites/og.jpg",
  telephone: "+27846651423",
  email: "daniel@alltheglory.co.za",
  areaServed: [
    { "@type": "Country", name: "South Africa" },
    { "@type": "Country", name: "Zimbabwe" },
  ],
  serviceType: ["Web design", "Web development"],
  founder: {
    "@type": "Person",
    name: "Daniel Jenkins",
    sameAs: ["https://www.linkedin.com/in/danieljenkinsofficial/", "https://www.instagram.com/allthe_glory"],
  },
};

export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }} />
      {children}
    </>
  );
}

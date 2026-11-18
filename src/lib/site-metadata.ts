import type { Metadata, Viewport } from "next";

/** One place for the origin: sitemap, robots, canonicals and OG all read it. */
export const SITE_URL = "https://baza-de-tratament.vercel.app";

/**
 * Shared by both root layouts. Per-locale titles/canonicals live in
 * app/[lang]/page.tsx `generateMetadata`, which merges over this.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "#baza_de_tratament — meniu",
  description:
    "Meniul digital #baza_de_tratament: cafea, băuturi calde, long drinks, bere și mâncare. Patru limbi, prețuri cu TVA inclus.",
  applicationName: "#baza_de_tratament",
  keywords: ["meniu", "menu", "baza de tratament", "cafea", "long drinks", "București"],
  openGraph: {
    title: "#baza_de_tratament — meniu",
    description:
      "Cafea, băuturi calde, long drinks, bere și mâncare. Meniu digital în română, engleză, bulgară și sârbă.",
    type: "website",
    locale: "ro_RO",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "#baza_de_tratament" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/og.png"] },
  formatDetection: { telephone: false },
};

export const baseViewport: Viewport = {
  themeColor: "#08080b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

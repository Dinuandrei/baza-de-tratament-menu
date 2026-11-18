import type { Metadata, Viewport } from "next";

/**
 * Shared by both root layouts. Per-locale titles/canonicals live in
 * app/[lang]/page.tsx `generateMetadata`, which merges over this.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL("https://baza-de-tratament.vercel.app"),
  title: "#baza_de_tratament — meniu",
  description:
    "Meniul digital #baza_de_tratament: cafea, băuturi calde, long drinks, bere și mâncare. Available in English, Bulgarian and Serbian.",
  applicationName: "#baza_de_tratament",
  keywords: ["meniu", "menu", "baza de tratament", "cafea", "long drinks", "București"],
  openGraph: {
    title: "#baza_de_tratament — meniu",
    description:
      "Cafea, băuturi calde, long drinks, bere și mâncare. Meniu digital în română, engleză, bulgară și sârbă.",
    type: "website",
    locale: "ro_RO",
  },
  formatDetection: { telephone: false },
};

export const baseViewport: Viewport = {
  themeColor: "#08080b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  themeColor: "#08080b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={archivo.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { archivo } from "@/lib/fonts";
import { baseMetadata, baseViewport } from "@/lib/site-metadata";
import "../globals.css";

export const metadata: Metadata = baseMetadata;
export const viewport: Viewport = baseViewport;

/**
 * Root layout for the language wheel at "/". The menu has its own root layout
 * inside [lang] (see app/[lang]/layout.tsx) so <html lang> can follow the URL.
 */
export default function ChooserLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={archivo.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}

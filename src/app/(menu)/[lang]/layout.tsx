import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { archivo } from "@/lib/fonts";
import { isLocale, locales } from "@/lib/i18n";
import { baseMetadata, baseViewport } from "@/lib/site-metadata";
import "../../globals.css";

export const metadata: Metadata = baseMetadata;
export const viewport: Viewport = baseViewport;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * Root layout for the menu. It lives inside [lang] on purpose: <html lang> can
 * only be set by a root layout, and a shared one cannot see the segment — every
 * route used to ship lang="ro", which mispronounces bg/sr for screen readers
 * and sends the wrong language signal to search engines.
 */
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={archivo.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}

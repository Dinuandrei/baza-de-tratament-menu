import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site-metadata";

/**
 * Four routes, each advertising the other three as alternates: this is the only
 * crawlable path into the menu, since the picker navigates with JS.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...locales.map((locale) => ({
      url: `${SITE_URL}/${locale}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`])),
      },
    })),
  ];
}

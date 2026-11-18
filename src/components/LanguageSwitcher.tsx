"use client";

import { useEffect } from "react";
import Link from "next/link";
import { localeHtmlLang, localeLabels, locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ current }: { current: Locale }) {
  // <html lang> lives on the root layout, so keep the document language honest per route.
  useEffect(() => {
    document.documentElement.lang = localeHtmlLang[current];
  }, [current]);

  return (
    <nav aria-label="Language" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      {locales.map((locale) => {
        const active = locale === current;

        return (
          <Link
            key={locale}
            href={`/${locale}`}
            hrefLang={localeHtmlLang[locale]}
            aria-current={active ? "true" : undefined}
            className={`flex min-h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[10px] font-black uppercase tracking-wider transition-colors sm:min-h-9 sm:min-w-11 sm:px-3 sm:text-[11px] ${
              active
                ? "bg-brand text-ink"
                : "border border-line text-muted hover:border-brand/60 hover:text-white"
            }`}
          >
            {locale}
            <span className="sr-only"> — {localeLabels[locale]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

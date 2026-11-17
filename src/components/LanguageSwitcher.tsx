"use client";

import Link from "next/link";
import { localeLabels, locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ current }: { current: Locale }) {
  return (
    <nav aria-label="Language" className="flex items-center gap-1">
      {locales.map((locale) => {
        const active = locale === current;

        return (
          <Link
            key={locale}
            href={`/${locale}`}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            className={`flex min-h-9 min-w-11 items-center justify-center rounded-full px-3 text-[11px] font-black uppercase tracking-wider transition-colors ${
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

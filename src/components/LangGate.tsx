"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLocale, localeLabels, locales, t, type Locale } from "@/lib/i18n";

const COOKIE = "bt_lang";

export function LangGate() {
  const router = useRouter();
  const [saved, setSaved] = useState<Locale | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)bt_lang=([a-z]{2})/);
    if (match && isLocale(match[1])) setSaved(match[1]);
  }, []);

  function choose(locale: Locale) {
    document.cookie = `${COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(`/${locale}`);
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-muted">
        choose language
      </p>

      <ul className="mt-5 overflow-hidden rounded-[2rem] border border-line bg-surface/80 backdrop-blur">
        {locales.map((locale, index) => {
          const active = saved === locale;

          return (
            <li key={locale} className={index > 0 ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => choose(locale)}
                className={`flex w-full items-center justify-between px-6 py-4 text-left text-xl font-extrabold uppercase tracking-tight transition-colors ${
                  active
                    ? "bg-brand text-ink"
                    : "text-white/85 hover:bg-surface-2 hover:text-white"
                }`}
              >
                {localeLabels[locale]}
                {active ? (
                  <span className="text-xs font-black uppercase tracking-widest">
                    {t.continueAs[locale]}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

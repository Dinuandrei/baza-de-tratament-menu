import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";import { MenuList } from "@/components/MenuList";
import { ScrollProgress } from "@/components/ScrollProgress";
import { isLocale, localeLabels, locales, t } from "@/lib/i18n";
import { getCategories } from "@/lib/sanity";

export const dynamicParams = false;

// Content lives in Sanity now: revalidate instead of baking the menu in at build time.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const titles: Record<string, string> = {
    ro: "#baza_de_tratament — meniu",
    en: "#baza_de_tratament — menu",
    bg: "#baza_de_tratament — меню",
    sr: "#baza_de_tratament — мени",
  };

  return {
    title: titles[lang],
    description: t.metaDescription[lang],
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: titles[lang],
      description: t.metaDescription[lang],
      locale: lang,
      // Next replaces nested metadata objects instead of merging them, so the
      // shared og:image has to be repeated here or the preview card loses it.
      images: ["/brand/og.png"],
    },
  };
}

export default async function MenuPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const categories = await getCategories();

  return (
    <div className="poster-bg min-h-dvh">
      {/* Paradox of the Active User: no manual, no onboarding — jump straight to the list. */}
      <a
        href="#meniu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
      >
        {t.menu[lang]}
      </a>

      <header className="sticky top-0 z-20 border-b border-line/80 bg-ink/85 backdrop-blur-md">
        {/* One row on every phone width; it only wraps when the viewport is so
            narrow (≈130% zoom) that a single row cannot fit at all. */}
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 max-[300px]:flex-wrap max-[300px]:gap-y-1 sm:gap-3 sm:py-3">
          <Link
            href="/"
            aria-label={t.back[lang]}
            title={localeLabels[lang]}
            className="shrink-0"
          >
            <Logo />
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-muted sm:block">
              {t.language[lang]}
            </span>
            <LanguageSwitcher current={lang} />
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-2 sm:pb-2.5">
          <CategoryNav categories={categories} locale={lang} />
        </div>
        <ScrollProgress />
      </header>

      <main id="meniu" className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            {t.menu[lang]}
          </h1>
          <Link
            href="/"
            className="flex min-h-9 shrink-0 items-center rounded-full border border-line px-3 text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:border-brand/60 hover:text-white"
          >
            {t.back[lang]}
          </Link>
        </div>

        <MenuList categories={categories} locale={lang} />

        <footer className="mt-10 flex flex-col items-center gap-3 border-t border-line pt-6 text-center">
          <Logo size="md" />
          <p className="max-w-xs text-[11px] leading-relaxed text-muted">{t.pricesNote[lang]}</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted/50">
            {locales.map((l) => `/${l}`).join(" · ")}
          </p>
        </footer>
      </main>
    </div>
  );
}

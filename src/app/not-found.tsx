import Link from "next/link";
// No route-group layout wraps this file, so it has to pull the stylesheet in itself.
import "./globals.css";
import { Logo } from "@/components/Logo";
import { locales } from "@/lib/i18n";

/**
 * Global 404. A mistyped link used to drop people on Next's default page: white,
 * in English, with no way back into the menu.
 *
 * No <html>/<body> here on purpose — Next supplies the document for this route,
 * and adding our own produced two nested documents in the HTML.
 */
export default function NotFound() {
  return (
    <main
      lang="ro"
      className="poster-bg flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-5 text-center text-white antialiased"
    >
      {/* Next supplies the document for this route but gives it neither a title
          nor a lang, and axe flags both (serious). React 19 hoists <title>, and
          the inline script sets lang before paint — the layout chain that would
          normally do this does not wrap an unmatched path. */}
      <title>#baza_de_tratament — pagina nu există</title>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='ro'" }}
      />
      <Link href="/" className="flex w-full justify-center" aria-label="#baza_de_tratament">
        <Logo size="lg" />
      </Link>

      <p className="text-[64px] font-black leading-none tracking-tight text-brand">404</p>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-black uppercase tracking-tight">Pagina nu există</h1>
        <p className="text-sm leading-relaxed text-muted">
          Linkul e greșit sau pagina s-a mutat. Meniul e la un click distanță.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          This page does not exist — the menu is one click away.
        </p>
      </div>

      <Link
        href="/"
        className="flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-black uppercase tracking-tight text-ink transition-transform hover:scale-[1.03] active:scale-100"
      >
        Vezi meniul →
      </Link>

      <nav aria-label="Language" className="flex flex-wrap items-center justify-center gap-2">
        {locales.map((locale) => (
          <Link
            key={locale}
            href={`/${locale}`}
            hrefLang={locale}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-line px-3 text-[11px] font-black uppercase tracking-wider text-muted transition-colors hover:border-brand/60 hover:text-white"
          >
            {locale}
          </Link>
        ))}
      </nav>
    </main>
  );
}

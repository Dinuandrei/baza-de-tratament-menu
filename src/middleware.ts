import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@/lib/i18n";

/**
 * Postel's Law — be liberal in what you accept.
 * `/RO`, `/En/`, `//ro//` all resolve to the canonical `/{lang}` route,
 * and unknown 2-letter codes fall back to the picker instead of a 404.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clean = pathname.replace(/\/{2,}/g, "/");
  const match = clean.match(/^\/([A-Za-z]{2})(?:\/(.*))?$/);

  let target: string | null = null;

  if (match) {
    const lang = match[1].toLowerCase();
    const rest = match[2] ? `/${match[2].replace(/\/+$/, "")}` : "";

    if ((locales as readonly string[]).includes(lang)) {
      const canonical = `/${lang}${rest}`;
      if (canonical !== pathname) target = canonical;
    } else {
      target = "/";
    }
  } else if (clean !== pathname && clean !== "/") {
    target = clean;
  }

  if (target) {
    // Carry the query string over: `/RO?utm_source=qr` arrives from a printed QR
    // code, and `new URL(target, request.url)` on a bare path would drop it.
    const url = new URL(target, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};

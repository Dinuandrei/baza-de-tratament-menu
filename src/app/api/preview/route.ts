import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { safeEqual } from "@/lib/webhook-secret";

/**
 * Opens the menu in Draft Mode, so an editor can see unpublished changes
 * without pressing Publish first.
 *
 *   /api/preview?secret=<SANITY_PREVIEW_SECRET>&lang=ro
 *
 * The secret is shared with the Studio (a "Preview" document action can open
 * this URL). The Sanity read token never leaves the server, and only the four
 * known locales are accepted — an attacker-supplied slug cannot become an open
 * redirect.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.SANITY_PREVIEW_SECRET;
  if (!expected) {
    return new Response("SANITY_PREVIEW_SECRET is not configured", { status: 500 });
  }

  const secret = url.searchParams.get("secret") ?? "";
  if (!secret || !safeEqual(secret, expected)) {
    return new Response("Invalid token", { status: 401 });
  }

  const lang = (url.searchParams.get("lang") ?? "ro").toLowerCase();
  if (!isLocale(lang)) {
    return new Response(`Invalid language. Use one of: ${locales.join(", ")}`, { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(`/${lang}`);
}

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

/**
 * Leaves Draft Mode. POST only: disabling a mode is a state change, and a GET
 * link could be triggered by a browser prefetch.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const requested = String(form?.get("next") ?? "/");

  // Only local paths: "//evil.example" is a protocol-relative URL, not a path.
  const safe = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  const lang = safe.slice(1);

  const draft = await draftMode();
  draft.disable();

  redirect(isLocale(lang) ? safe : "/");
}

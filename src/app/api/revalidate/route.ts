import { createClient } from "@sanity/client";
import { clientKey, takeBurst, takeDaily } from "@/lib/rate-limit";
import { revalidateMenu } from "@/lib/revalidate";
import { isAuthorizedWebhook, safeEqual, webhookSecrets } from "@/lib/webhook-secret";

/**
 * Sanity webhook → POST /api/revalidate → cache invalidated.
 *
 * The menu pages are ISR with a 60 s safety net. Without this route a price or a
 * photograph could take a minute to appear after the owner presses Publish; with
 * it, the next visitor gets the fresh page immediately. `revalidatePath` in a
 * Route Handler only marks the page stale — the regeneration happens on the next
 * visit, which is exactly the behaviour we want.
 *
 * It also covers the documents the translator does not touch (category titles,
 * `siteSettings`, deletions), which is why it runs on every menu mutation.
 */
export const dynamic = "force-dynamic";

const BURST_MAX = 30;
const BURST_WINDOW_MS = 60_000;
const DAILY_MAX = 600;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

async function handle(request: Request, querySecret?: string) {
  const burst = takeBurst(`revalidate:${clientKey(request)}`, BURST_MAX, BURST_WINDOW_MS);
  if (!burst.ok) {
    return json(
      { ok: false, error: "too many requests" },
      429,
      { "retry-after": String(burst.retryAfter) },
    );
  }

  const secrets = webhookSecrets();
  if (secrets.length === 0) {
    return json({ ok: false, error: "TRANSLATE_WEBHOOK_SECRET is not configured" }, 500);
  }

  const authorized =
    querySecret !== undefined
      ? secrets.some((secret) => safeEqual(querySecret, secret))
      : isAuthorizedWebhook(request);
  if (!authorized) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // A cheap global guard against a loop (e.g. a misconfigured webhook that
  // listens to its own writes). The counter lives in Sanity, so it is shared.
  const canary = process.env.SANITY_WRITE_TOKEN
    ? await takeDaily(
        createClient({
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "w6d4ck0i",
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
          apiVersion: "2024-03-27",
          useCdn: false,
          token: process.env.SANITY_WRITE_TOKEN,
        }),
        "revalidate",
        DAILY_MAX,
      )
    : { ok: true as const };

  if (!canary.ok) {
    return json(
      { ok: false, error: "daily revalidation limit reached" },
      429,
      { "retry-after": String(canary.retryAfter) },
    );
  }

  try {
    // Invalidates all four locales and the tagged Sanity data in one call.
    revalidateMenu();
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : "revalidation failed" },
      500,
    );
  }

  return json({ ok: true, revalidated: "/[lang]" });
}

export async function POST(request: Request) {
  return handle(request);
}

/**
 * Manual trigger for an owner who wants to force a refresh from a browser:
 * `/api/revalidate?secret=…`. Kept POST-only for the automated path; the GET
 * accepts the secret in the query string because a browser cannot set headers.
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secret) return json({ ok: false, error: "missing secret" }, 401);
  // Pass the secret directly instead of forging a Request: that would lose the
  // x-forwarded-for header and put every manual refresh in one burst bucket.
  return handle(request, secret);
}

import type { SanityClient } from "@sanity/client";

/**
 * Rate limiting for the public, secret-gated write endpoints.
 *
 * Two layers on purpose:
 *  - a burst limiter in memory, checked BEFORE the secret is compared, so a
 *    caller that hammers the URL cannot even brute-force it (per warm instance,
 *    which is enough to make guessing hopeless);
 *  - a global daily cap stored in Sanity, so a leaked secret cannot burn the
 *    translation quota no matter how many instances Vercel spins up.
 *
 * Failing open on a Sanity error is deliberate: a limiter outage must not stop
 * the menu from being translated.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Returns `retryAfter` seconds when the caller is over the burst budget. */
export function takeBurst(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Keep the map from growing without bound on a long-lived instance.
    if (buckets.size > 2000) {
      for (const [entry, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(entry);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { ok: true };
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
}

/**
 * One counter document per day (`ratelimit-<scope>-YYYY-MM-DD`), incremented
 * atomically. 365 docs a year instead of one per event, and no document grows
 * without bound.
 */
export async function takeDaily(
  client: SanityClient,
  scope: string,
  max: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const day = new Date().toISOString().slice(0, 10);
  const id = `ratelimit-${scope}-${day}`;

  try {
    const count = await client.fetch<number | null>(`*[_id == $id][0].n`, { id });
    if (typeof count === "number" && count >= max) {
      return { ok: false, retryAfter: secondsUntilUtcMidnight() };
    }

    await client
      .transaction()
      .createIfNotExists({ _id: id, _type: "rateLimit", scope, day, n: 0 })
      .patch(id, (patch) => patch.inc({ n: 1 }))
      // Sync: with an async commit a fast burst reads the same counter value and
      // the daily cap can be overshot. The extra round-trip is worth a real cap.
      .commit({ visibility: "sync" });

    return { ok: true };
  } catch (error) {
    // A limiter that is down must not take translation with it.
    console.warn("[rate-limit] counter unavailable, allowing the call", error);
    return { ok: true };
  }
}

/** Best-effort client address. Stored nowhere; used only as a burst key. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

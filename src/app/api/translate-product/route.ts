import { createClient } from "@sanity/client";
import { clientKey, takeBurst, takeDaily } from "@/lib/rate-limit";
import { revalidateMenu } from "@/lib/revalidate";
import { descriptionHash, ingredientsHash, nameHash, sourceHash } from "@/lib/translation-source";
import { isAuthorizedWebhook, webhookSecrets } from "@/lib/webhook-secret";
import type { Locale } from "@/lib/i18n";

/**
 * Same provider choice as studio/scripts/translate.ts: Azure when a key is set,
 * Gemini otherwise. Hardcoding Gemini here made the documented Azure setup fail
 * with “GOOGLE_API_KEY is not set” on the first publish.
 */
type TranslateFn = (texts: string[], to: string, from?: string) => Promise<string[]>;

async function loadTranslator(): Promise<{ translate: TranslateFn; provider: string }> {
  if (process.env.AZURE_TRANSLATOR_KEY) {
    const { translateTexts } = await import("@/lib/translate");
    return { translate: translateTexts, provider: "azure" };
  }
  const { translateTexts } = await import("@/lib/translate-gemini");
  return {
    translate: translateTexts as (texts: string[], to: string, from?: string) => Promise<string[]>,
    provider: "gemini",
  };
}

/**
 * Translates a product into the other three languages when it is published.
 *
 *   Sanity webhook (menuItem published) → POST /api/translate-product →
 *   Gemini → patch the same document
 *
 * Three things keep this safe:
 *  - a shared secret header plus two rate-limit layers (burst before the secret
 *    is even compared, and a global daily cap) so a leaked secret cannot burn
 *    the translation quota;
 *  - an idempotency fingerprint: the patch stores a hash of the Romanian source,
 *    and a run whose hash matches writes nothing. Our own write triggers another
 *    webhook, that one matches and stops — the loop terminates by construction;
 *  - writes by PATH ("description.bg"), never by re-sending the whole object, so
 *    a concurrent edit in the Studio cannot be reverted by a stale copy.
 *
 * After a successful write the menu pages are revalidated on demand, so a
 * translation lands in seconds rather than on the next 60 s ISR tick.
 */

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const LOCALES: Locale[] = ["en", "bg", "sr"];

type Doc = {
  _id: string;
  name?: Partial<Record<Locale, string>>;
  description?: Partial<Record<Locale, string>>;
  ingredients?: Partial<Record<Locale, string[]>>;
  translationSource?: {
    hash?: string | null;
    nameHash?: string | null;
    descriptionHash?: string | null;
    ingredientsHash?: string | null;
  } | null;
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "w6d4ck0i";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const readClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-03-27",
  useCdn: false,
  perspective: "published",
});

/** Product names are proper nouns on a menu; models occasionally lowercase them. */
function capitalized(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? trimmed : trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

const BURST_MAX = 12;
const BURST_WINDOW_MS = 60_000;
const DAILY_MAX = 120;

export async function POST(request: Request) {
  // Before the secret check: a caller that hammers the URL never gets to guess.
  const burst = takeBurst(`translate:${clientKey(request)}`, BURST_MAX, BURST_WINDOW_MS);
  if (!burst.ok) {
    return json(
      { ok: false, error: "too many requests" },
      429,
      { "retry-after": String(burst.retryAfter) },
    );
  }

  if (webhookSecrets().length === 0) {
    return json({ ok: false, error: "TRANSLATE_WEBHOOK_SECRET is not configured" }, 500);
  }
  if (!isAuthorizedWebhook(request)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    return json({ ok: false, error: "SANITY_WRITE_TOKEN is not configured" }, 500);
  }

  // `null`, a string, a number and an array are all valid JSON, and the webhook
  // body is not trusted to be the object Sanity sends: `null` used to reach
  // `payload._id` and turn a 400 into a 500.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "body is not JSON" }, 400);
  }

  if (typeof payload !== "object" || payload === null) {
    return json({ ok: false, error: "body is not a JSON object" }, 400);
  }

  const id = (payload as { _id?: unknown })._id;
  if (!id) return json({ ok: false, error: "missing _id" }, 400);
  // `id.startsWith` on a number threw a TypeError and answered 500, which Sanity
  // reads as "the endpoint is broken" and retries.
  if (typeof id !== "string") return json({ ok: false, error: "invalid _id" }, 400);

  // Drafts are the editor typing; only published documents are translated.
  if (id.startsWith("drafts.")) return json({ ok: true, skipped: "draft" });

  const writer = createClient({
    projectId,
    dataset,
    apiVersion: "2024-03-27",
    useCdn: false,
    token,
  });

  const doc = await readClient.fetch<Doc | null>(
    `*[_id == $id][0]{_id, name, description, ingredients, translationSource}`,
    { id },
  );

  if (!doc) return json({ ok: true, skipped: "not found (deleted or unpublished)" });

  if (!doc.name?.ro && !doc.description?.ro && !doc.ingredients?.ro?.length) {
    return json({ ok: true, skipped: "no romanian text to translate from" });
  }

  const hash = sourceHash(doc);
  const currentNameHash = nameHash(doc);
  const currentDescriptionHash = descriptionHash(doc);
  const currentIngredientsHash = ingredientsHash(doc);
  const stored = doc.translationSource;

  // Per-field staleness: a change to the description must not rewrite ingredient
  // lists that were already translated (and possibly corrected by hand).
  //
  // Names are the exception: every product seeded before names were translatable
  // has a name in all four languages (brands deliberately identical) and no
  // nameHash. Treating those as stale would retranslate — and possibly mangle —
  // hand-approved brand names the first time somebody edits a price. So a name
  // is translated when a locale is missing, or when the Romanian name changed
  // after we had already fingerprinted it.
  const hasEveryName = LOCALES.every((locale) => (doc.name?.[locale] ?? "").trim() !== "");
  const nameStale =
    (doc.name?.ro ?? "").trim() !== "" &&
    (!hasEveryName || (stored?.nameHash != null && stored.nameHash !== currentNameHash));

  const descriptionStale =
    (doc.description?.ro ?? "").trim() !== "" && stored?.descriptionHash !== currentDescriptionHash;
  const ingredientsStale =
    (doc.ingredients?.ro ?? []).length > 0 && stored?.ingredientsHash !== currentIngredientsHash;

  if (!nameStale && !descriptionStale && !ingredientsStale) {
    // Either this is our own write coming back through the webhook, or nothing
    // translatable changed since the last run — the loop stops here.
    return json({ ok: true, skipped: "already translated", hash });
  }

  // Global cap shared by every instance: 120 translated publishes per day is far
  // above a real menu's edit rate, but bounds the cost of a leaked secret. Charged
  // only once a run will really call the provider: a publish that changes a price
  // (or comes back as our own echo) must not spend the day's budget.
  const daily = await takeDaily(writer, "translate", DAILY_MAX);
  if (!daily.ok) {
    return json(
      { ok: false, error: "daily translation limit reached" },
      429,
      { "retry-after": String(daily.retryAfter) },
    );
  }

  const { translate: translateTexts, provider } = await loadTranslator();

  const patch: Record<string, unknown> = {};
  const failures: string[] = [];

  for (const locale of LOCALES) {
    // One request per locale: the name, the description and its ingredients ride
    // together so the model sees the product as a whole, and it is one call.
    // `slots` keeps the reply aligned with the fields even when some are skipped.
    const slots: Array<{ path: string; kind: "text" | "list"; values: string[] }> = [];

    const name = nameStale ? (doc.name?.ro ?? "").trim() : "";
    if (name !== "") slots.push({ path: `name.${locale}`, kind: "text", values: [name] });

    const description = descriptionStale ? (doc.description?.ro ?? "").trim() : "";
    if (description !== "") {
      slots.push({ path: `description.${locale}`, kind: "text", values: [description] });
    }

    if (ingredientsStale) {
      const ingredients = (doc.ingredients?.ro ?? []).filter((entry) => entry.trim() !== "");
      if (ingredients.length > 0) {
        slots.push({ path: `ingredients.${locale}`, kind: "list", values: ingredients });
      }
    }

    const input = slots.flatMap((slot) => slot.values);
    if (input.length === 0) continue;

    try {
      const translated = await translateTexts(input, locale);

      // A short or long reply would shift every value onto the wrong field.
      if (translated.length !== input.length) {
        throw new Error(`expected ${input.length} strings, got ${translated.length}`);
      }

      // An empty string is not a translation. Writing one would blank a finished
      // field and stamp the fingerprint as done, so the gap could never be
      // retried; treat the locale as failed and let the next publish try again.
      if (translated.some((value) => value.trim() === "")) {
        throw new Error("provider returned an empty translation");
      }

      let cursor = 0;
      for (const slot of slots) {
        const slice = translated.slice(cursor, cursor + slot.values.length);
        cursor += slot.values.length;
        if (slot.kind === "list") {
          patch[slot.path] = slice;
        } else {
          const value = slice[0] ?? "";
          patch[slot.path] = slot.path.startsWith("name.") ? capitalized(value) : value;
        }
      }
    } catch (error) {
      failures.push(`${locale}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const complete = failures.length === 0;
  patch.translationSource = {
    _type: "translationSource",
    // Keep the previous fingerprints when a locale failed, so the next publish
    // retries instead of pretending the document is done.
    hash: complete ? hash : (stored?.hash ?? ""),
    nameHash: complete && nameStale ? currentNameHash : (stored?.nameHash ?? ""),
    descriptionHash: complete && descriptionStale ? currentDescriptionHash : (stored?.descriptionHash ?? ""),
    ingredientsHash: complete && ingredientsStale ? currentIngredientsHash : (stored?.ingredientsHash ?? ""),
    at: new Date().toISOString(),
    provider,
    status: complete ? "ok" : failures.join(" | ").slice(0, 200),
  };

  // Sync on purpose: the webhook for this very write arrives moments later, and
  // with an async commit it would read the document before the fingerprints
  // landed and translate everything a second time.
  await writer.patch(id).set(patch).commit({ visibility: "sync" });

  // Push the fresh text to the cached pages immediately: the next visitor sees
  // the translation instead of waiting for the 60 s ISR window. Route Handlers
  // defer the regeneration to the next visit, which is what we want here.
  try {
    revalidateMenu();
  } catch (error) {
    console.warn("[translate] revalidate failed", error);
  }

  return json(
    {
      ok: complete,
      id,
      translated: Object.keys(patch).filter((key) => key !== "translationSource"),
      ...(failures.length > 0 ? { failures } : {}),
    },
    // A partial run must not look like success: Sanity reads a 2xx as "delivered"
    // and stops retrying, leaving the failed locale untranslated until somebody
    // edits the product again.
    complete ? 200 : 503,
  );
}

import { createClient } from "@sanity/client";
import { translateTexts } from "@/lib/translate-gemini";
import { descriptionHash, ingredientsHash, nameHash, sourceHash } from "@/lib/translation-source";
import type { Locale } from "@/lib/i18n";

/**
 * Translates a product into the other three languages when it is published.
 *
 *   Sanity webhook (menuItem published) → POST /api/translate-product →
 *   Gemini → patch the same document
 *
 * Three things keep this safe:
 *  - a shared secret header, checked before anything else costs money;
 *  - an idempotency fingerprint: the patch stores a hash of the Romanian source,
 *    and a run whose hash matches writes nothing. Our own write triggers another
 *    webhook, that one matches and stops — the loop terminates by construction;
 *  - writes by PATH ("description.bg"), never by re-sending the whole object, so
 *    a concurrent edit in the Studio cannot be reverted by a stale copy.
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

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const secret = process.env.TRANSLATE_WEBHOOK_SECRET;
  if (!secret) {
    return json({ ok: false, error: "TRANSLATE_WEBHOOK_SECRET is not configured" }, 500);
  }
  if (request.headers.get("x-webhook-secret") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    return json({ ok: false, error: "SANITY_WRITE_TOKEN is not configured" }, 500);
  }

  let payload: { _id?: string };
  try {
    payload = (await request.json()) as { _id?: string };
  } catch {
    return json({ ok: false, error: "body is not JSON" }, 400);
  }

  const id = payload._id;
  if (!id) return json({ ok: false, error: "missing _id" }, 400);

  // Drafts are the editor typing; only published documents are translated.
  if (id.startsWith("drafts.")) return json({ ok: true, skipped: "draft" });

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

  const writer = createClient({
    projectId,
    dataset,
    apiVersion: "2024-03-27",
    useCdn: false,
    token,
  });

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
    provider: "gemini",
    status: complete ? "ok" : failures.join(" | ").slice(0, 200),
  };

  // Sync on purpose: the webhook for this very write arrives moments later, and
  // with an async commit it would read the document before the fingerprints
  // landed and translate everything a second time.
  await writer.patch(id).set(patch).commit({ visibility: "sync" });

  return json({
    ok: complete,
    id,
    translated: Object.keys(patch).filter((key) => key !== "translationSource"),
    ...(failures.length > 0 ? { failures } : {}),
  });
}

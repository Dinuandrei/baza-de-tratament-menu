/**
 * Fills the missing Bulgarian and Serbian text on every product, using Azure AI
 * Translator.
 *
 *   cd studio
 *   AZURE_TRANSLATOR_KEY=… AZURE_TRANSLATOR_REGION=westeurope \
 *     npx sanity exec scripts/translate.ts --with-user-token
 *
 * Add DRY_RUN=1 to see exactly what would be sent, without calling Azure and
 * without writing anything.
 *
 * Idempotent: a locale is only touched when it is empty or still holds the
 * Romanian text verbatim (see needsTranslation). A real translation is never
 * byte-identical to the source, so re-running never overwrites human work — and
 * the second run is a no-op.
 */
import { getCliClient } from "sanity/cli";
import { BRANDS } from "../../src/lib/translate";
import {
  descriptionHash,
  ingredientsHash,
  needsTranslation,
  sourceHash,
  TARGET_LOCALES,
} from "../../src/lib/translation-source";
import type { Locale } from "../../src/lib/i18n";

const client = getCliClient({ apiVersion: "2024-03-27" });
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

// Read the key from ../.env.local (repo root) when it is not already in the
// environment, so the secret never ends up in the shell history. Run this from
// the studio/ directory — the path is relative to it.
try {
  process.loadEnvFile("../.env.local");
} catch {
  // No .env.local yet (or an older Node) — the env vars below still work.
}

/**
 * Both adapters share one contract, so the engine is an env choice.
 * Google Cloud Translation is not an option here: it rejects API keys outright
 * (v2 and v3 both answer 401), so the Google path is Gemini.
 */
const PROVIDER: "azure" | "gemini" =
  process.env.TRANSLATE_PROVIDER === "gemini" ||
  (!process.env.AZURE_TRANSLATOR_KEY &&
    (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY))
    ? "gemini"
    : "azure";

async function loadTranslator() {
  if (PROVIDER === "gemini") {
    const { translateTexts } = await import("../../src/lib/translate-gemini");
    return translateTexts;
  }
  const { translateTexts } = await import("../../src/lib/translate");
  return translateTexts as (texts: string[], to: string, from?: string) => Promise<string[]>;
}

type Doc = {
  _id: string;
  name?: Partial<Record<Locale, string>>;
  description?: Partial<Record<Locale, string>>;
  ingredients?: Partial<Record<Locale, string[]>>;
};

type Job = {
  id: string;
  locale: Locale;
  description?: string;
  ingredients?: string[];
};

const QUERY = `*[_type == "menuItem"] | order(orderRank asc) {
  _id, name, description, ingredients
}`;

async function main() {
  const docs = await client.fetch<Doc[]>(QUERY);
  console.log(`${docs.length} products, targets: ${TARGET_LOCALES.join(", ")}`);

  const jobs: Job[] = [];
  for (const doc of docs) {
    for (const locale of TARGET_LOCALES) {
      if (!needsTranslation(doc, locale)) continue;
      jobs.push({
        id: doc._id,
        locale,
        ...(needsTranslation({ description: doc.description }, locale)
          ? { description: doc.description?.ro }
          : {}),
        ...(needsTranslation({ ingredients: doc.ingredients }, locale)
          ? { ingredients: doc.ingredients?.ro }
          : {}),
      });
    }
  }

  if (jobs.length === 0) {
    console.log("Nothing to translate — every locale already has real text.");
    return;
  }

  const strings = jobs.filter((job) => job.description).length;
  const lists = jobs.filter((job) => job.ingredients).length;
  const entries = jobs.reduce((sum, job) => sum + (job.ingredients?.length ?? 0), 0);
  console.log(
    `To translate: ${strings} descriptions, ${lists} ingredient lists (${entries} entries)`,
  );

  if (DRY_RUN) {
    for (const job of jobs.slice(0, 6)) {
      console.log(`\n[dry] ${job.id} -> ${job.locale}`);
      if (job.description) console.log(`  desc: ${job.description}`);
      if (job.ingredients) console.log(`  ing : ${job.ingredients.join(" · ")}`);
    }
    if (jobs.length > 6) console.log(`\n[dry] …and ${jobs.length - 6} more jobs.`);
    console.log(`\nBrands protected from translation: ${BRANDS.length}`);
    console.log("Dry run — nothing was sent, nothing was written.");
    return;
  }

  // One request per locale keeps the batches tight and the retries simple.
  const translateTexts = await loadTranslator();
  console.log(`Provider: ${PROVIDER}`);
  let written = 0;
  for (const locale of TARGET_LOCALES) {
    const localeJobs = jobs.filter((job) => job.locale === locale);
    if (localeJobs.length === 0) continue;

    const descriptions = localeJobs.filter((job) => job.description);
    const descriptionResults = await translateTexts(
      descriptions.map((job) => job.description as string),
      locale,
    );

    const withIngredients = localeJobs.filter((job) => job.ingredients);
    const flat = withIngredients.flatMap((job) => job.ingredients as string[]);
    const flatResults = flat.length > 0 ? await translateTexts(flat, locale) : [];

    // Re-slice the flat results back into per-product lists.
    const listsById = new Map<string, string[]>();
    let cursor = 0;
    for (const job of withIngredients) {
      const count = (job.ingredients as string[]).length;
      listsById.set(job.id, flatResults.slice(cursor, cursor + count));
      cursor += count;
    }

    const patches = new Map<string, Record<string, string | string[]>>();
    const touch = (id: string) => {
      const existing = patches.get(id) ?? {};
      patches.set(id, existing);
      return existing;
    };

    // Write the locale as a PATH (`description.bg`), never by re-sending the whole
    // object. Spreading a snapshot read at the start of the script would write the
    // other locale's old value back and silently undo the previous pass — that is
    // exactly what happened on the first run: sr's patch restored bg to Romanian.
    descriptions.forEach((job, index) => {
      touch(job.id)[`description.${locale}`] = descriptionResults[index];
    });

    for (const [id, list] of listsById) {
      touch(id)[`ingredients.${locale}`] = list;
    }

    const transaction = client.transaction();
    for (const [id, set] of patches) {
      const doc = docs.find((entry) => entry._id === id);
      transaction.patch(id, (patch) =>
        patch.set({
          ...set,
          translationSource: {
            _type: "translationSource",
            hash: sourceHash(doc ?? {}),
            // Same per-field fingerprints the webhook uses, so a later publish
            // does not retranslate what this run already did.
            descriptionHash: descriptionHash(doc ?? {}),
            ingredientsHash: ingredientsHash(doc ?? {}),
            at: new Date().toISOString(),
            provider: PROVIDER,
            status: "ok",
          },
        }),
      );
    }

    const result = await transaction.commit({ visibility: "async" });
    written += patches.size;
    console.log(
      `${locale}: ${descriptions.length} descriptions, ${withIngredients.length} lists, ` +
        `${patches.size} products patched` +
        (result?.transactionId ? ` — ${result.transactionId}` : ""),
    );
  }

  console.log(`\nDone. ${written} product documents updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

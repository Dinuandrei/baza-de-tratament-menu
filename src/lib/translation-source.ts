import type { Locale } from "@/lib/i18n";

/** The languages the menu is published in, in the order they appear in the UI. */
export const TARGET_LOCALES: Locale[] = ["en", "bg", "sr"];

export type TranslatableItem = {
  name?: Partial<Record<Locale, string>> | null;
  description?: Partial<Record<Locale, string>> | null;
  ingredients?: Partial<Record<Locale, string[]>> | null;
  serving?: Partial<Record<Locale, string>> | null;
};

/**
 * A fingerprint of the Romanian source. Stored next to the translations so a
 * later “did the source change?” check is a string comparison instead of a
 * guess — that is what makes an automatic webhook safe (it writes nothing when
 * the fingerprint matches, so it cannot trigger itself).
 *
 * FNV-1a: tiny, stable, no crypto import, works in the browser and in Node.
 */
export function sourceHash(item: TranslatableItem): string {
  const canonical = JSON.stringify([
    item.name?.ro ?? "",
    item.description?.ro ?? "",
    item.ingredients?.ro ?? [],
    item.serving?.ro ?? "",
  ]);

  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * True when a locale is empty or still holds the Romanian text verbatim — the
 * two ways a translation can be missing. A real translation is never equal to
 * the source, so this cannot overwrite human work by accident.
 */
export function needsTranslation(item: TranslatableItem, locale: Locale): boolean {
  if (locale === "ro") return false;

  const roDesc = item.description?.ro?.trim();
  const desc = item.description?.[locale]?.trim();
  if (roDesc && (!desc || desc === roDesc)) return true;

  const roIngredients = item.ingredients?.ro ?? [];
  const ingredients = item.ingredients?.[locale] ?? [];
  const sameList =
    roIngredients.length > 0 &&
    ingredients.length === roIngredients.length &&
    ingredients.every((entry, index) => entry.trim() === roIngredients[index].trim());
  if (roIngredients.length > 0 && (ingredients.length === 0 || sameList)) return true;

  return false;
}

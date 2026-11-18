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
 * FNV-1a over a canonical string: tiny, stable, no crypto import, usable in the
 * browser, in a route handler and in a Sanity script.
 */
function fnv(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Fingerprint of everything translatable, used as the overall “is it done” flag. */
export function sourceHash(item: TranslatableItem): string {
  return fnv(
    JSON.stringify([
      item.name?.ro ?? "",
      item.description?.ro ?? "",
      item.ingredients?.ro ?? [],
      item.serving?.ro ?? "",
    ]),
  );
}

/**
 * Per-field fingerprints. Kept apart on purpose: editing the Romanian
 * description must not throw away a hand-corrected ingredient translation, and
 * the other way round. A field is retranslated only when its own source changed.
 */
export function nameHash(item: TranslatableItem): string {
  return fnv(item.name?.ro ?? "");
}

export function descriptionHash(item: TranslatableItem): string {
  return fnv(item.description?.ro ?? "");
}

export function ingredientsHash(item: TranslatableItem): string {
  return fnv(JSON.stringify(item.ingredients?.ro ?? []));
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

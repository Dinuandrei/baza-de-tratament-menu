import type { AllergenId } from "@/data/menu";
import type { Locale } from "@/lib/i18n";

/**
 * The 14 allergens of Reg. (EU) 1169/2011, Annex II, in the four menu languages.
 *
 * Declaring them is a legal duty for any food/drink served on the premises, so
 * the Studio stores only these ids and the wording lives here: one place to fix
 * a translation, no chance of the same allergen being spelled three ways.
 *
 * `code` is the badge shown on the pill (kept to 1–2 letters so 14 pills still
 * fit a 320px screen).
 */
export const ALLERGENS: Record<AllergenId, { code: string; label: Record<Locale, string> }> = {
  gluten: {
    code: "G",
    label: { ro: "Gluten", en: "Gluten", bg: "Глутен", sr: "Глутен" },
  },
  crustaceans: {
    code: "Cr",
    label: { ro: "Crustacee", en: "Crustaceans", bg: "Ракообразни", sr: "Ракови" },
  },
  eggs: {
    code: "O",
    label: { ro: "Ouă", en: "Eggs", bg: "Яйца", sr: "Јаја" },
  },
  fish: {
    code: "P",
    label: { ro: "Pește", en: "Fish", bg: "Риба", sr: "Риба" },
  },
  peanuts: {
    code: "Ah",
    label: { ro: "Arahide", en: "Peanuts", bg: "Фъстъци", sr: "Кикирики" },
  },
  soy: {
    code: "So",
    label: { ro: "Soia", en: "Soy", bg: "Соя", sr: "Соја" },
  },
  milk: {
    code: "L",
    label: { ro: "Lapte", en: "Milk", bg: "Мляко", sr: "Млеко" },
  },
  nuts: {
    code: "N",
    label: {
      ro: "Fructe cu coajă lemnoasă",
      en: "Tree nuts",
      bg: "Ядки",
      sr: "Језгровито воће",
    },
  },
  celery: {
    code: "Ț",
    label: { ro: "Țelină", en: "Celery", bg: "Целина", sr: "Целер" },
  },
  mustard: {
    code: "Mu",
    label: { ro: "Muștar", en: "Mustard", bg: "Синап", sr: "Сенф" },
  },
  sesame: {
    code: "Se",
    label: { ro: "Susan", en: "Sesame", bg: "Сусам", sr: "Сусам" },
  },
  sulphites: {
    code: "S",
    label: {
      ro: "Dioxid de sulf / sulfiți",
      en: "Sulphites",
      bg: "Сулфити",
      sr: "Сулфити",
    },
  },
  lupin: {
    code: "Lu",
    label: { ro: "Lupin", en: "Lupin", bg: "Лупина", sr: "Лупина" },
  },
  molluscs: {
    code: "Mo",
    label: { ro: "Moluște", en: "Molluscs", bg: "Мекотели", sr: "Мекушци" },
  },
};

export const allergenIds = Object.keys(ALLERGENS) as AllergenId[];

export function isAllergenId(value: string): value is AllergenId {
  return Object.prototype.hasOwnProperty.call(ALLERGENS, value);
}

export function allergenLabel(id: AllergenId, locale: Locale): string {
  return ALLERGENS[id].label[locale] ?? ALLERGENS[id].label.ro;
}

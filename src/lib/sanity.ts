import { createClient } from "@sanity/client";
import { draftMode } from "next/headers";
import {
  categories as staticCategories,
  type AllergenId,
  type Category,
  type Item,
  type Localized,
  type Nutrition,
  type Tag,
} from "@/data/menu";
import { isAllergenId } from "@/lib/allergens";
import { itemIconNames, type ItemIconName } from "@/lib/icons";
import { locales, type Locale } from "@/lib/i18n";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "w6d4ck0i";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-03-27",
  // Menu edits must show up on the next revalidation, never from a stale CDN copy.
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_API_READ_TOKEN || undefined,
});

type LocaleMap = Partial<Record<Locale, string>> | null | undefined;
type LocaleList = Partial<Record<Locale, string[]>> | null | undefined;

type ItemDoc = {
  _id: string;
  name: LocaleMap;
  description: LocaleMap;
  image: string | null;
  price: number | null;
  tags: string[] | null;
  icon: string | null;
  ingredients: LocaleList;
  allergens: string[] | null;
  nutrition: Nutrition | null;
  serving: LocaleMap;
  abv: number | null;
};

type CategoryDoc = {
  _id: string;
  title: LocaleMap;
  note: LocaleMap;
  items: ItemDoc[] | null;
};

/** GROQ ids carry a type prefix (`category-cafea`); the UI needs the bare slug. */
const slugOf = (id: string) => id.replace(/^(category|item)-/, "");

/** First locale that actually has text — an empty string must not win over a filled one. */
function firstFilled(value: LocaleMap): string | undefined {
  for (const locale of locales) {
    const text = value?.[locale]?.trim();
    if (text) return text;
  }
  return undefined;
}

/** Keep every locale the components index into, falling back to the first filled one. */
function localized(value: LocaleMap, fallback: string): Localized {
  const ro = firstFilled(value) ?? fallback;
  return {
    ro,
    en: value?.en ?? ro,
    bg: value?.bg ?? ro,
    sr: value?.sr ?? ro,
  };
}

/** Descriptions stay partial so a missing translation falls back at render time. */
function partial(value: LocaleMap): Partial<Localized> | undefined {
  if (!value) return undefined;
  const output: Partial<Localized> = {};
  for (const locale of locales) {
    const text = value[locale];
    if (text) output[locale] = text;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

/** Same idea for the ingredient lists (one array per locale). */
function partialLists(value: LocaleList): Partial<Record<Locale, string[]>> | undefined {
  if (!value) return undefined;
  const output: Partial<Record<Locale, string[]>> = {};
  for (const locale of locales) {
    const list = value[locale]?.filter((entry) => typeof entry === "string" && entry.trim());
    if (list && list.length > 0) output[locale] = list;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

/** Unknown ids are dropped so a stale Studio value can never break the pills. */
function allergensFor(value: string[] | null): AllergenId[] | undefined {
  const list = (value ?? []).filter(isAllergenId);
  return list.length > 0 ? list : undefined;
}

/** Drop empty and impossible numbers so the popup never prints “-5 kcal”. */
function nutritionFor(value: Nutrition | null): Nutrition | undefined {
  if (!value) return undefined;
  const output: Nutrition = {};
  for (const [key, amount] of Object.entries(value)) {
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
      output[key as keyof Nutrition] = amount;
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

const KNOWN_TAGS: Tag[] = ["na", "spicy", "new"];

function iconFor(value: string | null): ItemIconName {
  const candidate = value ?? "";
  return (itemIconNames as readonly string[]).includes(candidate)
    ? (candidate as ItemIconName)
    : "hot-mug";
}

function toItem(doc: ItemDoc): Item | null {
  // A document with no name in any locale would be listed under its internal id
  // ("edge-noname"), which looks like a bug to the reader — skip it instead.
  // Empty strings are ignored: a cleared `ro` must not hide a filled `en`.
  const sourceName = firstFilled(doc.name);
  if (!sourceName) return null;

  return {
    id: slugOf(doc._id),
    icon: iconFor(doc.icon),
    name: localized(doc.name, sourceName),
    image: typeof doc.image === "string" && doc.image.trim() ? doc.image : undefined,
    desc: partial(doc.description),
    // A negative price is a typo, not an offer: show “—” rather than “-10 lei”.
    price: typeof doc.price === "number" && doc.price >= 0 ? doc.price : undefined,
    tags: doc.tags?.filter((tag): tag is Tag => KNOWN_TAGS.includes(tag as Tag)),
    ingredients: partialLists(doc.ingredients),
    allergens: allergensFor(doc.allergens),
    nutrition: nutritionFor(doc.nutrition),
    serving: partial(doc.serving),
    abv: typeof doc.abv === "number" && doc.abv >= 0 ? doc.abv : undefined,
  };
}

const CATEGORIES_QUERY = `*[_type == "category"] | order(orderRank asc, title.ro asc) {
  _id,
  title,
  note,
  "items": *[_type == "menuItem" && references(^._id)] | order(orderRank asc, name.ro asc) {
    _id,
    name,
    description,
    price,
    tags,
    icon,
    "image": image.asset->url,
    ingredients,
    allergens,
    nutrition,
    serving,
    abv
  }
}`;

/**
 * The menu, from Sanity. Falls back to the bundled data if the dataset is
 * unreachable or empty, so a Studio mishap can never blank the site.
 */
export async function getCategories(): Promise<Category[]> {
  // Preview (Draft Mode) reads unpublished drafts. The token stays server-side;
  // without it Sanity only returns published documents and the editor sees the
  // live menu, so we say so loudly in the logs instead of failing silently.
  const { isEnabled: preview } = await draftMode();
  const previewToken = process.env.SANITY_API_READ_TOKEN;
  if (preview && !previewToken) {
    console.warn("[sanity] preview mode is on but SANITY_API_READ_TOKEN is missing — drafts are not visible");
  }

  const reader =
    preview && previewToken
      ? createClient({
          projectId,
          dataset,
          apiVersion: "2024-03-27",
          useCdn: false,
          perspective: "drafts",
          token: previewToken,
        })
      : client;

  try {
    // No `no-store` here on purpose: the route-level `revalidate` owns freshness,
    // so the page stays statically served (ISR) instead of becoming dynamic.
    // In preview the request must never be cached at all.
    const docs = await reader.fetch<CategoryDoc[]>(
      CATEGORIES_QUERY,
      {},
      preview ? { cache: "no-store" } : { next: { revalidate: 60, tags: ["menu"] } },
    );

    if (!Array.isArray(docs) || docs.length === 0) {
      console.warn("[sanity] no categories returned — serving the bundled menu");
      return staticCategories;
    }

    const categories = docs
      .map((doc) => ({
        doc,
        // A category with no title anywhere would be headed by its id; the same
        // goes for an empty section left behind after its last product moved.
        titled: Boolean(firstFilled(doc.title)),
        items: (doc.items ?? [])
          .map(toItem)
          .filter((item): item is Item => item !== null),
      }))
      .filter(({ titled, items }) => titled && items.length > 0)
      .map(({ doc, items }) => ({
        id: slugOf(doc._id),
        name: localized(doc.title, slugOf(doc._id)),
        note: partial(doc.note),
        items,
      }));

    // Every document was skipped (untitled, or left with no products): an empty
    // menu is worse than the bundled one, which is what the fallback is for.
    if (categories.length === 0) {
      console.warn("[sanity] every category was empty after filtering — serving the bundled menu");
      return staticCategories;
    }

    return categories;
  } catch (error) {
    console.error("[sanity] menu fetch failed — serving the bundled menu", error);
    return staticCategories;
  }
}

import { createClient } from "@sanity/client";
import { categories as staticCategories, type Category, type Item, type Localized, type Tag } from "@/data/menu";
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

type ItemDoc = {
  _id: string;
  name: LocaleMap;
  description: LocaleMap;
  price: number | null;
  tags: string[] | null;
  icon: string | null;
};

type CategoryDoc = {
  _id: string;
  title: LocaleMap;
  note: LocaleMap;
  items: ItemDoc[] | null;
};

/** GROQ ids carry a type prefix (`category-cafea`); the UI needs the bare slug. */
const slugOf = (id: string) => id.replace(/^(category|item)-/, "");

/** Keep every locale the components index into, falling back to Romanian. */
function localized(value: LocaleMap, fallback: string): Localized {
  const ro = value?.ro ?? value?.en ?? fallback;
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

const KNOWN_TAGS: Tag[] = ["na", "spicy", "new"];

function iconFor(value: string | null): ItemIconName {
  const candidate = value ?? "";
  return (itemIconNames as readonly string[]).includes(candidate)
    ? (candidate as ItemIconName)
    : "hot-mug";
}

function toItem(doc: ItemDoc): Item {
  return {
    id: slugOf(doc._id),
    icon: iconFor(doc.icon),
    name: localized(doc.name, slugOf(doc._id)),
    desc: partial(doc.description),
    price: typeof doc.price === "number" ? doc.price : undefined,
    tags: doc.tags?.filter((tag): tag is Tag => KNOWN_TAGS.includes(tag as Tag)),
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
    icon
  }
}`;

/**
 * The menu, from Sanity. Falls back to the bundled data if the dataset is
 * unreachable or empty, so a Studio mishap can never blank the site.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    // No `no-store` here on purpose: the route-level `revalidate` owns freshness,
    // so the page stays statically served (ISR) instead of becoming dynamic.
    const docs = await client.fetch<CategoryDoc[]>(
      CATEGORIES_QUERY,
      {},
      // A prerendered route caches fetches forever by default; bound it so the
      // ISR regeneration (and the next build) actually see Studio edits.
      { next: { revalidate: 60 } },
    );

    if (!Array.isArray(docs) || docs.length === 0) {
      console.warn("[sanity] no categories returned — serving the bundled menu");
      return staticCategories;
    }

    return docs.map((doc) => ({
      id: slugOf(doc._id),
      name: localized(doc.title, slugOf(doc._id)),
      note: partial(doc.note),
      items: (doc.items ?? []).map(toItem),
    }));
  } catch (error) {
    console.error("[sanity] menu fetch failed — serving the bundled menu", error);
    return staticCategories;
  }
}

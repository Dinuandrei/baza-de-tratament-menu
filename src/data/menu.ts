import type { Locale } from "@/lib/i18n";
import type { ItemIconName } from "@/lib/icons";

export type Localized = Record<Locale, string>;

export type Tag = "na" | "spicy" | "new";

/**
 * The 14 allergens the EU requires a food business to declare
 * (Reg. (EU) 1169/2011, Annex II). Free text would drift ("gluten"/"grâu"/
 * "Gluten"), so the Studio offers this fixed list and the UI translates it.
 */
export type AllergenId =
  | "gluten"
  | "crustaceans"
  | "eggs"
  | "fish"
  | "peanuts"
  | "soy"
  | "milk"
  | "nuts"
  | "celery"
  | "mustard"
  | "sesame"
  | "sulphites"
  | "lupin"
  | "molluscs";

/** Values are per serving. Estimates until the kitchen confirms them. */
export type Nutrition = {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugar?: number;
  protein?: number;
  salt?: number;
};

export type Item = {
  id: string;
  icon: ItemIconName;
  name: Localized;
  /**
   * Long copy shown in the “Vezi detalii” popup. Partial on purpose: a missing
   * locale falls back (locale → ro → en) instead of blanking the popup while
   * translations are still being written.
   */
  desc?: Partial<Localized>;
  /** Photo for the popup. Without it the popup shows the item’s pictogram. */
  image?: string;
  /** Price in lei. Omit when it is not fixed (shown as “—”). */
  price?: number;
  tags?: Tag[];
  /** Same partial-fallback contract as `desc`. */
  ingredients?: Partial<Record<Locale, string[]>>;
  /** Declared allergens, from the fixed EU-14 list. */
  allergens?: AllergenId[];
  nutrition?: Nutrition;
  /** Portion / volume, e.g. “330 ml”, “200 g”. */
  serving?: Partial<Localized>;
  /** Alcohol by volume, in percent. Omitted for alcohol-free items. */
  abv?: number;
};

export type Category = {
  id: string;
  name: Localized;
  /** Same partial-fallback contract as Item.desc. */
  note?: Partial<Localized>;
  items: Item[];
};

/** locale → ro → en, so a popup never opens empty. */
export function descFor(item: Item, locale: Locale): string | undefined {
  const desc = item.desc;
  if (!desc) return undefined;
  return desc[locale] ?? desc.ro ?? desc.en;
}

export function ingredientsFor(item: Item, locale: Locale): string[] | undefined {
  const list = item.ingredients;
  if (!list) return undefined;
  const resolved = list[locale] ?? list.ro ?? list.en;
  return resolved && resolved.length > 0 ? resolved : undefined;
}

export function servingFor(item: Item, locale: Locale): string | undefined {
  const serving = item.serving;
  if (!serving) return undefined;
  return serving[locale] ?? serving.ro ?? serving.en;
}

const same = (value: string): Localized => ({ ro: value, en: value, bg: value, sr: value });

const l = (ro: string, en: string, bg: string, sr: string): Localized => ({ ro, en, bg, sr });

/** Description in the two languages it is written in so far. */
const d = (ro: string, en: string): Partial<Localized> => ({ ro, en });

const RAW_CATEGORIES: Category[] = [
  {
    id: "cafea",
    name: l("Cafea", "Coffee", "Кафе", "Кафа"),
    items: [
      {
        id: "espresso", icon: "espresso", name: same("Espresso"), price: 10,
        desc: d(
          "Un shot scurt și concentrat, din boabe proaspăt râșnite.",
          "A short, concentrated shot from freshly ground beans.",
        ),
      },
      {
        id: "cafea-lunga", icon: "lung",
        name: l("Cafea lungă", "Long coffee", "Дълго кафе", "Дуга кафа"), price: 10,
        desc: d(
          "Espresso lung: aceeași cafea, mai multă apă, un final mai blând.",
          "Long espresso: the same coffee, more water, a softer finish.",
        ),
      },
      {
        id: "americano", icon: "americano", name: same("Americano"), price: 10,
        desc: d(
          "Espresso lungit cu apă fierbinte. Cafea neagră, fără lapte.",
          "Espresso lengthened with hot water. Black coffee, no milk.",
        ),
      },
      {
        id: "macchiato", icon: "macchiato", name: same("Macchiato"), price: 14,
        desc: d(
          "Espresso cu o pată de lapte spumat, exact cât să-l rotunjească.",
          "Espresso with a spot of steamed milk — just enough to round it off.",
        ),
      },
      {
        id: "flat-white", icon: "flatwhite", name: same("Flat White"), price: 16,
        desc: d(
          "Două shoturi de espresso și lapte micro-spumat, textură de catifea.",
          "Two shots of espresso with micro-foamed milk, velvet texture.",
        ),
      },
    ],
  },
  {
    id: "ape",
    name: l(
      "Apă & Răcoritoare",
      "Water & Softs",
      "Вода и безалкохолни",
      "Вода и безалкохолна пића",
    ),
    items: [
      {
        id: "apa-plata", icon: "water-still",
        name: l("Apă plată", "Still water", "Вода без газ", "Негазирана вода"),
        price: 10,
        desc: d("Apă plată la sticlă, servită rece.", "Still water, by the bottle, served chilled."),
      },
      {
        id: "apa-minerala", icon: "water-sparkling",
        name: l("Apă minerală", "Sparkling water", "Газирана вода", "Газирана вода"),
        price: 10,
        desc: d(
          "Apă minerală cu bule, la sticlă, servită rece.",
          "Sparkling mineral water, by the bottle, served chilled.",
        ),
      },
      {
        id: "cola", icon: "can", name: same("Cola"), price: 15,
        desc: d("Cola clasică, la doză, servită rece.", "Classic cola, canned, served cold."),
      },
      {
        id: "fanta", icon: "can-fruit", name: same("Fanta"), price: 15,
        desc: d("Fanta de portocale, la doză, servită rece.", "Orange Fanta, canned, served cold."),
      },
      {
        id: "sprite", icon: "can-fruit", name: same("Sprite"), price: 15,
        desc: d(
          "Sprite cu lămâie și lime, la doză, servit rece.",
          "Lemon-lime Sprite, canned, served cold.",
        ),
      },
      {
        id: "fuzz-tea", icon: "iced-tea", name: same("Fuzz Tea"), price: 15,
        desc: d(
          "Ceai rece de piersici, la doză — dulce, rece, ușor.",
          "Peach iced tea, canned — sweet, cold, easy.",
        ),
      },
    ],
  },
  {
    id: "bere",
    name: l("Bere", "Beer", "Бира", "Пиво"),
    items: [
      {
        id: "guinness", icon: "beer-pint", name: same("Guinness"), price: 29,
        desc: d(
          "Stout irlandez, negru și cremos, cu note de cafea prăjită.",
          "Irish stout, dark and creamy, with roasted-coffee notes.",
        ),
      },
      {
        id: "bucur-lager", icon: "beer-mug", name: same("Bucur Lager"), price: 17,
        desc: d(
          "Lager românesc, proaspăt, cu un final ușor amar.",
          "Romanian lager, crisp, with a lightly bitter finish.",
        ),
      },
    ],
  },
  {
    id: "bauturi-calde",
    name: l("Băuturi calde", "Hot drinks", "Топли напитки", "Топли напици"),
    items: [
      {
        id: "strudel-stroh", icon: "mulled", name: same("Strudel Stroh"), price: 22,
        desc: d(
          "Băutură caldă cu rom Stroh și aromă de ștrudel cu mere.",
          "A warm drink with Stroh rum and apple-strudel spice.",
        ),
      },
      {
        id: "hot-kafka", icon: "hot-glass", name: same("Hot Kafka"), price: 24,
        desc: d(
          "Un preparat cald al casei, servit fierbinte. Întreabă barmanul despre ingrediente.",
          "A house warm drink, served hot. Ask the bartender about the ingredients.",
        ),
      },
      {
        id: "amaretto-strudel", icon: "mulled", name: same("Amaretto Strudel"), price: 24,
        desc: d(
          "Cald, cu amaretto și note de ștrudel cu mere.",
          "Warm, with amaretto and apple-strudel notes.",
        ),
      },
      {
        id: "hot-ginger-gin", icon: "mulled", name: same("Hot Ginger Gin"), price: 24,
        desc: d("Gin cu ghimbir, servit cald.", "Gin with ginger, served hot."),
      },
      {
        id: "suc-mere-cald", icon: "apple-juice",
        name: l(
          "Suc de mere cald (0%)",
          "Warm apple juice (0%)",
          "Топъл ябълков сок (0%)",
          "Топли сок од јабуке (0%)",
        ),
        price: 12,
        tags: ["na"],
        desc: d(
          "Suc de mere încălzit, cu scorțișoară. Fără alcool.",
          "Warmed apple juice with cinnamon. Alcohol-free.",
        ),
      },
      {
        id: "hot-ginger", icon: "ginger-mug", name: same("Hot Ginger (0%)"), price: 14, tags: ["na"],
        desc: d(
          "Infuzie de ghimbir, caldă și piperată. Fără alcool.",
          "Ginger infusion, warm and peppery. Alcohol-free.",
        ),
      },
      {
        id: "ceai", icon: "tea",
        name: l("Ceai fierbinte", "Hot tea", "Горещ чай", "Врућ чај"),
        price: 10,
        desc: d("Ceai fierbinte, servit la ceașcă.", "Hot tea, served by the cup."),
      },
      {
        id: "ciocolata-calda", icon: "choco",
        name: l("Ciocolată caldă", "Hot chocolate", "Горещ шоколад", "Врућа чоколада"),
        price: 20,
        desc: d("Ciocolată caldă, densă și dulce.", "Hot chocolate, thick and sweet."),
      },
      {
        id: "kit-kat-choco", icon: "wafer", name: same("Kit Kat Choco"), price: 15,
        desc: d(
          "Ciocolată caldă servită cu Kit Kat.",
          "Hot chocolate served with Kit Kat.",
        ),
      },
    ],
  },
  {
    id: "mancare",
    name: l("Mâncare", "Food", "Храна", "Храна"),
    items: [
      {
        id: "cartofi-prajiti", icon: "fries",
        name: l("Cartofi prăjiți", "French fries", "Пържени картофи", "Помфрит"),
        desc: d("O porție de cartofi prăjiți, crocanți, cu sare.", "A portion of crispy, salted fries."),
      },
      {
        id: "cartofi-parmezan", icon: "fries-cheese",
        name: l(
          "Cartofi cu parmezan",
          "Parmesan fries",
          "Пържени картофи с пармезан",
          "Помфрит с пармезан",
        ),
        desc: d(
          "Cartofi prăjiți presărați cu parmezan ras.",
          "Fries dusted with grated parmesan.",
        ),
      },
      {
        id: "cartofi-smoky", icon: "fries-smoke",
        name: l(
          "Cartofi Smoky Stuff",
          "Smoky Stuff fries",
          "Картофи Smoky Stuff",
          "Помфрит Smoky Stuff",
        ),
        desc: d(
          "Cartofi prăjiți cu un condiment afumat.",
          "Fries tossed in a smoked seasoning.",
        ),
      },
      {
        id: "cartofi-spicy", icon: "fries-chili",
        name: l(
          "Cartofi Spicy Stuff",
          "Spicy Stuff fries",
          "Картофи Spicy Stuff",
          "Помфрит Spicy Stuff",
        ),
        tags: ["spicy"],
        desc: d(
          "Cartofi prăjiți cu un condiment iute.",
          "Fries tossed in a hot spice mix.",
        ),
      },
      {
        id: "bierdog", icon: "hotdog",
        name: l("Bierdog", "Beer dog", "Бирдог", "Бирдог"),
        desc: d(
          "Hot dog pentru bere — cârnat în chiflă, la îndemână.",
          "A hot dog to go with your beer — sausage in a bun.",
        ),
      },
    ],
  },
  {
    id: "long-drinks",
    name: l("Long drinks", "Long drinks", "Лонг дринкове", "Лонг дринкови"),
    items: [
      {
        id: "jack-coke", icon: "long-dark", name: same("Jack & Coke"), price: 25,
        desc: d(
          "Jack Daniel's și cola, cu gheață și felie de lămâie.",
          "Jack Daniel's and cola, over ice with a lemon wedge.",
        ),
      },
      {
        id: "cuba-libre", icon: "long-dark", name: same("Cuba Libre"), price: 24,
        desc: d("Rom, cola și lime, cu gheață.", "Rum, cola and lime, over ice."),
      },
      {
        id: "gin-tonic", icon: "long-clear", name: same("Gin Tonic"),
        desc: d("Gin și apă tonică, cu gheață și lime.", "Gin and tonic, over ice with lime."),
      },
      {
        id: "vodka-tonic", icon: "long-clear", name: same("Vodka Tonic"),
        desc: d("Vodka și apă tonică, cu gheață și lime.", "Vodka and tonic, over ice with lime."),
      },
      {
        id: "jager-coke", icon: "long-dark", name: same("Jager Coke"),
        desc: d("Jägermeister și cola, cu gheață.", "Jägermeister and cola, over ice."),
      },
    ],
  },
  {
    id: "shoturi",
    name: l("Shoturi / Măsuri", "Shots", "Шотове", "Шотови"),
    items: [
      {
        id: "jack-daniels", icon: "whiskey", name: same("Jack Daniel's"),
        desc: d("Bourbon Tennessee, servit la măsură.", "Tennessee whiskey, served by the shot."),
      },
      {
        id: "vodka-russian-standard", icon: "bottle-vodka", name: same("Vodka Russian Standard"),
        desc: d("Vodka rusească, servită la măsură.", "Russian vodka, served by the shot."),
      },
      {
        id: "jack-fire", icon: "whiskey-fire", name: same("Jack Fire"),
        desc: d("Jack Daniel's cu scorțișoară, la măsură.", "Cinnamon Jack Daniel's, by the shot."),
      },
      {
        id: "jack-apple", icon: "whiskey-apple", name: same("Jack Apple"),
        desc: d("Jack Daniel's cu aromă de măr, la măsură.", "Apple Jack Daniel's, by the shot."),
      },
      {
        id: "jack-honey", icon: "whiskey-honey", name: same("Jack Honey"),
        desc: d("Jack Daniel's cu miere, la măsură.", "Honey Jack Daniel's, by the shot."),
      },
      {
        id: "tatritea-52", icon: "bottle", name: same("Tatrițea 52"),
        desc: d("Țuică de Tatrițea, 52 de grade, la măsură.", "Tatrițea țuică, 52% ABV, by the shot."),
      },
      {
        id: "tatritea-62-72", icon: "bottle", name: same("Tatrițea 62 / 72"),
        desc: d(
          "Țuică de Tatrițea, 62 sau 72 de grade — spune barmanului ce vrei.",
          "Tatrițea țuică, 62 or 72% ABV — tell the bartender which one.",
        ),
      },
      {
        id: "tequila-el-camino", icon: "tequila", name: same("Tequila El Camino"),
        desc: d("Tequila El Camino, la măsură.", "El Camino tequila, by the shot."),
      },
    ],
  },
];

/* ------------------------------------------------------------------------- *
 * Product details shown in the “Vezi detalii” popup: ingredients, declared
 * allergens, nutrition, serving and ABV. Kept in a separate table so the menu
 * above stays readable; `categories` below merges the two.
 *
 * Nutrition values are per serving and are ESTIMATES (typical values for the
 * product); they are meant to be corrected in the Studio, which is the source
 * of truth once the site reads from Sanity.
 * ------------------------------------------------------------------------- */

type ItemDetail = Pick<Item, "ingredients" | "allergens" | "nutrition" | "serving" | "abv">;

const ing = (ro: string[], en: string[]): Partial<Record<Locale, string[]>> => ({ ro, en });
const ml = (value: string): Partial<Localized> => ({ ro: value, en: value });

const DETAILS: Record<string, ItemDetail> = {
  // Cafea — apă + cafea; laptele aduce lactoza.
  espresso: {
    ingredients: ing(["apă", "cafea măcinată"], ["water", "ground coffee"]),
    serving: ml("30 ml"),
    nutrition: { calories: 3, fat: 0, saturatedFat: 0, carbohydrates: 0.5, sugar: 0, protein: 0.2, salt: 0 },
  },
  "cafea-lunga": {
    ingredients: ing(["apă", "cafea măcinată"], ["water", "ground coffee"]),
    serving: ml("60 ml"),
    nutrition: { calories: 5, fat: 0, saturatedFat: 0, carbohydrates: 0.8, sugar: 0, protein: 0.3, salt: 0 },
  },
  americano: {
    ingredients: ing(["apă", "cafea măcinată"], ["water", "ground coffee"]),
    serving: ml("120 ml"),
    nutrition: { calories: 5, fat: 0, saturatedFat: 0, carbohydrates: 0.8, sugar: 0, protein: 0.3, salt: 0 },
  },
  macchiato: {
    ingredients: ing(["apă", "cafea măcinată", "lapte"], ["water", "ground coffee", "milk"]),
    allergens: ["milk"],
    serving: ml("40 ml"),
    nutrition: { calories: 45, fat: 2.5, saturatedFat: 1.6, carbohydrates: 3.5, sugar: 3.4, protein: 2.2, salt: 0.04 },
  },
  "flat-white": {
    ingredients: ing(["apă", "cafea măcinată", "lapte"], ["water", "ground coffee", "milk"]),
    allergens: ["milk"],
    serving: ml("160 ml"),
    nutrition: { calories: 120, fat: 6, saturatedFat: 3.7, carbohydrates: 9, sugar: 9, protein: 6, salt: 0.1 },
  },

  // Apă & răcoritoare
  "apa-plata": {
    ingredients: ing(["apă plată"], ["still water"]),
    serving: ml("500 ml"),
    nutrition: { calories: 0, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  "apa-minerala": {
    ingredients: ing(["apă minerală naturală carbogazoasă"], ["naturally sparkling mineral water"]),
    serving: ml("500 ml"),
    nutrition: { calories: 0, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  cola: {
    ingredients: ing(
      ["apă carbogazoasă", "zahăr", "colorant caramel", "acid fosforic", "aromă naturală", "cofeină"],
      ["carbonated water", "sugar", "caramel colour", "phosphoric acid", "natural flavouring", "caffeine"],
    ),
    serving: ml("250 ml"),
    nutrition: { calories: 105, fat: 0, saturatedFat: 0, carbohydrates: 26.5, sugar: 26.5, protein: 0, salt: 0.02 },
  },
  fanta: {
    ingredients: ing(
      ["apă carbogazoasă", "zahăr", "suc de portocale din concentrat", "acid citric", "aromă naturală"],
      ["carbonated water", "sugar", "orange juice from concentrate", "citric acid", "natural flavouring"],
    ),
    serving: ml("250 ml"),
    nutrition: { calories: 108, fat: 0, saturatedFat: 0, carbohydrates: 26, sugar: 26, protein: 0, salt: 0.02 },
  },
  sprite: {
    ingredients: ing(
      ["apă carbogazoasă", "zahăr", "acid citric", "aromă naturală de lămâie și lime"],
      ["carbonated water", "sugar", "citric acid", "natural lemon-lime flavouring"],
    ),
    serving: ml("250 ml"),
    nutrition: { calories: 96, fat: 0, saturatedFat: 0, carbohydrates: 21, sugar: 21, protein: 0, salt: 0.04 },
  },
  "fuzz-tea": {
    ingredients: ing(
      ["apă", "ceai", "suc de piersici", "zahăr", "acid citric"],
      ["water", "tea", "peach juice", "sugar", "citric acid"],
    ),
    serving: ml("330 ml"),
    nutrition: { calories: 100, fat: 0, saturatedFat: 0, carbohydrates: 24, sugar: 24, protein: 0, salt: 0.03 },
  },

  // Bere — malțul de orz înseamnă gluten.
  guinness: {
    ingredients: ing(
      ["apă", "malț de orz", "orz", "hamei", "drojdie"],
      ["water", "malted barley", "barley", "hops", "yeast"],
    ),
    allergens: ["gluten"],
    serving: ml("500 ml"),
    abv: 4.2,
    nutrition: { calories: 210, fat: 0, saturatedFat: 0, carbohydrates: 16, sugar: 1, protein: 2, salt: 0.02 },
  },
  "bucur-lager": {
    ingredients: ing(
      ["apă", "malț de orz", "hamei", "drojdie"],
      ["water", "malted barley", "hops", "yeast"],
    ),
    allergens: ["gluten"],
    serving: ml("500 ml"),
    abv: 4.6,
    nutrition: { calories: 190, fat: 0, saturatedFat: 0, carbohydrates: 14, sugar: 0.5, protein: 1.6, salt: 0.02 },
  },

  // Băuturi calde
  "strudel-stroh": {
    ingredients: ing(
      ["rom Stroh", "suc de mere", "scorțișoară", "zahăr"],
      ["Stroh rum", "apple juice", "cinnamon", "sugar"],
    ),
    serving: ml("200 ml"),
    abv: 15,
    nutrition: { calories: 180, fat: 0, saturatedFat: 0, carbohydrates: 22, sugar: 21, protein: 0.2, salt: 0 },
  },
  "hot-kafka": {
    ingredients: ing(
      ["băutură spirtoasă", "miere", "condimente calde", "fructe"],
      ["spirit", "honey", "warm spices", "fruit"],
    ),
    serving: ml("200 ml"),
    abv: 20,
    nutrition: { calories: 200, fat: 0, saturatedFat: 0, carbohydrates: 24, sugar: 23, protein: 0.3, salt: 0 },
  },
  "amaretto-strudel": {
    ingredients: ing(
      ["amaretto", "suc de mere", "scorțișoară"],
      ["amaretto", "apple juice", "cinnamon"],
    ),
    allergens: ["nuts"],
    serving: ml("200 ml"),
    abv: 12,
    nutrition: { calories: 175, fat: 0, saturatedFat: 0, carbohydrates: 21, sugar: 20, protein: 0.2, salt: 0 },
  },
  "hot-ginger-gin": {
    ingredients: ing(
      ["gin", "ghimbir", "miere", "lămâie"],
      ["gin", "ginger", "honey", "lemon"],
    ),
    serving: ml("200 ml"),
    abv: 18,
    nutrition: { calories: 160, fat: 0, saturatedFat: 0, carbohydrates: 14, sugar: 13, protein: 0.1, salt: 0 },
  },
  "suc-mere-cald": {
    ingredients: ing(["suc de mere", "scorțișoară"], ["apple juice", "cinnamon"]),
    serving: ml("200 ml"),
    nutrition: { calories: 120, fat: 0, saturatedFat: 0, carbohydrates: 28, sugar: 28, protein: 0.2, salt: 0 },
  },
  "hot-ginger": {
    ingredients: ing(
      ["apă", "ghimbir", "miere", "lămâie"],
      ["water", "ginger", "honey", "lemon"],
    ),
    serving: ml("250 ml"),
    nutrition: { calories: 90, fat: 0, saturatedFat: 0, carbohydrates: 21, sugar: 20, protein: 0.1, salt: 0 },
  },
  ceai: {
    ingredients: ing(["apă", "ceai"], ["water", "tea"]),
    serving: ml("250 ml"),
    nutrition: { calories: 2, fat: 0, saturatedFat: 0, carbohydrates: 0.4, sugar: 0, protein: 0, salt: 0 },
  },
  "ciocolata-calda": {
    ingredients: ing(
      ["lapte", "cacao", "zahăr"],
      ["milk", "cocoa", "sugar"],
    ),
    allergens: ["milk"],
    serving: ml("250 ml"),
    nutrition: { calories: 210, fat: 8, saturatedFat: 5, carbohydrates: 26, sugar: 24, protein: 8, salt: 0.2 },
  },
  "kit-kat-choco": {
    ingredients: ing(
      ["lapte", "cacao", "zahăr", "biscuit Kit Kat"],
      ["milk", "cocoa", "sugar", "Kit Kat biscuit"],
    ),
    allergens: ["milk", "gluten", "soy"],
    serving: ml("250 ml"),
    nutrition: { calories: 320, fat: 14, saturatedFat: 8.5, carbohydrates: 38, sugar: 34, protein: 9, salt: 0.3 },
  },

  // Mâncare — prăjit în ulei, deci declarăm și ce se prăjește în aceeași baie.
  "cartofi-prajiti": {
    ingredients: ing(
      ["cartofi", "ulei vegetal", "sare"],
      ["potatoes", "vegetable oil", "salt"],
    ),
    serving: ml("200 g"),
    nutrition: { calories: 312, fat: 15, saturatedFat: 2.5, carbohydrates: 41, sugar: 0.5, protein: 3.4, salt: 0.8 },
  },
  "cartofi-parmezan": {
    ingredients: ing(
      ["cartofi", "ulei vegetal", "sare", "parmezan"],
      ["potatoes", "vegetable oil", "salt", "parmesan"],
    ),
    allergens: ["milk"],
    serving: ml("200 g"),
    nutrition: { calories: 380, fat: 21, saturatedFat: 6, carbohydrates: 41, sugar: 0.5, protein: 8, salt: 1.1 },
  },
  "cartofi-smoky": {
    ingredients: ing(
      ["cartofi", "ulei vegetal", "sare", "condiment afumat"],
      ["potatoes", "vegetable oil", "salt", "smoked seasoning"],
    ),
    serving: ml("200 g"),
    nutrition: { calories: 330, fat: 16, saturatedFat: 3, carbohydrates: 42, sugar: 0.6, protein: 3.6, salt: 1.2 },
  },
  "cartofi-spicy": {
    ingredients: ing(
      ["cartofi", "ulei vegetal", "sare", "ardei iute", "condiment iute"],
      ["potatoes", "vegetable oil", "salt", "chilli", "hot spice mix"],
    ),
    serving: ml("200 g"),
    nutrition: { calories: 330, fat: 16, saturatedFat: 3, carbohydrates: 42, sugar: 0.6, protein: 3.6, salt: 1.2 },
  },
  bierdog: {
    ingredients: ing(
      ["chiflă", "cârnat de porc", "muștar", "ketchup"],
      ["bun", "pork sausage", "mustard", "ketchup"],
    ),
    allergens: ["gluten", "mustard", "celery"],
    serving: ml("1 buc"),
    nutrition: { calories: 400, fat: 22, saturatedFat: 8, carbohydrates: 32, sugar: 5, protein: 14, salt: 2.1 },
  },

  // Long drinks — 250 ml plus gheață; ABV calculat la rețetă, orientativ.
  "jack-coke": {
    ingredients: ing(
      ["Jack Daniel's", "cola", "lămâie", "gheață"],
      ["Jack Daniel's", "cola", "lemon", "ice"],
    ),
    serving: ml("250 ml"),
    abv: 8,
    nutrition: { calories: 150, fat: 0, saturatedFat: 0, carbohydrates: 14, sugar: 14, protein: 0, salt: 0.01 },
  },
  "cuba-libre": {
    ingredients: ing(
      ["rom", "cola", "lime", "gheață"],
      ["rum", "cola", "lime", "ice"],
    ),
    serving: ml("250 ml"),
    abv: 8,
    nutrition: { calories: 145, fat: 0, saturatedFat: 0, carbohydrates: 14, sugar: 13, protein: 0, salt: 0.01 },
  },
  "gin-tonic": {
    ingredients: ing(
      ["gin", "apă tonică", "lime", "gheață"],
      ["gin", "tonic water", "lime", "ice"],
    ),
    allergens: ["sulphites"],
    serving: ml("250 ml"),
    abv: 7,
    nutrition: { calories: 130, fat: 0, saturatedFat: 0, carbohydrates: 11, sugar: 11, protein: 0, salt: 0.01 },
  },
  "vodka-tonic": {
    ingredients: ing(
      ["vodka", "apă tonică", "lime", "gheață"],
      ["vodka", "tonic water", "lime", "ice"],
    ),
    allergens: ["sulphites"],
    serving: ml("250 ml"),
    abv: 7,
    nutrition: { calories: 125, fat: 0, saturatedFat: 0, carbohydrates: 11, sugar: 11, protein: 0, salt: 0.01 },
  },
  "jager-coke": {
    ingredients: ing(
      ["Jägermeister", "cola", "gheață"],
      ["Jägermeister", "cola", "ice"],
    ),
    serving: ml("250 ml"),
    abv: 8,
    nutrition: { calories: 160, fat: 0, saturatedFat: 0, carbohydrates: 17, sugar: 16, protein: 0, salt: 0.01 },
  },

  // Shoturi / măsuri — 40 ml.
  "jack-daniels": {
    ingredients: ing(["whiskey de Tennessee"], ["Tennessee whiskey"]),
    serving: ml("40 ml"),
    abv: 40,
    nutrition: { calories: 94, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  "vodka-russian-standard": {
    ingredients: ing(["vodka", "apă dedurizată"], ["vodka", "softened water"]),
    serving: ml("40 ml"),
    abv: 40,
    nutrition: { calories: 94, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  "jack-fire": {
    ingredients: ing(["whiskey de Tennessee", "scorțișoară"], ["Tennessee whiskey", "cinnamon"]),
    serving: ml("40 ml"),
    abv: 35,
    nutrition: { calories: 82, fat: 0, saturatedFat: 0, carbohydrates: 0.6, sugar: 0.6, protein: 0, salt: 0 },
  },
  "jack-apple": {
    ingredients: ing(["whiskey de Tennessee", "lichior de măr"], ["Tennessee whiskey", "apple liqueur"]),
    serving: ml("40 ml"),
    abv: 35,
    nutrition: { calories: 82, fat: 0, saturatedFat: 0, carbohydrates: 1.2, sugar: 1.2, protein: 0, salt: 0 },
  },
  "jack-honey": {
    ingredients: ing(["whiskey de Tennessee", "lichior de miere"], ["Tennessee whiskey", "honey liqueur"]),
    serving: ml("40 ml"),
    abv: 35,
    nutrition: { calories: 82, fat: 0, saturatedFat: 0, carbohydrates: 0.8, sugar: 0.8, protein: 0, salt: 0 },
  },
  "tatritea-52": {
    ingredients: ing(["țuică de prune"], ["plum brandy"]),
    serving: ml("40 ml"),
    abv: 52,
    nutrition: { calories: 122, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  "tatritea-62-72": {
    ingredients: ing(["țuică de prune"], ["plum brandy"]),
    serving: ml("40 ml"),
    abv: 62,
    nutrition: { calories: 146, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
  "tequila-el-camino": {
    ingredients: ing(["tequila 100% agave"], ["100% agave tequila"]),
    serving: ml("40 ml"),
    abv: 38,
    nutrition: { calories: 89, fat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, protein: 0, salt: 0 },
  },
};

export const categories: Category[] = RAW_CATEGORIES.map((category) => ({
  ...category,
  items: category.items.map((item) => ({ ...item, ...(DETAILS[item.id] ?? {}) })),
}));

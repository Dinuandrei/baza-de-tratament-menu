import type { Locale } from "@/lib/i18n";
import type { ItemIconName } from "@/lib/icons";

export type Localized = Record<Locale, string>;

export type Tag = "na" | "spicy" | "new";

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

const same = (value: string): Localized => ({ ro: value, en: value, bg: value, sr: value });

const l = (ro: string, en: string, bg: string, sr: string): Localized => ({ ro, en, bg, sr });

/** Description in the two languages it is written in so far. */
const d = (ro: string, en: string): Partial<Localized> => ({ ro, en });

export const categories: Category[] = [
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

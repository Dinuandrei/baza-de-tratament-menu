import type { Locale } from "@/lib/i18n";

export type Localized = Record<Locale, string>;

export type Tag = "na" | "spicy" | "new";

export type Item = {
  id: string;
  name: Localized;
  desc?: Localized;
  /** Price in lei. Omit when it is not fixed (shown as “—”). */
  price?: number;
  tags?: Tag[];
};

export type Category = {
  id: string;
  name: Localized;
  note?: Localized;
  items: Item[];
};

const same = (value: string): Localized => ({ ro: value, en: value, de: value, fr: value });

const l = (ro: string, en: string, de: string, fr: string): Localized => ({ ro, en, de, fr });

export const categories: Category[] = [
  {
    id: "cafea",
    name: l("Cafea", "Coffee", "Kaffee", "Café"),
    items: [
      { id: "espresso", name: same("Espresso"), price: 10 },
      {
        id: "cafea-lunga",
        name: l("Cafea lungă", "Long coffee", "Langer Kaffee", "Café long"),
        price: 10,
      },
      { id: "americano", name: same("Americano"), price: 10 },
      { id: "macchiato", name: same("Macchiato"), price: 14 },
      { id: "flat-white", name: same("Flat White"), price: 16 },
    ],
  },
  {
    id: "ape",
    name: l("Apă & Răcoritoare", "Water & Softs", "Wasser & Erfrischung", "Eau & Sodas"),
    items: [
      {
        id: "apa-plata",
        name: l("Apă plată", "Still water", "Stilles Wasser", "Eau plate"),
        price: 10,
      },
      {
        id: "apa-minerala",
        name: l("Apă minerală", "Sparkling water", "Sprudelwasser", "Eau gazeuse"),
        price: 10,
      },
      { id: "cola", name: same("Cola"), price: 15 },
      { id: "fanta", name: same("Fanta"), price: 15 },
      { id: "sprite", name: same("Sprite"), price: 15 },
      { id: "fuzz-tea", name: same("Fuzz Tea"), price: 15 },
    ],
  },
  {
    id: "bere",
    name: l("Bere", "Beer", "Bier", "Bière"),
    items: [
      { id: "guinness", name: same("Guinness"), price: 29 },
      { id: "bucur-lager", name: same("Bucur Lager"), price: 17 },
    ],
  },
  {
    id: "bauturi-calde",
    name: l("Băuturi calde", "Hot drinks", "Heißgetränke", "Boissons chaudes"),
    items: [
      { id: "strudel-stroh", name: same("Strudel Stroh"), price: 22 },
      { id: "hot-kafka", name: same("Hot Kafka"), price: 24 },
      { id: "amaretto-strudel", name: same("Amaretto Strudel"), price: 24 },
      { id: "hot-ginger-gin", name: same("Hot Ginger Gin"), price: 24 },
      {
        id: "suc-mere-cald",
        name: l(
          "Suc de mere cald (0%)",
          "Warm apple juice (0%)",
          "Warmer Apfelsaft (0%)",
          "Jus de pomme chaud (0%)",
        ),
        price: 12,
        tags: ["na"],
      },
      { id: "hot-ginger", name: same("Hot Ginger (0%)"), price: 14, tags: ["na"] },
      {
        id: "ceai",
        name: l("Ceai fierbinte", "Hot tea", "Heißer Tee", "Thé chaud"),
        price: 10,
      },
      {
        id: "ciocolata-calda",
        name: l("Ciocolată caldă", "Hot chocolate", "Heiße Schokolade", "Chocolat chaud"),
        price: 20,
      },
      { id: "kit-kat-choco", name: same("Kit Kat Choco"), price: 15 },
    ],
  },
  {
    id: "mancare",
    name: l("Mâncare", "Food", "Essen", "À manger"),
    items: [
      {
        id: "cartofi-prajiti",
        name: l("Cartofi prăjiți", "French fries", "Pommes frites", "Frites"),
      },
      {
        id: "cartofi-parmezan",
        name: l(
          "Cartofi cu parmezan",
          "Parmesan fries",
          "Pommes mit Parmesan",
          "Frites au parmesan",
        ),
      },
      { id: "cartofi-smoky", name: same("Cartofi Smoky Stuff") },
      { id: "cartofi-spicy", name: same("Cartofi Spicy Stuff"), tags: ["spicy"] },
      { id: "bierdog", name: same("Bierdog") },
    ],
  },
  {
    id: "long-drinks",
    name: same("Long drinks"),
    items: [
      { id: "jack-coke", name: same("Jack & Coke"), price: 25 },
      { id: "cuba-libre", name: same("Cuba Libre"), price: 24 },
      { id: "gin-tonic", name: same("Gin Tonic") },
      { id: "vodka-tonic", name: same("Vodka Tonic") },
      { id: "jager-coke", name: same("Jager Coke") },
    ],
  },
  {
    id: "shoturi",
    name: l("Shoturi / Măsuri", "Shots", "Shots", "Shots"),
    items: [
      { id: "jack-daniels", name: same("Jack Daniel's") },
      { id: "vodka-russian-standard", name: same("Vodka Russian Standard") },
      { id: "jack-fire", name: same("Jack Fire") },
      { id: "jack-apple", name: same("Jack Apple") },
      { id: "jack-honey", name: same("Jack Honey") },
      { id: "tatritea-52", name: same("Tatrițea 52") },
      { id: "tatritea-62-72", name: same("Tatrițea 62 / 72") },
      { id: "tequila-el-camino", name: same("Tequila El Camino") },
    ],
  },
];

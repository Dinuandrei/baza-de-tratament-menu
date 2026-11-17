import type { Locale } from "@/lib/i18n";
import type { ItemIconName } from "@/lib/icons";

export type Localized = Record<Locale, string>;

export type Tag = "na" | "spicy" | "new";

export type Item = {
  id: string;
  icon: ItemIconName;
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

const same = (value: string): Localized => ({ ro: value, en: value, bg: value, sr: value });

const l = (ro: string, en: string, bg: string, sr: string): Localized => ({ ro, en, bg, sr });

export const categories: Category[] = [
  {
    id: "cafea",
    name: l("Cafea", "Coffee", "Кафе", "Кафа"),
    items: [
      { id: "espresso", icon: "espresso", name: same("Espresso"), price: 10 },
      { id: "cafea-lunga", icon: "lung", name: l("Cafea lungă", "Long coffee", "Дълго кафе", "Дуга кафа"), price: 10 },
      { id: "americano", icon: "americano", name: same("Americano"), price: 10 },
      { id: "macchiato", icon: "macchiato", name: same("Macchiato"), price: 14 },
      { id: "flat-white", icon: "flatwhite", name: same("Flat White"), price: 16 },
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
      },
      {
        id: "apa-minerala", icon: "water-sparkling",
        name: l("Apă minerală", "Sparkling water", "Газирана вода", "Газирана вода"),
        price: 10,
      },
      { id: "cola", icon: "can", name: same("Cola"), price: 15 },
      { id: "fanta", icon: "can-fruit", name: same("Fanta"), price: 15 },
      { id: "sprite", icon: "can-fruit", name: same("Sprite"), price: 15 },
      { id: "fuzz-tea", icon: "iced-tea", name: same("Fuzz Tea"), price: 15 },
    ],
  },
  {
    id: "bere",
    name: l("Bere", "Beer", "Бира", "Пиво"),
    items: [
      { id: "guinness", icon: "beer-pint", name: same("Guinness"), price: 29 },
      { id: "bucur-lager", icon: "beer-mug", name: same("Bucur Lager"), price: 17 },
    ],
  },
  {
    id: "bauturi-calde",
    name: l("Băuturi calde", "Hot drinks", "Топли напитки", "Топли напици"),
    items: [
      { id: "strudel-stroh", icon: "mulled", name: same("Strudel Stroh"), price: 22 },
      { id: "hot-kafka", icon: "hot-glass", name: same("Hot Kafka"), price: 24 },
      { id: "amaretto-strudel", icon: "mulled", name: same("Amaretto Strudel"), price: 24 },
      { id: "hot-ginger-gin", icon: "mulled", name: same("Hot Ginger Gin"), price: 24 },
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
      },
      { id: "hot-ginger", icon: "ginger-mug", name: same("Hot Ginger (0%)"), price: 14, tags: ["na"] },
      {
        id: "ceai", icon: "tea",
        name: l("Ceai fierbinte", "Hot tea", "Горещ чай", "Врућ чај"),
        price: 10,
      },
      {
        id: "ciocolata-calda", icon: "choco",
        name: l("Ciocolată caldă", "Hot chocolate", "Горещ шоколад", "Врућа чоколада"),
        price: 20,
      },
      { id: "kit-kat-choco", icon: "wafer", name: same("Kit Kat Choco"), price: 15 },
    ],
  },
  {
    id: "mancare",
    name: l("Mâncare", "Food", "Храна", "Храна"),
    items: [
      {
        id: "cartofi-prajiti", icon: "fries",
        name: l("Cartofi prăjiți", "French fries", "Пържени картофи", "Помфрит"),
      },
      {
        id: "cartofi-parmezan", icon: "fries-cheese",
        name: l(
          "Cartofi cu parmezan",
          "Parmesan fries",
          "Пържени картофи с пармезан",
          "Помфрит с пармезан",
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
      },
      {
        id: "bierdog", icon: "hotdog",
        name: l("Bierdog", "Beer dog", "Бирдог", "Бирдог"),
      },
    ],
  },
  {
    id: "long-drinks",
    name: l("Long drinks", "Long drinks", "Лонг дринкове", "Лонг дринкови"),
    items: [
      { id: "jack-coke", icon: "long-dark", name: same("Jack & Coke"), price: 25 },
      { id: "cuba-libre", icon: "long-dark", name: same("Cuba Libre"), price: 24 },
      { id: "gin-tonic", icon: "long-clear", name: same("Gin Tonic") },
      { id: "vodka-tonic", icon: "long-clear", name: same("Vodka Tonic") },
      { id: "jager-coke", icon: "long-dark", name: same("Jager Coke") },
    ],
  },
  {
    id: "shoturi",
    name: l("Shoturi / Măsuri", "Shots", "Шотове", "Шотови"),
    items: [
      { id: "jack-daniels", icon: "whiskey", name: same("Jack Daniel's") },
      { id: "vodka-russian-standard", icon: "bottle-vodka", name: same("Vodka Russian Standard") },
      { id: "jack-fire", icon: "whiskey-fire", name: same("Jack Fire") },
      { id: "jack-apple", icon: "whiskey-apple", name: same("Jack Apple") },
      { id: "jack-honey", icon: "whiskey-honey", name: same("Jack Honey") },
      { id: "tatritea-52", icon: "bottle", name: same("Tatrițea 52") },
      { id: "tatritea-62-72", icon: "bottle", name: same("Tatrițea 62 / 72") },
      { id: "tequila-el-camino", icon: "tequila", name: same("Tequila El Camino") },
    ],
  },
];

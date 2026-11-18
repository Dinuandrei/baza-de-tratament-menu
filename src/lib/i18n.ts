export const locales = ["ro", "en", "bg", "sr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ro";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** How each language names itself on the picker. */
export const localeLabels: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  bg: "Български",
  sr: "Српски",
};

/** Native <html lang> / hreflang codes. */
export const localeHtmlLang: Record<Locale, string> = {
  ro: "ro",
  en: "en",
  bg: "bg",
  sr: "sr",
};

export const t = {
  chooseLanguage: {
    ro: "Alege limba",
    en: "Choose language",
    bg: "Изберете език",
    sr: "Изаберите језик",
  },
  seeMenu: {
    ro: "Vezi meniul",
    en: "See the menu",
    bg: "Вижте менюто",
    sr: "Погледајте мени",
  },
  continueAs: {
    ro: "Continuă",
    en: "Continue",
    bg: "Продължи",
    sr: "Настави",
  },
  menu: {
    ro: "Meniul",
    en: "Menu",
    bg: "Меню",
    sr: "Мени",
  },
  language: {
    ro: "Limba",
    en: "Language",
    bg: "Език",
    sr: "Језик",
  },
  pricesNote: {
    ro: "Prețurile sunt în lei, cu TVA inclus.",
    en: "Prices are in lei (RON), VAT included.",
    bg: "Цените са в леи (RON), с включено ДДС.",
    sr: "Цене су у лејима (RON), са укљученим ПДВ-ом.",
  },
  priceOnRequest: {
    ro: "preț la cerut",
    en: "ask",
    bg: "при заявка",
    sr: "на упит",
  },
  details: {
    ro: "Vezi detalii",
    en: "See details",
    bg: "Вижте детайли",
    sr: "Види детаље",
  },
  close: {
    ro: "Închide",
    en: "Close",
    bg: "Затвори",
    sr: "Затвори",
  },
  back: {
    ro: "Schimbă limba",
    en: "Change language",
    bg: "Смяна на езика",
    sr: "Промени језик",
  },
  na: {
    ro: "fără alcool",
    en: "no alcohol",
    bg: "безалкохолно",
    sr: "без алкохола",
  },
  spicy: {
    ro: "picant",
    en: "spicy",
    bg: "лютиво",
    sr: "љуто",
  },
  ingredients: {
    ro: "Ingrediente",
    en: "Ingredients",
    bg: "Съставки",
    sr: "Састојци",
  },
  noIngredients: {
    ro: "Nu există ingrediente listate.",
    en: "No ingredients listed.",
    bg: "Няма посочени съставки.",
    sr: "Нема наведених састојака.",
  },
  allergens: {
    ro: "Alergeni",
    en: "Allergens",
    bg: "Алергени",
    sr: "Алергени",
  },
  noAllergens: {
    ro: "Nu conține alergeni cunoscuți.",
    en: "Does not contain known allergens.",
    bg: "Не съдържа известни алергени.",
    sr: "Не садржи познате алергене.",
  },
  nutrition: {
    ro: "Valori nutriționale",
    en: "Nutritional values",
    bg: "Хранителни стойности",
    sr: "Нутритивне вредности",
  },
  noNutrition: {
    ro: "Nu există informații nutriționale.",
    en: "No nutritional information available.",
    bg: "Няма информация за хранителните стойности.",
    sr: "Нема података о нутритивним вредностима.",
  },
  calories: {
    ro: "Calorii",
    en: "Calories",
    bg: "Калории",
    sr: "Калорије",
  },
  fat: {
    ro: "Grăsimi",
    en: "Fat",
    bg: "Мазнини",
    sr: "Масти",
  },
  saturatedFat: {
    ro: "din care saturate",
    en: "of which saturates",
    bg: "от които наситени",
    sr: "од чега засићене",
  },
  carbohydrates: {
    ro: "Carbohidrați",
    en: "Carbohydrates",
    bg: "Въглехидрати",
    sr: "Угљени хидрати",
  },
  sugar: {
    ro: "din care zaharuri",
    en: "of which sugars",
    bg: "от които захари",
    sr: "од чега шећери",
  },
  protein: {
    ro: "Proteine",
    en: "Protein",
    bg: "Белтъци",
    sr: "Протеини",
  },
  salt: {
    ro: "Sare",
    en: "Salt",
    bg: "Сол",
    sr: "Со",
  },
  serving: {
    ro: "Porție",
    en: "Serving",
    bg: "Порция",
    sr: "Порција",
  },
  abv: {
    ro: "Alcool",
    en: "Alcohol",
    bg: "Алкохол",
    sr: "Алкохол",
  },
  perServing: {
    ro: "valori per porție",
    en: "per serving",
    bg: "за порция",
    sr: "по порцији",
  },
  allergenNote: {
    ro: "Spune personalului dacă ai o alergie — preparatele se fac în aceeași bucătărie.",
    en: "Tell the staff about any allergy — dishes are prepared in the same kitchen.",
    bg: "Уведомете персонала при алергия — храната се приготвя в обща кухня.",
    sr: "Обавестите особље о алергијама — јела се припремају у истој кухињи.",
  },
} satisfies Record<string, Record<Locale, string>>;

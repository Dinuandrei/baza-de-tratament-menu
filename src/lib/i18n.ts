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
} satisfies Record<string, Record<Locale, string>>;

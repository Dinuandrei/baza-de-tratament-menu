export const locales = ["ro", "en", "de", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ro";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** How each language names itself on the picker screen. */
export const localeLabels: Record<Locale, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

export const t = {
  chooseLanguage: {
    ro: "Alege limba",
    en: "Choose language",
    de: "Sprache wählen",
    fr: "Choisir la langue",
  },
  seeMenu: {
    ro: "Vezi meniul",
    en: "See the menu",
    de: "Zur Karte",
    fr: "Voir la carte",
  },
  continueAs: {
    ro: "Continuă",
    en: "Continue",
    de: "Weiter",
    fr: "Continuer",
  },
  menu: {
    ro: "Meniul",
    en: "Menu",
    de: "Karte",
    fr: "Carte",
  },
  language: {
    ro: "Limba",
    en: "Language",
    de: "Sprache",
    fr: "Langue",
  },
  pricesNote: {
    ro: "Prețurile sunt în lei, cu TVA inclus.",
    en: "Prices are in lei (RON), VAT included.",
    de: "Preise in Lei (RON), inkl. MwSt.",
    fr: "Prix en lei (RON), TVA incluse.",
  },
  priceOnRequest: {
    ro: "preț la cerut",
    en: "ask",
    de: "auf Anfrage",
    fr: "sur demande",
  },
  back: {
    ro: "Schimbă limba",
    en: "Change language",
    de: "Sprache ändern",
    fr: "Changer de langue",
  },
  na: {
    ro: "fără alcool",
    en: "no alcohol",
    de: "alkoholfrei",
    fr: "sans alcool",
  },
  spicy: {
    ro: "picant",
    en: "spicy",
    de: "scharf",
    fr: "épicé",
  },
} satisfies Record<string, Record<Locale, string>>;

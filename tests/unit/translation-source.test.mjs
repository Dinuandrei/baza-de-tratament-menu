import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { locales, isLocale, localeHtmlLang, localeLabels, t } from "@/lib/i18n";
import {
  descriptionHash,
  ingredientsHash,
  nameHash,
  needsTranslation,
  sourceHash,
} from "@/lib/translation-source";

const ITEM = {
  name: { ro: "Espresso" },
  description: { ro: "Cafea scurtă și intensă." },
  ingredients: { ro: ["cafea", "apă"] },
  serving: { ro: "30 ml" },
};

describe("fingerprints", () => {
  it("is stable for the same content", () => {
    assert.equal(sourceHash(ITEM), sourceHash({ ...ITEM }));
    assert.equal(nameHash(ITEM), nameHash({ name: { ro: "Espresso" } }));
  });

  it("is a short hex string", () => {
    assert.match(sourceHash(ITEM), /^[0-9a-f]{8}$/);
    assert.match(ingredientsHash(ITEM), /^[0-9a-f]{8}$/);
  });

  it("distinguishes different text", () => {
    assert.notEqual(nameHash(ITEM), nameHash({ name: { ro: "Espresso Doppio" } }));
    assert.notEqual(
      descriptionHash(ITEM),
      descriptionHash({ description: { ro: "Cafea scurtă și intensă!" } }),
    );
  });

  it("is independent per field", () => {
    const priceEdit = { ...ITEM, name: { ro: "Espresso" }, description: { ro: "Altceva" } };
    assert.equal(nameHash(ITEM), nameHash(priceEdit));
    assert.notEqual(descriptionHash(ITEM), descriptionHash(priceEdit));
    assert.equal(ingredientsHash(ITEM), ingredientsHash(priceEdit));
  });

  it("notices ingredient order and count", () => {
    assert.notEqual(ingredientsHash(ITEM), ingredientsHash({ ingredients: { ro: ["apă", "cafea"] } }));
    assert.notEqual(ingredientsHash(ITEM), ingredientsHash({ ingredients: { ro: ["cafea"] } }));
  });

  it("hashes a missing field like an empty one", () => {
    // A doc with no name at all and one with an empty Romanian name are both
    // "nothing to translate", so they must fingerprint the same way.
    assert.equal(nameHash({}), nameHash({ name: { ro: "" } }));
    assert.equal(descriptionHash({}), descriptionHash({ description: { ro: "" } }));
    assert.equal(ingredientsHash({}), ingredientsHash({ ingredients: { ro: [] } }));
  });

  it("does not normalise whitespace (a trailing space is an edit)", () => {
    // Documented trade-off: the fingerprint is the text, not its trimmed form, so
    // a stray space does cause one extra translation.
    assert.notEqual(nameHash({ name: { ro: "Espresso " } }), nameHash({ name: { ro: "Espresso" } }));
  });

  it("ignores the target locales", () => {
    // A hand-corrected en/bg/sr must not make the source look changed, otherwise
    // every review would retranslate the field it just fixed.
    const translated = {
      ...ITEM,
      name: { ro: "Espresso", en: "Espresso", bg: "Еспресо" },
      description: { ro: ITEM.description.ro, en: "A short, intense coffee." },
    };
    assert.equal(sourceHash(ITEM), sourceHash(translated));
    assert.equal(descriptionHash(ITEM), descriptionHash(translated));
  });

  it("includes serving in the overall hash only", () => {
    assert.notEqual(sourceHash(ITEM), sourceHash({ ...ITEM, serving: { ro: "40 ml" } }));
    assert.equal(nameHash(ITEM), nameHash({ ...ITEM, serving: { ro: "40 ml" } }));
  });

  it("does not collide on distinct short strings", () => {
    const seen = new Set();
    for (const word of ["a", "b", "c", "ab", "ba", "aa", "Espresso", "espresso"]) {
      seen.add(nameHash({ name: { ro: word } }));
    }
    assert.equal(seen.size, 8);
  });
});

describe("needsTranslation", () => {
  it("is false for the source locale", () => {
    assert.equal(needsTranslation(ITEM, "ro"), false);
  });

  it("is true when the description is missing", () => {
    assert.equal(needsTranslation(ITEM, "en"), true);
  });

  it("is true when the description still holds the Romanian text", () => {
    const untouched = { ...ITEM, description: { ro: ITEM.description.ro, en: ITEM.description.ro } };
    assert.equal(needsTranslation(untouched, "en"), true);
  });

  it("is false for a real translation", () => {
    const done = {
      description: { ro: ITEM.description.ro, en: "A short, intense coffee." },
    };
    assert.equal(needsTranslation(done, "en"), false);
  });

  it("is true when any single field is still untranslated", () => {
    // It is an OR over the fields on purpose: one missing piece is enough to
    // re-run the webhook, and the per-field staleness in the route keeps the rest.
    const partly = { ...ITEM, description: { ro: ITEM.description.ro, en: "A short, intense coffee." } };
    assert.equal(needsTranslation(partly, "en"), true, "ingredients are still Romanian");
  });

  it("treats a whitespace-only translation as missing", () => {
    const blank = { ...ITEM, description: { ro: ITEM.description.ro, en: "   " } };
    assert.equal(needsTranslation(blank, "en"), true);
  });

  it("notices an ingredient list that is still the Romanian one", () => {
    const untouched = { ...ITEM, ingredients: { ro: ["cafea", "apă"], en: ["cafea", "apă"] } };
    assert.equal(needsTranslation(untouched, "en"), true);
  });

  it("is false when the ingredient list is translated", () => {
    const done = {
      description: { ro: ITEM.description.ro, en: "A short, intense coffee." },
      ingredients: { ro: ["cafea", "apă"], en: ["coffee", "water"] },
    };
    assert.equal(needsTranslation(done, "en"), false);
  });

  it("is false when there is nothing to translate from", () => {
    assert.equal(needsTranslation({}, "en"), false);
    assert.equal(needsTranslation({ description: { ro: "   " } }, "en"), false);
    assert.equal(needsTranslation({ description: { en: "text" } }, "en"), false);
  });
});

describe("i18n", () => {
  it("accepts only the four lowercase locales", () => {
    for (const locale of locales) assert.equal(isLocale(locale), true);
    for (const value of ["RO", "En", "BG", "xx", "", "ro ", "ro-ro", "română"]) {
      assert.equal(isLocale(value), false, `isLocale(${JSON.stringify(value)})`);
    }
  });

  it("has a label and an html lang for every locale", () => {
    for (const locale of locales) {
      assert.equal(typeof localeLabels[locale], "string");
      assert.ok(localeLabels[locale].length > 0);
      assert.match(localeHtmlLang[locale], /^[a-z]{2}$/);
    }
  });

  it("translates every UI string into all four locales", () => {
    for (const [key, value] of Object.entries(t)) {
      for (const locale of locales) {
        assert.equal(typeof value[locale], "string", `${key}.${locale} must be a string`);
        assert.ok(value[locale].trim().length > 0, `${key}.${locale} must not be empty`);
      }
    }
  });
});

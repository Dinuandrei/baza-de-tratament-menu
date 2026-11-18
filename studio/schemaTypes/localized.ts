import {defineField, defineType} from 'sanity'

/**
 * The four languages the menu ships in (src/lib/i18n.ts in the app).
 * Every human-readable string in the Studio is stored as this shape so the
 * frontend can read `name[locale]` directly — no per-locale fields to merge.
 */
const LOCALES = [
  {id: 'ro', title: 'Română'},
  {id: 'en', title: 'English'},
  {id: 'bg', title: 'Български'},
  {id: 'sr', title: 'Српски'},
] as const

const localeFields = LOCALES.map((locale) =>
  defineField({
    name: locale.id,
    title: locale.title,
    type: 'string',
    validation: (Rule) =>
      locale.id === 'ro' ? Rule.required().error('Româna este limba de bază') : Rule,
  })
)

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Text (4 limbi)',
  type: 'object',
  options: {collapsible: false, columns: 2},
  fields: localeFields,
})

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Text lung (4 limbi)',
  type: 'object',
  options: {collapsible: false, columns: 2},
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale.id,
      title: locale.title,
      type: 'text',
      rows: 2,
    })
  ),
})

/**
 * Ingredients are per language, but the allergens are NOT: they come from a
 * fixed EU-14 list (schemaTypes/allergens.ts) so the pill labels stay
 * consistent. This wraps just the localized ingredient lists.
 */
export const localizedList = defineType({
  name: 'localizedList',
  title: 'Listă (4 limbi)',
  type: 'object',
  options: {collapsible: false, columns: 2},
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale.id,
      title: locale.title,
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (Rule) =>
        locale.id === 'ro' ? Rule.required().error('Româna este limba de bază') : Rule,
    })
  ),
})

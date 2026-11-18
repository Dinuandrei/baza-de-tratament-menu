import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ALLERGENS} from './allergens'

/** Must stay in sync with `itemIconNames` in the app's src/lib/icons.ts */
const ICONS = [
  'espresso',
  'lung',
  'americano',
  'macchiato',
  'flatwhite',
  'water-still',
  'water-sparkling',
  'can',
  'can-fruit',
  'iced-tea',
  'beer-pint',
  'beer-mug',
  'hot-mug',
  'hot-glass',
  'mulled',
  'apple-juice',
  'ginger-mug',
  'tea',
  'choco',
  'wafer',
  'fries',
  'fries-cheese',
  'fries-smoke',
  'fries-chili',
  'hotdog',
  'long-dark',
  'long-clear',
  'shot',
  'whiskey',
  'whiskey-fire',
  'whiskey-apple',
  'whiskey-honey',
  'bottle',
  'bottle-vodka',
  'tequila',
]

export default defineType({
  name: 'menuItem',
  title: 'Produs',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'menuItem'}),
    defineField({
      name: 'name',
      title: 'Nume produs',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descriere (opțional)',
      type: 'localizedText',
    }),
    defineField({
      name: 'price',
      title: 'Preț (lei)',
      type: 'number',
      description: 'Lasă gol dacă prețul nu este fix — în meniu apare „—”.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'tags',
      title: 'Etichete',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'grid',
        list: [
          {title: 'Fără alcool (0%)', value: 'na'},
          {title: 'Picant', value: 'spicy'},
          {title: 'Nou', value: 'new'},
        ],
      },
    }),
    defineField({
      name: 'icon',
      title: 'Pictogramă',
      type: 'string',
      options: {list: ICONS.map((value) => ({title: value, value}))},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Fotografie produs',
      type: 'image',
      description:
        'Opțional. Fără fotografie, popup-ul „Vezi detalii” arată pictograma pe fundal de brand.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'category',
      title: 'Categorie',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
    // --- Detalii produs: ce se vede în popup-ul „Vezi detalii” ---
    defineField({
      name: 'ingredients',
      title: 'Ingrediente',
      type: 'localizedList',
      description:
        'Lista de ingrediente, pe limbi. Lasă gol dacă nu vrei să apari cu lista — popup-ul scrie „Nu există ingrediente listate”.',
    }),
    defineField({
      name: 'allergens',
      title: 'Alergeni declarați (UE 14)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'grid', list: [...ALLERGENS]},
      description:
        'Obligatoriu legal pentru orice produs servit (Reg. UE 1169/2011). Alege doar ce conține produsul; lasă gol doar dacă nu conține niciunul.',
    }),
    defineField({
      name: 'nutrition',
      title: 'Valori nutriționale',
      type: 'object',
      options: {collapsible: true, collapsed: true, columns: 2},
      description:
        'Valori orientative per porție. Completează doar ce știi — rândurile goale nu apar.',
      fields: [
        defineField({name: 'calories', title: 'Calorii (kcal)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'fat', title: 'Grăsimi (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'saturatedFat', title: 'din care saturate (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'carbohydrates', title: 'Carbohidrați (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'sugar', title: 'din care zaharuri (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'protein', title: 'Proteine (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
        defineField({name: 'salt', title: 'Sare (g)', type: 'number', validation: (Rule) => Rule.min(0)}),
      ],
    }),
    defineField({
      name: 'serving',
      title: 'Porție',
      type: 'localizedString',
      description: 'Ex. „330 ml”, „200 g”, „1 buc”. Opțional.',
    }),
    defineField({
      name: 'abv',
      title: 'Alcool (% vol)',
      type: 'number',
      description: 'Doar la băuturile alcoolice, ex. 4.2 sau 40.',
      validation: (Rule) => Rule.min(0).max(96),
    }),
  ],
  preview: {
    select: {title: 'name.ro', subtitle: 'name.en', price: 'price', icon: 'icon'},
    prepare({title, subtitle, price, icon}) {
      const lei = typeof price === 'number' ? `${price} lei` : '—'
      return {title: `${title ?? 'Fără nume'} · ${lei}`, subtitle: `${icon ?? ''} ${subtitle ?? ''}`}
    },
  },
})

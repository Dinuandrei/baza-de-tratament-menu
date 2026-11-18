import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

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
  ],
  preview: {
    select: {title: 'name.ro', subtitle: 'name.en', price: 'price', icon: 'icon'},
    prepare({title, subtitle, price, icon}) {
      const lei = typeof price === 'number' ? `${price} lei` : '—'
      return {title: `${title ?? 'Fără nume'} · ${lei}`, subtitle: `${icon ?? ''} ${subtitle ?? ''}`}
    },
  },
})

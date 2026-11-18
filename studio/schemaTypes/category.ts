import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

export default defineType({
  name: 'category',
  title: 'Categorie',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'category'}),
    defineField({
      name: 'title',
      title: 'Nume categorie',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Notă (opțional)',
      type: 'localizedText',
      description: 'Apare sub numele categoriei, dacă e completată.',
    }),
  ],
  preview: {
    select: {title: 'title.ro', subtitle: 'title.en'},
  },
})

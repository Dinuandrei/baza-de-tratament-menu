import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Setări site',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titlu',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'footerNote',
      title: 'Notă subsol (ex. TVA)',
      type: 'localizedText',
    }),
  ],
  preview: {
    select: {title: 'title.ro'},
  },
})

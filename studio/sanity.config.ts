import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'baza-de-tratament',
  title: 'Baza de Tratament — Meniu',

  projectId: 'w6d4ck0i',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S, context) => {
        const {getClient} = context
        const client = getClient({apiVersion: '2024-03-27'})

        return S.list()
          .title('Conținut')
          .items([
            orderableDocumentListDeskItem({
              type: 'category',
              title: 'Categorii',
              context,
              S,
            }),
            S.divider(),
            S.listItem()
              .title('Produse pe categorii')
              .id('menuItemsGrouped')
              .child(async () => {
                const categories = await client.fetch(
                  `*[_type == "category"]{_id, "name": title.ro} | order(orderRank asc, title.ro asc)`
                )

                return S.list()
                  .title('Produse pe categorii')
                  .items(
                    categories.map((cat: {_id: string; name: string}) =>
                      orderableDocumentListDeskItem({
                        type: 'menuItem',
                        id: `menuItem-${cat._id}`,
                        title: cat.name || 'Fără nume',
                        filter: `_type == "menuItem" && category._ref == $categoryId`,
                        params: {categoryId: cat._id},
                        context,
                        S,
                      })
                    )
                  )
              }),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => !['category', 'menuItem'].includes(item.getId() as string)
            ),
          ])
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})

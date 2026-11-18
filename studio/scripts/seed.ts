/**
 * Seeds the menu into Sanity from the static source of truth.
 *
 *   npx sanity exec scripts/seed.ts --with-user-token
 *
 * Idempotent: every document gets a stable `_id` derived from the item id, so
 * re-running updates instead of duplicating. Safe to run after a data change.
 */
import {getCliClient} from 'sanity/cli'
import {categories} from '../../src/data/menu'

const client = getCliClient({apiVersion: '2024-03-27'})

const LOCALES = ['ro', 'en', 'bg', 'sr'] as const

type MaybeLocalized = Partial<Record<Locale, string>>
type Locale = (typeof LOCALES)[number]

/** Fill every locale the schema requires, falling back to Romanian. */
function localize(value?: MaybeLocalized): Record<string, string> | undefined {
  if (!value) return undefined
  const output: Record<string, string> = {}
  for (const locale of LOCALES) {
    const text = value[locale] ?? value.ro
    if (text) output[locale] = text
  }
  return Object.keys(output).length > 0 ? output : undefined
}

const orderRank = (index: number) => String(index).padStart(4, '0')

type SeededDoc = {_id: string; _type: string; [key: string]: unknown}

async function main() {
  const documents: SeededDoc[] = []

  categories.forEach((category, categoryIndex) => {
    documents.push({
      _id: `category-${category.id}`,
      _type: 'category',
      title: localize(category.name),
      ...(category.note ? {note: localize(category.note)} : {}),
      orderRank: orderRank(categoryIndex),
    })

    category.items.forEach((item, itemIndex) => {
      documents.push({
        _id: `item-${item.id}`,
        _type: 'menuItem',
        name: localize(item.name),
        ...(item.desc ? {description: localize(item.desc)} : {}),
        ...(typeof item.price === 'number' ? {price: item.price} : {}),
        ...(item.tags?.length ? {tags: item.tags} : {}),
        icon: item.icon,
        category: {_type: 'reference', _ref: `category-${category.id}`},
        orderRank: orderRank(itemIndex),
      })
    })
  })

  const transaction = client.transaction()
  for (const document of documents) transaction.createOrReplace(document)

  const result = await transaction.commit({visibility: 'async'})

  const itemCount = documents.filter((document) => document._type === 'menuItem').length
  console.log(
    `Seeded ${documents.length} documents (${categories.length} categories, ${itemCount} items)` +
      (result?.transactionId ? ` — transaction ${result.transactionId}` : ''),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/**
 * Rewrites every orderRank as a valid LexoRank.
 *
 * The first seed wrote "0000", "0001", … — LexoRank.parse() rejects those, the
 * plugin falls back to LexoRank.min() for every document, and dragging between
 * two rows then fails with "Try to rank between issues with same rank
 * this=0|000000: other=0|000000".
 *
 * Order is preserved: categories in their current order, then each category's
 * items in their current order, continuing one global sequence so no two
 * documents share a rank anywhere in the dataset.
 */
import {LexoRank} from 'lexorank'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-03-27'})

async function main() {
  const categories = await client.fetch<Array<{_id: string}>>(
    `*[_type == "category"] | order(orderRank asc, title.ro asc){_id}`,
  )

  let rank = LexoRank.min()
  const patches: Array<[string, string]> = []

  for (const category of categories) {
    rank = rank.genNext()
    patches.push([category._id, rank.toString()])

    const items = await client.fetch<Array<{_id: string}>>(
      `*[_type == "menuItem" && category._ref == $id] | order(orderRank asc, name.ro asc){_id}`,
      {id: category._id},
    )
    for (const item of items) {
      rank = rank.genNext()
      patches.push([item._id, rank.toString()])
    }
  }

  // Anything without a category still needs a rank so it can be dragged.
  const orphans = await client.fetch<Array<{_id: string}>>(
    `*[_type == "menuItem" && !defined(category._ref)]{_id}`,
  )
  for (const orphan of orphans) {
    rank = rank.genNext()
    patches.push([orphan._id, rank.toString()])
  }

  const transaction = client.transaction()
  for (const [id, value] of patches) {
    transaction.patch(id, (patch) => patch.set({orderRank: value}))
  }
  const result = await transaction.commit({visibility: 'sync'})
  console.log(`rewrote ${patches.length} ranks`, result?.transactionId ?? '')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

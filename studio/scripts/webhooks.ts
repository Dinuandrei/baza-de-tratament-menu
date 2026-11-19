/**
 * Keeps the Sanity webhooks in sync with the code.
 *
 *   cd studio
 *   npx sanity exec scripts/webhooks.ts --with-user-token        # report only
 *   APPLY=1 npx sanity exec scripts/webhooks.ts --with-user-token # create/update
 *   APPLY=1 ROTATE=1 npx sanity exec scripts/webhooks.ts --with-user-token
 *
 * Why this exists: the webhooks live in Sanity's management API, not in this
 * repository, so "is the webhook wired?" was unanswerable from the code and the
 * first one was created by hand with no filter — it fired on every mutation of
 * every document type. This script is the source of truth: it created both
 * hooks, prints the diff, and rotation is one command.
 *
 * Requires a Sanity user token that can read/write webhooks — `--with-user-token`
 * supplies the CLI login. The app's SANITY_WRITE_TOKEN is deliberately not
 * enough (it only has dataset grants), which is why the hooks were invisible.
 *
 * ROTATE=1 generates a new TRANSLATE_WEBHOOK_SECRET, writes it (plus the old one
 * as TRANSLATE_WEBHOOK_SECRET_PREVIOUS) to ../.env.local, and updates both
 * hooks. Deploy the app with BOTH secrets first, then drop the previous one.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'

const PROJECT_ID = 'w6d4ck0i'
const DATASET = 'production'
const SITE = (process.env.SITE_URL ?? 'https://baza-de-tratament.vercel.app').replace(/\/+$/, '')
const APPLY = process.env.APPLY === '1'
const ROTATE = process.env.ROTATE === '1'
const ENV_PATH = '../.env.local'

try {
  process.loadEnvFile(ENV_PATH)
} catch {
  // No local env file (CI) — TRANSLATE_WEBHOOK_SECRET can come from the shell.
}

let secret = process.env.TRANSLATE_WEBHOOK_SECRET?.trim()
if (!secret) throw new Error('TRANSLATE_WEBHOOK_SECRET is missing from ../.env.local')

if (ROTATE) {
  const next = randomBytes(32).toString('base64url')
  const previous = secret
  try {
    const file = readFileSync(ENV_PATH, 'utf8')
    const updated = /^TRANSLATE_WEBHOOK_SECRET=.*$/m.test(file)
      ? file.replace(/^TRANSLATE_WEBHOOK_SECRET=.*$/m, `TRANSLATE_WEBHOOK_SECRET=${next}`)
      : `${file.trimEnd()}\nTRANSLATE_WEBHOOK_SECRET=${next}\n`
    writeFileSync(
      ENV_PATH,
      /^TRANSLATE_WEBHOOK_SECRET_PREVIOUS=.*$/m.test(updated)
        ? updated.replace(
            /^TRANSLATE_WEBHOOK_SECRET_PREVIOUS=.*$/m,
            `TRANSLATE_WEBHOOK_SECRET_PREVIOUS=${previous}`,
          )
        : `${updated.trimEnd()}\nTRANSLATE_WEBHOOK_SECRET_PREVIOUS=${previous}\n`,
    )
  } catch (error) {
    throw new Error(`ROTATE needs ${ENV_PATH} to write the new secret: ${error}`)
  }
  console.log(`Rotated. New secret written to ${ENV_PATH}; previous one kept for the rollout.`)
  console.log('Set BOTH in Vercel, deploy, then delete TRANSLATE_WEBHOOK_SECRET_PREVIOUS there.')
  secret = next
}

/** The webhook bodies this repo expects. Everything else is noise. */
const SPECS = [
  {
    name: 'translate-product-on-publish',
    url: `${SITE}/api/translate-product`,
    filter: '_type == "menuItem" && !(_id in path("drafts.**"))',
    rule: { on: ['create', 'update'] },
  },
  {
    name: 'revalidate-menu-on-publish',
    url: `${SITE}/api/revalidate`,
    filter: '_type in ["menuItem", "category", "siteSettings"] && !(_id in path("drafts.**"))',
    rule: { on: ['create', 'update', 'delete'] },
  },
] as const

const client = getCliClient({ apiVersion: '2024-03-27' })
const token = client.config().token
if (!token) {
  throw new Error(
    'Run with --with-user-token: webhooks live in the management API and need your Sanity user token.',
  )
}

const base = `https://api.sanity.io/v2024-03-27/hooks/projects/${PROJECT_ID}`
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

type Hook = {
  id: string
  name: string
  url: string
  filter?: string | null
  rule?: { on?: string[]; filter?: string | null }
  httpMethod?: string
  apiVersion?: string
  includeDrafts?: boolean
  headers?: Record<string, string>
}

const body = (spec: (typeof SPECS)[number]) => ({
  type: 'document',
  name: spec.name,
  dataset: DATASET,
  url: spec.url,
  // The create API takes the GROQ filter inside `rule`; a top-level `filter` is
  // rejected with “\"filter\" must be of type object”. GET returns it in `rule`.
  rule: { ...spec.rule, filter: spec.filter },
  httpMethod: 'POST',
  apiVersion: 'v2021-10-04',
  includeDrafts: false,
  headers: { 'x-webhook-secret': secret },
})

async function list(): Promise<Hook[]> {
  const response = await fetch(base, { headers })
  if (!response.ok) {
    throw new Error(
      `Cannot list webhooks (${response.status}). Log in with \`npx sanity login\` or use a user token with the webhooks grant.`,
    )
  }
  return (await response.json()) as Hook[]
}

function differences(existing: Hook, desired: ReturnType<typeof body>): string[] {
  const out: string[] = []
  if (existing.url !== desired.url) out.push(`url: ${existing.url} → ${desired.url}`)
  const currentFilter = existing.rule?.filter ?? existing.filter ?? null
  if (currentFilter !== desired.rule.filter) {
    out.push(`filter: ${currentFilter ?? 'null'} → ${desired.rule.filter}`)
  }
  const on = [...(existing.rule?.on ?? [])].sort().join(',')
  const wantOn = [...desired.rule.on].sort().join(',')
  if (on !== wantOn) out.push(`on: [${on}] → [${wantOn}]`)
  if (existing.headers?.['x-webhook-secret'] !== secret) out.push('secret: rotated')
  if (existing.httpMethod !== desired.httpMethod) out.push(`method: ${existing.httpMethod} → ${desired.httpMethod}`)
  if (existing.includeDrafts !== desired.includeDrafts) out.push('includeDrafts differs')
  return out
}

async function main() {
  const existing = await list()
  let changed = 0

  for (const spec of SPECS) {
    const desired = body(spec)
    const current = existing.find((hook) => hook.name === spec.name)

    if (!current) {
      console.log(`✚ ${spec.name} is missing`)
      if (APPLY) {
        const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(desired) })
        if (!response.ok) throw new Error(`create ${spec.name}: ${response.status} ${await response.text()}`)
        console.log(`  created ${spec.name}`)
        changed += 1
      }
      continue
    }

    const diff = differences(current, desired)
    if (diff.length === 0) {
      console.log(`✓ ${spec.name} is up to date`)
      continue
    }

    console.log(`✎ ${spec.name} needs an update:`)
    for (const line of diff) console.log(`   ${line}`)

    if (APPLY) {
      // The management API has no PATCH for hooks: delete, then recreate.
      const removed = await fetch(`${base}/${current.id}`, { method: 'DELETE', headers })
      if (!removed.ok) throw new Error(`delete ${spec.name}: ${removed.status} ${await removed.text()}`)
      const response = await fetch(base, { method: 'POST', headers, body: JSON.stringify(desired) })
      if (!response.ok) throw new Error(`recreate ${spec.name}: ${response.status} ${await response.text()}`)
      console.log(`  recreated ${spec.name}`)
      changed += 1
    }
  }

  if (APPLY && changed === 0) console.log('\nNothing to do.')
  if (!APPLY) console.log('\nDry run — re-run with APPLY=1 to write the changes.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

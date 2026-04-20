import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { parseInsertFile, type LegacyRow } from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

type VideoCastingRecord = {
  broadcaster?: string
  displayOrder: number
  legacyMeta: Record<string, unknown>
  messageHtml?: string
  slug: string
  sourceId: number
  sourceTable: 'g5_casting'
  title: string
  youtubeUrl?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFile(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_casting.sql'),
  )
  const records = ensureUniqueSlugs(
    rows
      .slice()
      .sort((left, right) => toNumber(left.bn_order) - toNumber(right.bn_order))
      .map(mapVideoCastingRow),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertVideoCastings(payload, limitedRecords)

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        total: limitedRecords.length,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): SeedOptions {
  let dryRun = false
  let limit: 'all' | number = 'all'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--limit') {
      const nextArg = String(args[index + 1] ?? '')

      if (nextArg === 'all') {
        limit = 'all'
        index += 1
        continue
      }

      const parsed = Number(nextArg)

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${nextArg}`)
      }

      limit = parsed
      index += 1
    }
  }

  return { dryRun, limit }
}

function mapVideoCastingRow(row: LegacyRow): VideoCastingRecord {
  const sourceId = toNumber(row.bn_id)

  return {
    broadcaster: toNonEmptyString(row.pr_1),
    displayOrder: toNumber(row.bn_order),
    legacyMeta: pickLegacyFields(row),
    messageHtml: toNonEmptyString(row.message),
    slug: `video-casting-${sourceId}`,
    sourceId,
    sourceTable: 'g5_casting',
    title: toNonEmptyString(row.subject) ?? `video-casting-${sourceId}`,
    youtubeUrl: toNonEmptyString(row.youtube),
  }
}

function pickLegacyFields(row: LegacyRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (!String(value ?? '').trim()) {
        return false
      }

      return /^pr_\d+$/.test(key)
    }),
  )
}

function ensureUniqueSlugs<T extends { slug: string }>(records: T[]): T[] {
  const counts = new Map<string, number>()

  return records.map((record) => {
    const seen = counts.get(record.slug) ?? 0
    counts.set(record.slug, seen + 1)

    if (seen === 0) {
      return record
    }

    return {
      ...record,
      slug: `${record.slug}-${seen + 1}`,
    }
  })
}

function buildRecordKey(sourceTable: string, sourceId: number) {
  return `${sourceTable}:${sourceId}`
}

async function upsertVideoCastings(payload: Payload, records: VideoCastingRecord[]) {
  const existing = await payload.find({
    collection: 'video-castings',
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  const existingByKey = new Map(
    existing.docs.map((doc) => [buildRecordKey(doc.sourceTable, doc.sourceId), doc.id]),
  )

  for (const record of records) {
    const existingId = existingByKey.get(buildRecordKey(record.sourceTable, record.sourceId))

    if (existingId) {
      await payload.update({
        collection: 'video-castings',
        data: record,
        id: existingId,
      })
      continue
    }

    await payload.create({
      collection: 'video-castings',
      data: record,
    })
  }
}

function printDryRun(records: VideoCastingRecord[], options: SeedOptions) {
  const broadcasterCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    const key = record.broadcaster ?? '(empty)'
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        broadcasterCounts,
        dryRun: true,
        limit: options.limit,
        sample: records.slice(0, 5),
        total: records.length,
      },
      null,
      2,
    ),
  )
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

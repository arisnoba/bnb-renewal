import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFile,
  type LegacyRow,
} from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type LineupRecord = {
  authorName?: string
  bodyHtml: string
  category?: string
  displayStatus: 'archived' | 'draft' | 'published'
  excerpt: string
  legacyMeta: Record<string, unknown>
  publishedAt?: string
  slug: string
  sourceId: number
  sourceTable: 'g5_write_lineup'
  title: string
  viewCount: number
}

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFile(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_write_lineup.sql'),
  )
  const records = ensureUniqueSlugs(
    rows
      .filter((row) => toNumber(row.wr_is_comment) === 0)
      .sort(compareLegacyDateDesc('wr_datetime'))
      .map(mapLineupRow),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertLineups(payload, limitedRecords)

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

function mapLineupRow(row: LegacyRow): LineupRecord {
  const sourceId = toNumber(row.wr_id)
  const bodyHtml = String(row.wr_content ?? '')

  return {
    authorName: toNonEmptyString(row.wr_name),
    bodyHtml,
    category: toNonEmptyString(row.ca_name),
    displayStatus: 'published',
    excerpt: createExcerpt(bodyHtml),
    legacyMeta: pickLegacyFields(row),
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `lineup-${sourceId}`,
    sourceId,
    sourceTable: 'g5_write_lineup',
    title: toNonEmptyString(row.wr_subject) ?? `lineup-${sourceId}`,
    viewCount: toNumber(row.wr_hit),
  }
}

function pickLegacyFields(row: LegacyRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (!String(value ?? '').trim()) {
        return false
      }

      return (
        /^wr_\d+$/.test(key) ||
        key === 'wr_file' ||
        key === 'wr_hit' ||
        key === 'wr_link1' ||
        key === 'wr_link2' ||
        key === 'wr_option' ||
        key === 'wr_parent'
      )
    }),
  )
}

function compareLegacyDateDesc(field: string) {
  return (left: LegacyRow, right: LegacyRow) => {
    const leftDate = normalizeDateTime(left[field]) ?? ''
    const rightDate = normalizeDateTime(right[field]) ?? ''

    return rightDate.localeCompare(leftDate)
  }
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

async function upsertLineups(payload: Payload, records: LineupRecord[]) {
  const existing = await payload.find({
    collection: 'lineups',
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
        collection: 'lineups',
        data: record,
        id: existingId,
      })
      continue
    }

    await payload.create({
      collection: 'lineups',
      data: record,
    })
  }
}

function printDryRun(records: LineupRecord[], options: SeedOptions) {
  const categoryCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    const key = record.category ?? '(empty)'
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        categoryCounts,
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

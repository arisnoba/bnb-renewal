import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFileWithTables,
  type LegacyRow,
} from '../legacy-sql'
import {
  assertDestructiveC0Allowed,
  resolveProjectPath,
  toNonEmptyString,
  toNumber,
} from './runtime'

type CastingRecord = {
  authorName?: string
  bodyHtml: string
  category?: string
  excerpt: string
  isPublic: boolean
  legacyMeta: Record<string, unknown>
  publishedAt?: string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
}

type SeedOptions = {
  approvedBy?: string
  dryRun: boolean
  limit: 'all' | number
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFileWithTables(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_write_new_casting_all.sql'),
  )
  const records = ensureUniqueSlugs(
    rows
      .filter(({ row }) => toNumber(row.wr_is_comment) === 0)
      .map(({ row, tableName }) => mapCastingRow(row, tableName)),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  if (!options.approvedBy) {
    throw new Error('Castings 교체 실행에는 `--approved-by`가 필요합니다.')
  }

  assertDestructiveC0Allowed()

  const payload = await getPayload({ config })
  const deleted = await deleteExistingCastings(payload)
  await createCastings(payload, limitedRecords)

  console.log(
    JSON.stringify(
      {
        approvedBy: options.approvedBy,
        created: limitedRecords.length,
        deleted,
        dryRun: false,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): SeedOptions {
  let approvedBy: string | undefined
  let dryRun = false
  let limit: 'all' | number = 'all'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--approved-by') {
      approvedBy = toNonEmptyString(args[index + 1])
      index += 1
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

  return { approvedBy, dryRun, limit }
}

function mapCastingRow(row: LegacyRow, sourceTable: string): CastingRecord {
  const sourceId = toNumber(row.wr_id)
  const bodyHtml = String(row.wr_content ?? '')

  return {
    authorName: toNonEmptyString(row.wr_name),
    bodyHtml,
    category: toNonEmptyString(row.ca_name),
    excerpt: createExcerpt(bodyHtml),
    isPublic: String(row.public ?? '').trim().toUpperCase() !== 'N',
    legacyMeta: pickLegacyFields(row),
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `${sourceTable.replace('g5_write_new_', '')}-${sourceId}`,
    sourceId,
    sourceTable,
    title: toNonEmptyString(row.wr_subject) ?? `${sourceTable}-${sourceId}`,
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
        key === 'public' ||
        key === 'wr_hit' ||
        key === 'wr_link1' ||
        key === 'wr_link2' ||
        key === 'wr_option' ||
        key === 'wr_parent'
      )
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

async function deleteExistingCastings(payload: Payload) {
  const existing = await payload.find({
    collection: 'castings',
    depth: 0,
    limit: 5000,
    pagination: false,
  })

  for (const doc of existing.docs) {
    await payload.delete({
      collection: 'castings',
      id: doc.id,
    })
  }

  return existing.docs.length
}

async function createCastings(payload: Payload, records: CastingRecord[]) {
  for (const record of records) {
    await payload.create({
      collection: 'castings',
      data: record,
    })
  }
}

function printDryRun(records: CastingRecord[], options: SeedOptions) {
  const sourceCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.sourceTable] = (accumulator[record.sourceTable] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        approvedBy: options.approvedBy,
        dryRun: true,
        limit: options.limit,
        sample: records.slice(0, 5),
        sourceCounts,
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

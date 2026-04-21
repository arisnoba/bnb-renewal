import type { CollectionSlug, Payload } from 'payload'
import { getPayload } from 'payload'

import payloadConfig from '../../payload.config'
import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFile,
  parseInsertFileWithTables,
  type LegacyRow,
} from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type DisplayStatus = 'archived' | 'draft' | 'published'

type LegacyBoardRecord = {
  authorName?: string
  bodyHtml: string
  category?: string
  displayStatus: DisplayStatus
  excerpt: string
  isPublic: boolean
  legacyMeta: Record<string, unknown>
  publishedAt?: string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
  viewCount: number
} & Record<string, unknown>

type ExistingDoc = {
  id: number | string
  sourceId?: number
  sourceTable?: string
}

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

export type LegacyBoardSeedConfig = {
  collection: CollectionSlug
  fileName: string
  legacyFieldKeys?: string[]
  mapExtra?: (row: LegacyRow, tableName: string) => Record<string, unknown>
  printSummary?: (records: LegacyBoardRecord[]) => Record<string, unknown>
  sampleSize?: number
  slugPrefix: string | ((tableName: string) => string)
  useInsertTables?: boolean
}

export async function seedLegacyBoard(config: LegacyBoardSeedConfig) {
  const options = parseArgs(process.argv.slice(2))
  const rows = await readRows(config)
  const records = ensureUniqueSlugs(
    rows
      .filter(({ row }) => toNumber(row.wr_is_comment) === 0)
      .sort(compareLegacyDateDesc('wr_datetime'))
      .map(({ row, tableName }) => mapBoardRow(row, tableName, config)),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options, config)
    return
  }

  const payload = await getPayload({ config: payloadConfig })
  await upsertRecords(payload, config.collection, limitedRecords)

  console.log(
    JSON.stringify(
      {
        collection: config.collection,
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

async function readRows(config: LegacyBoardSeedConfig) {
  const filePath = resolveProjectPath('data', 'baewoo-curated', 'c0', config.fileName)

  if (config.useInsertTables) {
    return parseInsertFileWithTables(filePath)
  }

  const rows = await parseInsertFile(filePath)
  const tableName = config.fileName.replace(/\.sql$/, '')
  return rows.map((row) => ({ row, tableName }))
}

function mapBoardRow(
  row: LegacyRow,
  sourceTable: string,
  config: LegacyBoardSeedConfig,
): LegacyBoardRecord {
  const sourceId = toNumber(row.wr_id)
  const bodyHtml = String(row.wr_content ?? '')
  const isPublic = String(row.public ?? '').trim().toUpperCase() !== 'N'
  const slugPrefix =
    typeof config.slugPrefix === 'function'
      ? config.slugPrefix(sourceTable)
      : config.slugPrefix

  return {
    authorName: toNonEmptyString(row.wr_name),
    bodyHtml,
    category: toNonEmptyString(row.ca_name),
    displayStatus: isPublic ? 'published' : 'draft',
    excerpt: createExcerpt(bodyHtml),
    isPublic,
    legacyMeta: pickLegacyFields(row, config.legacyFieldKeys),
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `${slugPrefix}-${sourceId}`,
    sourceId,
    sourceTable,
    title: toNonEmptyString(row.wr_subject) ?? `${slugPrefix}-${sourceId}`,
    viewCount: toNumber(row.wr_hit),
    ...(config.mapExtra?.(row, sourceTable) ?? {}),
  }
}

function pickLegacyFields(
  row: LegacyRow,
  additionalKeys: string[] = [],
): Record<string, unknown> {
  const keepKeys = new Set(additionalKeys)

  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (!String(value ?? '').trim()) {
        return false
      }

      return (
        keepKeys.has(key) ||
        key === 'public' ||
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
  return (left: { row: LegacyRow }, right: { row: LegacyRow }) => {
    const leftDate = normalizeDateTime(left.row[field]) ?? ''
    const rightDate = normalizeDateTime(right.row[field]) ?? ''

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

async function upsertRecords(
  payload: Payload,
  collection: CollectionSlug,
  records: LegacyBoardRecord[],
) {
  const existing = await payload.find({
    collection,
    depth: 0,
    limit: 5000,
    pagination: false,
  })
  const existingDocs = existing.docs as ExistingDoc[]
  const existingByKey = new Map(
    existingDocs.map((doc) => [buildRecordKey(String(doc.sourceTable), Number(doc.sourceId)), doc.id]),
  )

  for (const record of records) {
    const existingId = existingByKey.get(buildRecordKey(record.sourceTable, record.sourceId))

    if (existingId) {
      await payload.update({
        collection,
        data: record,
        id: existingId,
      })
      continue
    }

    await payload.create({
      collection,
      data: record,
    })
  }
}

function printDryRun(
  records: LegacyBoardRecord[],
  options: SeedOptions,
  config: LegacyBoardSeedConfig,
) {
  const sourceCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.sourceTable] = (accumulator[record.sourceTable] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        collection: config.collection,
        dryRun: true,
        limit: options.limit,
        sample: records.slice(0, config.sampleSize ?? 5),
        sourceCounts,
        total: records.length,
        ...(config.printSummary?.(records) ?? {}),
      },
      null,
      2,
    ),
  )
}

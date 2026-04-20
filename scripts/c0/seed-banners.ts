import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { normalizeDateTime, parseInsertFile, type LegacyRow } from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type BannerRecord = {
  altText?: string
  beginAt?: string
  device?: string
  displayOrder: number
  endAt?: string
  hasBorder: boolean
  hitCount: number
  label: string
  legacyMeta: Record<string, unknown>
  openInNewWindow: boolean
  position?: string
  recordedAt?: string
  slug: string
  sourceId: number
  sourceTable: 'g5_banner'
  url?: string
}

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFile(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_banner.sql'),
  )
  const records = ensureUniqueSlugs(
    rows
      .slice()
      .sort((left, right) => toNumber(left.bn_order) - toNumber(right.bn_order))
      .map(mapBannerRow),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertBanners(payload, limitedRecords)

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

function mapBannerRow(row: LegacyRow): BannerRecord {
  const sourceId = toNumber(row.bn_id)
  const position = toNonEmptyString(row.bn_position)

  return {
    altText: toNonEmptyString(row.bn_alt),
    beginAt: normalizeDateTime(row.bn_begin_time) ?? undefined,
    device: toNonEmptyString(row.bn_device),
    displayOrder: toNumber(row.bn_order),
    endAt: normalizeDateTime(row.bn_end_time) ?? undefined,
    hasBorder: toNumber(row.bn_border) === 1,
    hitCount: toNumber(row.bn_hit),
    label:
      toNonEmptyString(row.bn_alt) ??
      position ??
      toNonEmptyString(row.bn_url) ??
      `banner-${sourceId}`,
    legacyMeta: pickLegacyFields(row),
    openInNewWindow: toNumber(row.bn_new_win) === 1,
    position,
    recordedAt: normalizeDateTime(row.bn_time) ?? undefined,
    slug: `banner-${sourceId}`,
    sourceId,
    sourceTable: 'g5_banner',
    url: toNonEmptyString(row.bn_url),
  }
}

function pickLegacyFields(row: LegacyRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (!String(value ?? '').trim()) {
        return false
      }

      return key === 'bn_time'
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

async function upsertBanners(payload: Payload, records: BannerRecord[]) {
  const existing = await payload.find({
    collection: 'banners',
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
        collection: 'banners',
        data: record,
        id: existingId,
      })
      continue
    }

    await payload.create({
      collection: 'banners',
      data: record,
    })
  }
}

function printDryRun(records: BannerRecord[], options: SeedOptions) {
  const positionCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    const key = record.position ?? '(empty)'
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        limit: options.limit,
        positionCounts,
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

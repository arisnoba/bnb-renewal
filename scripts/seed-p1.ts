import path from 'node:path'

import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../payload.config'
import {
  createExcerpt,
  normalizeDateTime,
  parseInsertFile,
  type LegacyRow,
} from './legacy-sql'
import { loadLegacyProfileImageUrlMap } from './profile-images'

type SeedOptions = {
  agencyLimit: 'all' | number
  collections: Set<'agencies' | 'castings' | 'profiles'>
  dryRun: boolean
  limit: number
}

type ProfileRecord = {
  authorName?: string
  bodyHtml: string
  category?: string
  excerpt: string
  isPublic: boolean
  legacyMeta: Record<string, unknown>
  name: string
  publishedAt?: string
  profileImagePath?: string
  slug: string
  sourceId: number
  sourceTable: string
}

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

type AgencyRecord = {
  bodyHtml?: string
  displayOrder: number
  legacyMeta: Record<string, unknown>
  name?: string
  profileImagePath?: string
  slug: string
  sourceId: number
  sourceTable: string
  subject: string
  summary?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const projectRoot = process.cwd()
  const p1Dir = path.join(projectRoot, 'data/baewoo-curated/p1')

  const profileRows = await parseInsertFile(path.join(p1Dir, 'g5_write_new_profile.sql'))
  const legacyProfileImageUrlMap = options.collections.has('profiles')
    ? await loadLegacyProfileImageUrlMap(projectRoot)
    : new Map<number, string>()
  const castingRows = (
    await Promise.all(
      [
        'g5_write_new_casting.sql',
        'g5_write_new_casting2.sql',
        'g5_write_new_casting3.sql',
        'g5_write_new_casting_abio.sql',
        'g5_write_new_casting_bx.sql',
      ].map(async (fileName) => ({
        fileName,
        rows: await parseInsertFile(path.join(p1Dir, fileName)),
      })),
    )
  ).flatMap(({ fileName, rows }) =>
    rows.map((row) => ({
      row,
      sourceTable: fileName.replace('.sql', ''),
    })),
  )
  const agencyRows = await parseInsertFile(path.join(p1Dir, 'g5_agency.sql'))

  const profiles = options.collections.has('profiles')
    ? ensureUniqueSlugs(
        profileRows
          .filter((row) => Number(row.wr_is_comment ?? 0) === 0)
          .sort(compareLegacyDateDesc('wr_datetime'))
          .slice(0, options.limit)
          .map((row) => mapProfileRow(row, legacyProfileImageUrlMap)),
      )
    : []

  const castings = options.collections.has('castings')
    ? ensureUniqueSlugs(
        castingRows
          .filter(({ row }) => Number(row.wr_is_comment ?? 0) === 0)
          .sort((left, right) => {
            const leftDate = normalizeDateTime(left.row.wr_datetime) ?? ''
            const rightDate = normalizeDateTime(right.row.wr_datetime) ?? ''

            return rightDate.localeCompare(leftDate)
          })
          .slice(0, options.limit)
          .map(({ row, sourceTable }) => mapCastingRow(row, sourceTable)),
      )
    : []

  const agencies = options.collections.has('agencies')
    ? ensureUniqueSlugs(
        agencyRows
          .slice()
          .sort((left, right) => Number(right.bn_id ?? 0) - Number(left.bn_id ?? 0))
          .slice(0, options.agencyLimit === 'all' ? agencyRows.length : options.agencyLimit)
          .map(mapAgencyRow),
      )
    : []

  if (options.dryRun) {
    printDryRun({ agencies, castings, options, profiles })
    return
  }

  const payload = await getPayload({ config })

  if (profiles.length > 0) {
    await upsertProfiles(payload, profiles)
  }

  if (castings.length > 0) {
    await upsertCastings(payload, castings)
  }

  if (agencies.length > 0) {
    await upsertAgencies(payload, agencies)
  }

  console.log(
    JSON.stringify(
      {
        agencies: agencies.length,
        agencyLimit: options.agencyLimit,
        castings: castings.length,
        collections: [...options.collections],
        dryRun: false,
        limitPerCollection: options.limit,
        profiles: profiles.length,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): SeedOptions {
  const collections = new Set<'agencies' | 'castings' | 'profiles'>([
    'profiles',
    'castings',
    'agencies',
  ])
  let agencyLimit: 'all' | number = 10
  let dryRun = false
  let limit = 10
  let hasExplicitAgencyLimit = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--limit') {
      const next = Number(args[index + 1])

      if (!Number.isFinite(next) || next <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${args[index + 1]}`)
      }

      limit = next
      if (!hasExplicitAgencyLimit) {
        agencyLimit = next
      }
      index += 1
      continue
    }

    if (arg === '--agency-limit') {
      const nextArg = args[index + 1]

      if (nextArg === 'all') {
        hasExplicitAgencyLimit = true
        agencyLimit = 'all'
        index += 1
        continue
      }

      const next = Number(nextArg)

      if (!Number.isFinite(next) || next <= 0) {
        throw new Error(`잘못된 --agency-limit 값입니다: ${nextArg}`)
      }

      hasExplicitAgencyLimit = true
      agencyLimit = next
      index += 1
      continue
    }

    if (arg === '--only') {
      const nextArg = args[index + 1]
      const requestedCollections = new Set<'agencies' | 'castings' | 'profiles'>()

      for (const value of String(nextArg ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)) {
        if (value !== 'agencies' && value !== 'castings' && value !== 'profiles') {
          throw new Error(`잘못된 --only 값입니다: ${value}`)
        }

        requestedCollections.add(value)
      }

      if (requestedCollections.size === 0) {
        throw new Error('`--only`에는 최소 1개 컬렉션이 필요합니다.')
      }

      collections.clear()
      for (const collection of requestedCollections) {
        collections.add(collection)
      }

      index += 1
    }
  }

  return { agencyLimit, collections, dryRun, limit }
}

function mapProfileRow(
  row: LegacyRow,
  legacyProfileImageUrlMap: Map<number, string>,
): ProfileRecord {
  const sourceId = Number(row.wr_id ?? 0)
  const bodyHtml = String(row.wr_content ?? '')

  return {
    authorName: String(row.wr_name ?? '').trim() || undefined,
    bodyHtml,
    category: String(row.ca_name ?? '').trim() || undefined,
    excerpt: createExcerpt(bodyHtml),
    isPublic: String(row.public ?? '').trim().toUpperCase() !== 'N',
    legacyMeta: pickLegacyFields(row),
    name: String(row.wr_subject ?? '').trim() || `profile-${sourceId}`,
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    profileImagePath: legacyProfileImageUrlMap.get(sourceId),
    slug: `profile-${sourceId}`,
    sourceId,
    sourceTable: 'g5_write_new_profile',
  }
}

function mapCastingRow(row: LegacyRow, sourceTable: string): CastingRecord {
  const sourceId = Number(row.wr_id ?? 0)
  const bodyHtml = String(row.wr_content ?? '')

  return {
    authorName: String(row.wr_name ?? '').trim() || undefined,
    bodyHtml,
    category: String(row.ca_name ?? '').trim() || undefined,
    excerpt: createExcerpt(bodyHtml),
    isPublic: String(row.public ?? '').trim().toUpperCase() !== 'N',
    legacyMeta: pickLegacyFields(row),
    publishedAt: normalizeDateTime(row.wr_datetime) ?? undefined,
    slug: `${sourceTable.replace('g5_write_new_', '')}-${sourceId}`,
    sourceId,
    sourceTable,
    title: String(row.wr_subject ?? '').trim() || `${sourceTable}-${sourceId}`,
  }
}

function mapAgencyRow(row: LegacyRow): AgencyRecord {
  const sourceId = Number(row.bn_id ?? 0)

  return {
    bodyHtml: String(row.message ?? '').trim() || undefined,
    displayOrder: Number(row.bn_order ?? 0),
    legacyMeta: pickLegacyFields(row),
    name: String(row.name ?? '').trim() || undefined,
    profileImagePath: String(row.bn_bimg ?? '').trim() || undefined,
    slug: `agency-${sourceId}`,
    sourceId,
    sourceTable: 'g5_agency',
    subject: String(row.subject ?? '').trim() || `agency-${sourceId}`,
    summary: String(row.summary ?? '').trim() || undefined,
  }
}

function pickLegacyFields(row: LegacyRow): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => {
      if (!String(value ?? '').trim()) {
        return false
      }

      return /^wr_\d+$/.test(key) || /^pr_\d+$/.test(key) || key === 'piece'
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
    const index = counts.get(record.slug) ?? 0

    counts.set(record.slug, index + 1)

    if (index === 0) {
      return record
    }

    return {
      ...record,
      slug: `${record.slug}-${index + 1}`,
    }
  })
}

async function upsertProfiles(payload: Payload, records: ProfileRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'profiles',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: record.sourceTable,
            },
          },
          {
            sourceId: {
              equals: record.sourceId,
            },
          },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'profiles',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'profiles',
      data: record,
    })
  }
}

async function upsertCastings(payload: Payload, records: CastingRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'castings',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            sourceTable: {
              equals: record.sourceTable,
            },
          },
          {
            sourceId: {
              equals: record.sourceId,
            },
          },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'castings',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'castings',
      data: record,
    })
  }
}

async function upsertAgencies(payload: Payload, records: AgencyRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'agencies',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        sourceId: {
          equals: record.sourceId,
        },
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'agencies',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'agencies',
      data: record,
    })
  }
}

function printDryRun({
  agencies,
  castings,
  options,
  profiles,
}: {
  agencies: AgencyRecord[]
  castings: CastingRecord[]
  options: SeedOptions
  profiles: ProfileRecord[]
}) {
  console.log(
    JSON.stringify(
      {
        agencies,
        agencyLimit: options.agencyLimit,
        castings,
        collections: [...options.collections],
        dryRun: true,
        limitPerCollection: options.limit,
        profiles,
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

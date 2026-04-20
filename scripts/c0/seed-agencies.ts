import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { parseInsertFile, type LegacyRow } from './parse'
import {
  resolveProjectPath,
  toNonEmptyString,
  toNumber,
} from './runtime'

type AgencyActor = {
  generation?: string
  name: string
  profileImagePath?: string
}

type AgencyRecord = {
  actors: AgencyActor[]
  bodyHtml?: string
  displayOrder: number
  legacyMeta: Record<string, unknown>
  name?: string
  profileImagePath?: string
  slug: string
  sourceId: number
  sourceTable: 'g5_agency'
  subject: string
  summary?: string
}

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFile(resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_agency.sql'))
  const records = rows.map(mapAgencyRow)
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertAgencies(payload, limitedRecords)

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

function mapAgencyRow(row: LegacyRow): AgencyRecord {
  const sourceId = toNumber(row.bn_id)
  const profileImagePaths = collectLegacySlots(row, 'pr_', 9)
  const galleryImages = collectTextFields(row, 'it_img', 8)
  const actors = collectActors(row, profileImagePaths)
  const messageActors =
    actors.length > 0
      ? actors
      : collectActorsFromMessage(toNonEmptyString(row.message), profileImagePaths)

  return {
    actors: messageActors,
    bodyHtml: toNonEmptyString(row.message),
    displayOrder: toNumber(row.bn_order),
    legacyMeta: {
      galleryImages,
      piece: toNonEmptyString(row.piece),
      profileImagePaths,
    },
    name: toNonEmptyString(row.name),
    profileImagePath: toNonEmptyString(row.bn_bimg),
    slug: `agency-${sourceId}`,
    sourceId,
    sourceTable: 'g5_agency',
    subject: toNonEmptyString(row.subject) ?? `agency-${sourceId}`,
    summary: toNonEmptyString(row.summary),
  }
}

function collectActors(row: LegacyRow, profileImagePaths: Array<null | string>): AgencyActor[] {
  const actors: AgencyActor[] = []

  for (let index = 1; index <= 43; index += 2) {
    const name = toNonEmptyString(row[`wr_${index}`])
    const generation = toNonEmptyString(row[`wr_${index + 1}`])

    if (!name && !generation) {
      continue
    }

    if (looksLikeImagePath(name) || looksLikeImagePath(generation)) {
      break
    }

    if (!name) {
      continue
    }

    actors.push({
      generation,
      name,
      profileImagePath: profileImagePaths[actors.length] ?? undefined,
    })
  }

  return actors
}

function collectActorsFromMessage(
  bodyHtml: string | undefined,
  profileImagePaths: Array<null | string>,
): AgencyActor[] {
  if (!bodyHtml) {
    return []
  }

  const actors: AgencyActor[] = []
  const pattern =
    /<div class="agency_profile">[\s\S]*?<img src="([^"]*)"[\s\S]*?<p class="profile_txt">([^<]*)<br>[\s\S]*?<span class="profile_txt02">([^<]*)<\/span>/g

  for (const match of bodyHtml.matchAll(pattern)) {
    const imagePath = toNonEmptyString(match[1])
    const name = toNonEmptyString(stripHtml(match[2]))
    const generation = toNonEmptyString(stripHtml(match[3]))

    if (!name) {
      continue
    }

    actors.push({
      generation,
      name,
      profileImagePath: imagePath ?? profileImagePaths[actors.length] ?? undefined,
    })
  }

  return actors
}

function collectTextFields(row: LegacyRow, prefix: string, max: number): string[] {
  return Array.from({ length: max }, (_, offset) => toNonEmptyString(row[`${prefix}${offset + 1}`]))
    .filter((value): value is string => Boolean(value))
}

function collectLegacySlots(row: LegacyRow, prefix: string, max: number): Array<null | string> {
  return Array.from({ length: max }, (_, offset) => toNonEmptyString(row[`${prefix}${offset + 1}`]) ?? null)
}

function looksLikeImagePath(value: string | undefined) {
  if (!value) {
    return false
  }

  return /\.(gif|jpe?g|png|svg|webp)$/i.test(value) || value.includes('/img/')
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim()
}

async function upsertAgencies(payload: Payload, records: AgencyRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'agencies',
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

function printDryRun(records: AgencyRecord[], options: SeedOptions) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        limit: options.limit,
        sample: records.slice(0, 3),
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

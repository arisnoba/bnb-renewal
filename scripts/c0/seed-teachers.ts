import path from 'node:path'

import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { parseInsertFile, type LegacyRow } from './parse'
import {
  resolveProjectPath,
  toNonEmptyString,
  toNumber,
} from './runtime'

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
  only: Set<'g5_teacher' | 'g5_teacher2'>
}

type TeacherRecord = {
  bioHtml: string
  center: 'unknown'
  displayOrder: number
  gallery: TeacherGalleryItem[]
  legacyMeta: Record<string, unknown>
  name: string
  photoImage1?: string
  photoImage2?: string
  photoImage3?: string
  photoImage4?: string
  photoImage5?: string
  photoImage6?: string
  profileImagePath?: string
  role?: string
  slug: string
  sourceId: number
  sourceTable: string
  status: 'published'
  summary?: string
}

type TeacherGalleryItem = {
  description?: string
  path: string
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const dataDir = resolveProjectPath('data', 'baewoo-curated', 'c0')
  const inputTables: Array<'g5_teacher' | 'g5_teacher2'> = ['g5_teacher', 'g5_teacher2']
  const rows = (
    await Promise.all(
      inputTables
        .filter((tableName): tableName is 'g5_teacher' | 'g5_teacher2' => options.only.has(tableName))
        .map(async (tableName) => ({
          rows: await parseInsertFile(path.join(dataDir, `${tableName}.sql`)),
          tableName,
        })),
    )
  ).flatMap(({ rows, tableName }) =>
    rows.map((row) => mapTeacherRow(row, tableName)),
  )

  const records =
    options.limit === 'all' ? rows : rows.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(records, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertTeachers(payload, records)

  console.log(
    JSON.stringify(
      {
        dryRun: false,
        total: records.length,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): SeedOptions {
  let dryRun = false
  let limit: 'all' | number = 'all'
  const only = new Set<'g5_teacher' | 'g5_teacher2'>(['g5_teacher', 'g5_teacher2'])

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
      continue
    }

    if (arg === '--only') {
      const requested = new Set<'g5_teacher' | 'g5_teacher2'>()

      for (const rawValue of String(args[index + 1] ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)) {
        const value =
          rawValue === 'teacher'
            ? 'g5_teacher'
            : rawValue === 'teacher2'
              ? 'g5_teacher2'
              : rawValue

        if (value !== 'g5_teacher' && value !== 'g5_teacher2') {
          throw new Error(`잘못된 --only 값입니다: ${rawValue}`)
        }

        requested.add(value)
      }

      if (requested.size === 0) {
        throw new Error('`--only`에는 최소 1개 입력 테이블이 필요합니다.')
      }

      only.clear()
      for (const value of requested) {
        only.add(value)
      }

      index += 1
    }
  }

  return { dryRun, limit, only }
}

function mapTeacherRow(row: LegacyRow, sourceTable: 'g5_teacher' | 'g5_teacher2'): TeacherRecord {
  const sourceId = toNumber(row.bn_id)
  const prPaths = collectLegacySlots(row, 'pr_', 9)

  return {
    bioHtml: buildTeacherBioHtml(row),
    center: 'unknown',
    displayOrder: toNumber(row.bn_order),
    gallery: collectGallery(row),
    legacyMeta: {
      itImgSort: toNonEmptyString(row.it_img_sort),
      piece: toNonEmptyString(row.piece),
      prPaths,
    },
    name: toNonEmptyString(row.name) ?? buildTeacherSlug(sourceId, sourceTable),
    photoImage1: toNonEmptyString(row.photo_img1),
    photoImage2: toNonEmptyString(row.photo_img2),
    photoImage3: toNonEmptyString(row.photo_img3),
    photoImage4: toNonEmptyString(row.photo_img4),
    photoImage5: toNonEmptyString(row.photo_img5),
    photoImage6: toNonEmptyString(row.photo_img6),
    profileImagePath: toNonEmptyString(row.bn_bimg),
    role: toNonEmptyString(row.subject),
    slug: buildTeacherSlug(sourceId, sourceTable),
    sourceId,
    sourceTable,
    status: 'published',
    summary: toNonEmptyString(row.summary),
  }
}

function buildTeacherBioHtml(row: LegacyRow) {
  const bioHtml = toNonEmptyString(row.message)

  if (bioHtml) {
    return bioHtml
  }

  const summary = toNonEmptyString(row.summary)

  if (summary) {
    return `<p>${escapeHtml(summary)}</p>`
  }

  return '<p>&nbsp;</p>'
}

function collectGallery(row: LegacyRow): TeacherGalleryItem[] {
  const gallery: TeacherGalleryItem[] = []

  for (let offset = 0; offset < 8; offset += 1) {
    const index = offset + 1
    const path = toNonEmptyString(row[`it_img${index}`])

    if (!path) {
      continue
    }

    gallery.push({
      description: toNonEmptyString(row[`it_img_desc${index}`]),
      path,
      title: toNonEmptyString(row[`it_img_title${index}`]),
    })
  }

  return gallery
}

function collectLegacySlots(row: LegacyRow, prefix: string, max: number): Array<null | string> {
  return Array.from({ length: max }, (_, offset) => toNonEmptyString(row[`${prefix}${offset + 1}`]) ?? null)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildTeacherSlug(sourceId: number, sourceTable: string) {
  if (sourceTable === 'g5_teacher') {
    return `teacher-${sourceId}`
  }

  return `teacher-${sourceId}-${sourceTable.replace(/^g5_/, '').replaceAll('_', '-')}`
}

async function upsertTeachers(payload: Payload, records: TeacherRecord[]) {
  for (const record of records) {
    const existing = await payload.find({
      collection: 'teachers',
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
        collection: 'teachers',
        data: record,
        id: existing.docs[0].id,
      })
      continue
    }

    await payload.create({
      collection: 'teachers',
      data: record,
    })
  }
}

function printDryRun(records: TeacherRecord[], options: SeedOptions) {
  const bySourceTable = records.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.sourceTable] = (accumulator[record.sourceTable] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        bySourceTable,
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

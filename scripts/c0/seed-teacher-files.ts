import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../../payload.config'
import { parseInsertFile, type LegacyRow } from '../legacy-sql'
import { resolveProjectPath, toNonEmptyString, toNumber } from './runtime'

type SeedOptions = {
  dryRun: boolean
  limit: 'all' | number
}

type TeacherFileRecord = {
  descriptionHtml?: string
  displayOrder: number
  filePath?: string
  legacyMeta: Record<string, unknown>
  slug: string
  sourceId: number
  sourceTable: 'g5_teacher_file'
  teacherSourceId?: number
  title: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rows = await parseInsertFile(
    resolveProjectPath('data', 'baewoo-curated', 'c0', 'g5_teacher_file.sql'),
  )
  const records = ensureUniqueSlugs(
    rows
      .slice()
      .sort((left, right) => {
        const teacherDiff = toNumber(left.bn_id) - toNumber(right.bn_id)

        if (teacherDiff !== 0) {
          return teacherDiff
        }

        return toNumber(left.wr_sort) - toNumber(right.wr_sort)
      })
      .map(mapTeacherFileRow),
  )
  const limitedRecords =
    options.limit === 'all' ? records : records.slice(0, options.limit)

  if (options.dryRun) {
    printDryRun(limitedRecords, options)
    return
  }

  const payload = await getPayload({ config })
  await upsertTeacherFiles(payload, limitedRecords)

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

function mapTeacherFileRow(row: LegacyRow): TeacherFileRecord {
  const sourceId = toNumber(row.wr_id)
  const filePath = toNonEmptyString(row.wr_file)
  const teacherSourceId = toNumber(row.bn_id)

  return {
    descriptionHtml: toNonEmptyString(row.wr_desc),
    displayOrder: toNumber(row.wr_sort),
    filePath,
    legacyMeta: pickLegacyFields(),
    slug: `teacher-file-${sourceId}`,
    sourceId,
    sourceTable: 'g5_teacher_file',
    teacherSourceId: teacherSourceId > 0 ? teacherSourceId : undefined,
    title:
      toNonEmptyString(row.wr_subject) ??
      filePath ??
      `teacher-file-${sourceId}`,
  }
}

function pickLegacyFields(): Record<string, unknown> {
  return {}
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

async function upsertTeacherFiles(payload: Payload, records: TeacherFileRecord[]) {
  const existing = await payload.find({
    collection: 'teacher-files',
    depth: 0,
    limit: 2000,
    pagination: false,
  })
  const existingByKey = new Map(
    existing.docs.map((doc) => [buildRecordKey(doc.sourceTable, doc.sourceId), doc.id]),
  )

  for (const record of records) {
    const existingId = existingByKey.get(buildRecordKey(record.sourceTable, record.sourceId))

    if (existingId) {
      await payload.update({
        collection: 'teacher-files',
        data: record,
        id: existingId,
      })
      continue
    }

    await payload.create({
      collection: 'teacher-files',
      data: record,
    })
  }
}

function printDryRun(records: TeacherFileRecord[], options: SeedOptions) {
  const teacherCounts = records.reduce<Record<string, number>>((accumulator, record) => {
    const key = String(record.teacherSourceId ?? 0)
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        limit: options.limit,
        sample: records.slice(0, 5),
        teacherCounts,
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

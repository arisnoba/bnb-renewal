import fs from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'

import { uploadR2Object } from '../../src/lib/r2'
import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  outputPath: string
  write: boolean
}

type TeacherMediaRow = {
  filename: string
  media_id: number
  prefix: string | null
  teacher_id: number
  teacher_name: string | null
}

type EntryResult = {
  action: 'dry-run' | 'failed' | 'skipped-already-r2' | 'uploaded'
  currentPrefix: string | null
  error?: string
  filename: string
  localPath: string
  mediaId: number
  objectKey?: string
  targetPrefix: string
  teacherId: number
  teacherName?: string
}

const ROLE_PREFIX = 'media/teachers/profile-images'

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  const results: EntryResult[] = []

  try {
    const rows = await readTeacherMediaRows(pool, options)

    for (const row of rows) {
      results.push(await processRow({ options, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      objectKeySamples: results
        .filter((r) => r.objectKey)
        .map((r) => r.objectKey)
        .slice(0, 5),
      options,
      totals: buildTotals(results),
      write: options.write,
      rows: results,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          objectKeySamples: output.objectKeySamples,
          outputPath: options.outputPath,
          totals: output.totals,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/teacher-profile-image-r2-upload-report.json'
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--ids') {
      ids = readRequiredValue(args, index, '--ids')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--limit') {
      const value = readRequiredValue(args, index, '--limit')

      if (value === 'all') {
        limit = 'all'
      } else {
        const parsed = Number(value)

        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`잘못된 --limit 값입니다: ${value}`)
        }

        limit = parsed
      }

      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, limit, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readTeacherMediaRows(pool: Pool, options: Options): Promise<TeacherMediaRow[]> {
  const params: unknown[] = []
  const where: string[] = ['t.profile_image_media_id IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`t.id::text = ANY($${params.length}::text[])`)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`

  const result = await pool.query<TeacherMediaRow>(
    `
      SELECT
        t.id AS teacher_id,
        t.name AS teacher_name,
        m.id AS media_id,
        m.filename,
        m.prefix
      FROM teachers t
      JOIN media m ON m.id = t.profile_image_media_id
      ${whereSql}
      ORDER BY t.id ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

async function processRow({
  options,
  pool,
  row,
}: {
  options: Options
  pool: Pool
  row: TeacherMediaRow
}): Promise<EntryResult> {
  const targetPrefix = `${ROLE_PREFIX}/${row.teacher_id}`
  const objectKey = `${targetPrefix}/${row.filename}`
  const localPath = `public/media/${row.filename}`

  const base: EntryResult = {
    action: 'dry-run',
    currentPrefix: row.prefix,
    filename: row.filename,
    localPath,
    mediaId: row.media_id,
    objectKey,
    targetPrefix,
    teacherId: row.teacher_id,
    teacherName: text(row.teacher_name),
  }

  if (row.prefix === targetPrefix) {
    return { ...base, action: 'skipped-already-r2' }
  }

  const absoluteLocalPath = resolveProjectPath(localPath)
  const exists = await fileExists(absoluteLocalPath)

  if (!exists) {
    return { ...base, action: 'failed', error: `로컬 파일 없음: ${localPath}` }
  }

  if (options.dryRun) {
    return base
  }

  try {
    const buffer = await fs.readFile(absoluteLocalPath)
    const contentType = contentTypeFromPath(row.filename)

    await uploadR2Object({
      body: buffer,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType,
      key: objectKey,
    })

    await pool.query(
      `UPDATE media SET prefix = $1, updated_at = NOW() WHERE id = $2`,
      [targetPrefix, row.media_id],
    )

    return { ...base, action: 'uploaded' }
  } catch (error) {
    return {
      ...base,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

function contentTypeFromPath(filename: string) {
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.avif') return 'image/avif'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'

  return 'application/octet-stream'
}

function buildTotals(results: EntryResult[]) {
  return {
    dryRun: count(results, 'dry-run'),
    failed: count(results, 'failed'),
    rows: results.length,
    skippedAlreadyR2: count(results, 'skipped-already-r2'),
    uploaded: count(results, 'uploaded'),
  }
}

function count(results: EntryResult[], action: EntryResult['action']) {
  return results.filter((r) => r.action === action).length
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

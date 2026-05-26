import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { Pool } from 'pg'

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
  overwrite: boolean
  write: boolean
}

type TeacherRow = {
  id: number
  name: string | null
  profile_image_media_id: number | null
  profile_image_path: string | null
}

type SchemaState = {
  hasProfileImageMediaId: boolean
  hasProfileImagePath: boolean
  hasWritableFields: boolean
}

type MatchedProfileImage = {
  fileName: string
  legacyPath: string
  localPath: string
  mediaFileName: string
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'unresolved-local-file'
    | 'unresolved-profile-image'
  existingProfileImageMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaFileName?: string
  mediaId?: number
  name?: string
  teacherId: number
}

type DynamicPayload = {
  create: (args: {
    collection: 'media'
    data: Record<string, unknown>
    filePath: string
    overrideAccess: boolean
  }) => Promise<{ id: number | string }>
  destroy: () => Promise<void>
}

const MEDIA_PREFIX = 'media/teachers/profile-images'

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

  const schema = await readSchemaState(pool)

  if (options.write && !schema.hasWritableFields) {
    throw new Error('teachers.profile_image_media_id 컬럼이 필요합니다. 먼저 마이그레이션을 적용하세요.')
  }

  const payload = options.write ? await getPayloadForWrite() : undefined
  const results: RowResult[] = []

  try {
    const rows = await readTeacherRows(pool, options, schema)

    for (const row of rows) {
      results.push(await processRow({ options, payload, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      schema,
      totals: buildTotals(results),
      write: options.write,
      rows: results,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          schema,
          totals: output.totals,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
    await payload?.destroy()
  }
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/teacher-profile-image-media-link-report.json'
  let overwrite = false
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
        .map((value) => value.trim())
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

    if (arg === '--overwrite') {
      overwrite = true
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, limit, outputPath, overwrite, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readSchemaState(pool: Pool): Promise<SchemaState> {
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'teachers'
        AND column_name IN ('profile_image_media_id', 'profile_image_path')
    `,
  )
  const columns = new Set(result.rows.map((row) => row.column_name))

  return {
    hasProfileImageMediaId: columns.has('profile_image_media_id'),
    hasProfileImagePath: columns.has('profile_image_path'),
    hasWritableFields: columns.has('profile_image_media_id') && columns.has('profile_image_path'),
  }
}

async function readTeacherRows(
  pool: Pool,
  options: Options,
  schema: SchemaState,
): Promise<TeacherRow[]> {
  const params: unknown[] = []
  const where: string[] = []

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite && schema.hasProfileImageMediaId) {
    where.push('profile_image_media_id IS NULL')
  }

  const profileImageMediaSelect = schema.hasProfileImageMediaId
    ? 'profile_image_media_id'
    : 'NULL::integer AS profile_image_media_id'
  const profileImagePathSelect = schema.hasProfileImagePath
    ? 'profile_image_path'
    : 'NULL::varchar AS profile_image_path'
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`

  const result = await pool.query<TeacherRow>(
    `
      SELECT
        id,
        name,
        ${profileImageMediaSelect},
        ${profileImagePathSelect}
      FROM teachers
      ${whereSql}
      ORDER BY id ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

async function processRow({
  options,
  payload,
  pool,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: TeacherRow
}): Promise<RowResult> {
  const base = {
    existingProfileImageMediaId: row.profile_image_media_id,
    name: text(row.name),
    teacherId: row.id,
  }

  if (!options.overwrite && row.profile_image_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.profile_image_media_id,
    }
  }

  const matched = matchProfileImage(row)

  if (!matched) {
    return {
      ...base,
      action: 'unresolved-profile-image',
    }
  }

  const exists = await localFileExists(matched.localPath)

  if (!exists) {
    return {
      ...base,
      action: 'unresolved-local-file',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaFileName: matched.mediaFileName,
    }
  }

  const existingMediaId = await findExistingMediaId(pool, matched.mediaFileName)

  if (options.dryRun) {
    return {
      ...base,
      action: 'dry-run',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaFileName: matched.mediaFileName,
      mediaId: existingMediaId,
    }
  }

  if (!payload) {
    throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
  }

  const mediaId =
    existingMediaId ??
    (await createMediaFromLocalFile({
      matched,
      payload,
      title: text(row.name),
    }))

  await linkTeacherToMedia({ mediaId, pool, row })

  return {
    ...base,
    action: existingMediaId ? 'linked-existing-media' : 'created-media-and-linked',
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaFileName: matched.mediaFileName,
    mediaId,
  }
}

function matchProfileImage(row: TeacherRow): MatchedProfileImage | undefined {
  const localPath = normalizeLocalPath(row.profile_image_path)

  if (!localPath) {
    return undefined
  }

  const fileName = path.basename(localPath)
  const extension = path.extname(fileName).toLowerCase() || '.bin'
  const mediaFileName = `teacher-profile-image-${row.id}${extension}`

  return {
    fileName,
    legacyPath: localPath.replace(/^public/, ''),
    localPath,
    mediaFileName,
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1',
    [fileName],
  )

  return result.rows[0]?.id
}

async function createMediaFromLocalFile({
  matched,
  payload,
  title,
}: {
  matched: MatchedProfileImage
  payload: DynamicPayload
  title?: string
}) {
  const tempPath = await copyToTempMediaFile(matched)
  let id: number | undefined

  try {
    const created = await payload.create({
      collection: 'media',
      data: {
        alt: title ?? matched.mediaFileName,
        prefix: MEDIA_PREFIX,
      },
      filePath: tempPath,
      overrideAccess: true,
    })
    id = Number(created.id)

    if (!Number.isFinite(id)) {
      throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
    }
  } finally {
    await fs.rm(path.dirname(tempPath), { force: true, recursive: true })
  }

  if (id === undefined) {
    throw new Error('media 생성 후 id를 확인할 수 없습니다.')
  }

  return id
}

async function copyToTempMediaFile(matched: MatchedProfileImage) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'teacher-media-'))
  const tempPath = path.join(tempDir, matched.mediaFileName)
  await fs.copyFile(resolveProjectPath(matched.localPath), tempPath)
  return tempPath
}

async function linkTeacherToMedia({
  mediaId,
  pool,
  row,
}: {
  mediaId: number
  pool: Pool
  row: TeacherRow
}) {
  await pool.query(
    `
      UPDATE teachers
      SET
        profile_image_media_id = $1,
        updated_at = NOW()
      WHERE id = $2
    `,
    [mediaId, row.id],
  )
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

async function localFileExists(localPath: string) {
  try {
    const stat = await fs.stat(resolveProjectPath(localPath))
    return stat.isFile()
  } catch {
    return false
  }
}

function normalizeLocalPath(value: string | undefined | null) {
  const textValue = text(value)

  if (!textValue) {
    return undefined
  }

  if (textValue.startsWith('public/')) {
    return textValue
  }

  if (textValue.startsWith('/legacy/')) {
    return `public${textValue}`
  }

  if (textValue.startsWith('/uploads/')) {
    return `public${textValue}`
  }

  return textValue.replace(/^\/+/, '')
}

function buildTotals(results: RowResult[]) {
  return {
    createdMediaAndLinked: count(results, 'created-media-and-linked'),
    dryRun: count(results, 'dry-run'),
    linkedExistingMedia: count(results, 'linked-existing-media'),
    rows: results.length,
    skippedExisting: count(results, 'skipped-existing'),
    unresolvedLocalFile: count(results, 'unresolved-local-file'),
    unresolvedProfileImage: count(results, 'unresolved-profile-image'),
  }
}

function count(results: RowResult[], action: RowResult['action']) {
  return results.filter((result) => result.action === action).length
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

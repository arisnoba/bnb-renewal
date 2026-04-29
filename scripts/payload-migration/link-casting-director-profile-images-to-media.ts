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

type CastingDirectorRow = {
  company: string | null
  id: number
  legacy_meta: unknown
  person_name: string | null
  profile_image_media_id: number | null
  profile_image_path: string | null
  source_db: string | null
  source_id: number | null
  source_table: string | null
}

type SchemaState = {
  hasProfileImageMediaId: boolean
  hasProfileImagePath: boolean
  hasWritableProfileImageFields: boolean
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
  castingDirectorId: number
  existingProfileImageMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaFileName?: string
  mediaId?: number
  personName?: string
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

  if (options.write && !schema.hasWritableProfileImageFields) {
    throw new Error('casting_directors.profile_image_media_id, profile_image_path 컬럼이 필요합니다.')
  }

  const payload = options.write ? await getPayloadForWrite() : undefined
  const results: RowResult[] = []

  try {
    const rows = await readCastingDirectorRows(pool, options, schema)

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
  let outputPath = 'tmp/legacy-assets/casting-director-profile-media-link-report.json'
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
        AND table_name = 'casting_directors'
        AND column_name IN ('profile_image_media_id', 'profile_image_path')
    `,
  )
  const columns = new Set(result.rows.map((row) => row.column_name))

  return {
    hasProfileImageMediaId: columns.has('profile_image_media_id'),
    hasProfileImagePath: columns.has('profile_image_path'),
    hasWritableProfileImageFields: columns.has('profile_image_media_id') && columns.has('profile_image_path'),
  }
}

async function readCastingDirectorRows(
  pool: Pool,
  options: Options,
  schema: SchemaState,
): Promise<CastingDirectorRow[]> {
  const params: unknown[] = []
  const where: string[] = []

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const profileImageMediaSelect = schema.hasProfileImageMediaId
    ? 'profile_image_media_id'
    : 'NULL::integer AS profile_image_media_id'
  const profileImagePathSelect = schema.hasProfileImagePath ? 'profile_image_path' : 'NULL::varchar AS profile_image_path'
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<CastingDirectorRow>(
    `
      SELECT
        id,
        person_name,
        company,
        source_db,
        source_table,
        source_id,
        ${profileImageMediaSelect},
        ${profileImagePathSelect},
        legacy_meta
      FROM casting_directors
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
  row: CastingDirectorRow
}): Promise<RowResult> {
  const base = {
    castingDirectorId: row.id,
    existingProfileImageMediaId: row.profile_image_media_id,
    personName: text(row.person_name),
  }

  if (!options.overwrite && row.profile_image_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.profile_image_media_id,
    }
  }

  const matched = await matchProfileImage(row)

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
      title: text(row.person_name),
    }))

  await linkCastingDirectorToMedia({
    mediaId,
    matched,
    options,
    pool,
    row,
  })

  return {
    ...base,
    action: existingMediaId ? 'linked-existing-media' : 'created-media-and-linked',
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaFileName: matched.mediaFileName,
    mediaId,
  }
}

async function matchProfileImage(row: CastingDirectorRow): Promise<MatchedProfileImage | undefined> {
  const byStoredPath = normalizeLocalPath(row.profile_image_path)
  const candidates = byStoredPath ? [byStoredPath] : await localCandidatesForRow(row)
  const localPath = candidates[0]

  if (!localPath) {
    return undefined
  }

  const fileName = path.basename(localPath)
  const mediaFileName = buildMediaFileName(row, fileName)

  return {
    fileName,
    legacyPath: localPath.replace(/^public/, ''),
    localPath,
    mediaFileName,
  }
}

async function localCandidatesForRow(row: CastingDirectorRow) {
  const sourceDb = text(row.source_db)
  const sourceTable = text(row.source_table)
  const sourceId = numberOrUndefined(row.source_id)

  if (!sourceDb || !sourceTable || !sourceId) {
    return []
  }

  const boTable = sourceTable.replace(/^g5_write_/, '')
  const dir = `public/legacy/castings/${sourceDb}/${boTable}/${sourceId}`

  try {
    const entries = await fs.readdir(resolveProjectPath(dir), { withFileTypes: true })

    return entries
      .filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
      .map((entry) => `${dir}/${entry.name}`)
      .sort()
  } catch {
    return []
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>('SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1', [
    fileName,
  ])

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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'casting-director-media-'))
  const tempPath = path.join(tempDir, matched.mediaFileName)
  await fs.copyFile(resolveProjectPath(matched.localPath), tempPath)
  return tempPath
}

async function linkCastingDirectorToMedia({
  mediaId,
  matched,
  options,
  pool,
  row,
}: {
  mediaId: number
  matched: MatchedProfileImage
  options: Options
  pool: Pool
  row: CastingDirectorRow
}) {
  const shouldSetMedia = options.overwrite || !row.profile_image_media_id
  const shouldSetPath = options.overwrite || !row.profile_image_path

  if (!shouldSetMedia && !shouldSetPath) {
    return
  }

  await pool.query(
    `
      UPDATE casting_directors
      SET
        profile_image_media_id = CASE WHEN $2 THEN $1 ELSE profile_image_media_id END,
        profile_image_path = CASE WHEN $3 THEN $4 ELSE profile_image_path END,
        updated_at = NOW()
      WHERE id = $5
    `,
    [mediaId, shouldSetMedia, shouldSetPath, matched.legacyPath, row.id],
  )
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

function buildMediaFileName(row: CastingDirectorRow, fileName: string) {
  const extension = path.extname(fileName).toLowerCase()
  const sourceDb = slugPart(row.source_db) ?? 'unknown'
  const sourceTable = slugPart(row.source_table?.replace(/^g5_write_/, '')) ?? 'casting'
  const sourceId = numberOrUndefined(row.source_id) ?? row.id
  const personName = slugPart(row.person_name) ?? `id-${row.id}`
  const company = slugPart(row.company) ?? 'company'

  return `casting-director-${personName}-${company}-${sourceDb}-${sourceTable}-${sourceId}${extension}`
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

function slugPart(value: unknown) {
  const normalized = text(value)
    ?.normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || undefined
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

function numberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

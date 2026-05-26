import fs from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import sharp from 'sharp'

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
  overwrite: boolean
  write: boolean
}

type ProfileRow = {
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
  extension: string
  legacyPath: string
  localPath: string
  mediaFileName: string
  originalFileName: string
}

type ImageInfo = {
  buffer: Buffer
  contentType: string
  filesize: number
  height?: number
  width?: number
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'dry-run'
    | 'failed'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'unresolved-local-file'
    | 'unresolved-profile-image'
  error?: string
  existingProfileImageMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaFileName?: string
  mediaId?: number
  name?: string
  objectKey?: string
  profileId: number
  targetPrefix?: string
}

const ROLE_PREFIX = 'media/profiles/profile-images'

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
    throw new Error('profiles.profile_image_media_id 컬럼이 필요합니다. 먼저 마이그레이션을 적용하세요.')
  }

  const results: RowResult[] = []

  try {
    const rows = await readProfileRows(pool, options, schema)

    for (const row of rows) {
      results.push(await processRow({ options, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      objectKeySamples: results
        .map((result) => result.objectKey)
        .filter(Boolean)
        .slice(0, 5),
      options,
      rows: results,
      schema,
      totals: buildTotals(results),
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          objectKeySamples: output.objectKeySamples,
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
  }
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/profile-image-r2-upload-report.json'
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
        AND table_name = 'profiles'
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

async function readProfileRows(
  pool: Pool,
  options: Options,
  schema: SchemaState,
): Promise<ProfileRow[]> {
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

  const result = await pool.query<ProfileRow>(
    `
      SELECT
        id,
        name,
        ${profileImageMediaSelect},
        ${profileImagePathSelect}
      FROM profiles
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
  pool,
  row,
}: {
  options: Options
  pool: Pool
  row: ProfileRow
}): Promise<RowResult> {
  const base = {
    existingProfileImageMediaId: row.profile_image_media_id,
    name: text(row.name),
    profileId: row.id,
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

  const targetPrefix = `${ROLE_PREFIX}/${row.id}`
  const objectKey = `${targetPrefix}/${matched.mediaFileName}`
  const existingMediaId = await findExistingMediaId(pool, targetPrefix, matched.mediaFileName)

  const common = {
    ...base,
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaFileName: matched.mediaFileName,
    objectKey,
    targetPrefix,
  }

  if (existingMediaId) {
    if (!options.dryRun) {
      await linkProfileToMedia({ mediaId: existingMediaId, pool, row })
    }

    return {
      ...common,
      action: options.dryRun ? 'dry-run' : 'linked-existing-media',
      mediaId: existingMediaId,
    }
  }

  const exists = await localFileExists(matched.localPath)

  if (!exists) {
    return {
      ...common,
      action: 'unresolved-local-file',
    }
  }

  if (options.dryRun) {
    return {
      ...common,
      action: 'dry-run',
    }
  }

  try {
    const image = await readImageInfo(matched.localPath, matched.originalFileName)

    await uploadR2Object({
      body: image.buffer,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: image.contentType,
      key: objectKey,
    })

    const mediaId = await insertMediaRow({
      image,
      matched,
      pool,
      row,
      targetPrefix,
    })
    await linkProfileToMedia({ mediaId, pool, row })

    return {
      ...common,
      action: 'created-media-and-linked',
      mediaId,
    }
  } catch (error) {
    return {
      ...common,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function matchProfileImage(row: ProfileRow): MatchedProfileImage | undefined {
  const localPath = normalizeLocalPath(row.profile_image_path)

  if (!localPath) {
    return undefined
  }

  const originalFileName = path.basename(localPath)
  const extension = path.extname(originalFileName).toLowerCase() || '.bin'
  const mediaFileName = `profile-image-${row.id}${extension}`

  return {
    extension,
    legacyPath: localPath.replace(/^public/, ''),
    localPath,
    mediaFileName,
    originalFileName,
  }
}

async function findExistingMediaId(pool: Pool, prefix: string, fileName: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE prefix = $1 AND filename = $2 ORDER BY id ASC LIMIT 1',
    [prefix, fileName],
  )

  return result.rows[0]?.id
}

async function readImageInfo(localPath: string, originalFileName: string): Promise<ImageInfo> {
  const absolutePath = resolveProjectPath(localPath)
  const buffer = await fs.readFile(absolutePath)
  const metadata = await sharp(buffer, { failOn: 'none' }).metadata()

  return {
    buffer,
    contentType: contentTypeFromPath(originalFileName, metadata.format),
    filesize: buffer.byteLength,
    height: metadata.height,
    width: metadata.width,
  }
}

async function insertMediaRow({
  image,
  matched,
  pool,
  row,
  targetPrefix,
}: {
  image: ImageInfo
  matched: MatchedProfileImage
  pool: Pool
  row: ProfileRow
  targetPrefix: string
}) {
  const result = await pool.query<{ id: number }>(
    `
      INSERT INTO media (
        alt,
        created_at,
        filename,
        filesize,
        focal_x,
        focal_y,
        height,
        mime_type,
        prefix,
        updated_at,
        url,
        width
      )
      VALUES ($1, NOW(), $2, $3, 50, 50, $4, $5, $6, NOW(), $7, $8)
      RETURNING id
    `,
    [
      text(row.name) ?? matched.mediaFileName,
      matched.mediaFileName,
      image.filesize,
      image.height ?? null,
      image.contentType,
      targetPrefix,
      `/api/media/file/${encodeURIComponent(matched.mediaFileName)}`,
      image.width ?? null,
    ],
  )

  return result.rows[0].id
}

async function linkProfileToMedia({
  mediaId,
  pool,
  row,
}: {
  mediaId: number
  pool: Pool
  row: ProfileRow
}) {
  await pool.query(
    `
      UPDATE profiles
      SET
        profile_image_media_id = $1,
        updated_at = NOW()
      WHERE id = $2
    `,
    [mediaId, row.id],
  )
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

function contentTypeFromPath(filename: string, sharpFormat?: string) {
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.avif' || sharpFormat === 'avif') return 'image/avif'
  if (ext === '.gif' || sharpFormat === 'gif') return 'image/gif'
  if (ext === '.jpg' || ext === '.jpeg' || sharpFormat === 'jpeg') return 'image/jpeg'
  if (ext === '.png' || sharpFormat === 'png') return 'image/png'
  if (ext === '.webp' || sharpFormat === 'webp') return 'image/webp'

  return 'application/octet-stream'
}

function buildTotals(results: RowResult[]) {
  return {
    createdMediaAndLinked: count(results, 'created-media-and-linked'),
    dryRun: count(results, 'dry-run'),
    failed: count(results, 'failed'),
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

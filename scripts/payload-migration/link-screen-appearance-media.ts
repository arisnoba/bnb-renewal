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
  concurrency: number
  dryRun: boolean
  existingR2Only: boolean
  ids: string[]
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  progressEvery: number
  reuseExistingR2: boolean
  roles: Role[]
  write: boolean
}

type Role = 'profile-image' | 'thumbnail'

type ScreenAppearanceRow = {
  id: number
  performer_name: string | null
  profile_image_media_id: number | null
  profile_image_path: string | null
  thumbnail_media_id: number | null
  thumbnail_path: string | null
  title: string | null
}

type SchemaState = {
  hasProfileImageMediaId: boolean
  hasThumbnailMediaId: boolean
  hasWritableFields: boolean
}

type MatchedImage = {
  legacyPath: string
  localPath?: string
  sourceUrl?: string
  targetBaseName: string
  targetFilename: string
  targetPrefix: string
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'created-media-from-r2-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'skipped-no-source'
    | 'unresolved-source-file'
    | 'write-error'
  errorMessage?: string
  existingMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  role: Role
  screenAppearanceId: number
  sourceUrl?: string
  targetFilename?: string
  targetPrefix?: string
  title?: string
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

const ROLE_PREFIX: Record<Role, string> = {
  'profile-image': 'media/screen-appearances/profile-images',
  thumbnail: 'media/screen-appearances/thumbnails',
}

const ROLE_FILENAME_BASE: Record<Role, string> = {
  'profile-image': 'screen-appearance-profile-image',
  thumbnail: 'screen-appearance-thumbnail',
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

  if (options.write && !schema.hasWritableFields) {
    throw new Error(
      'screen_appearances.thumbnail_media_id, profile_image_media_id 컬럼이 필요합니다. 먼저 마이그레이션을 적용하세요.',
    )
  }

  const payload = options.write && !options.existingR2Only ? await getPayloadForWrite() : undefined
  const results: RowResult[] = []

  try {
    const rows = await readRows(pool, options, schema)
    const tasks = rows.flatMap((row) => options.roles.map((role) => ({ role, row })))
    const totalTasks = tasks.length
    let processedTasks = 0

    async function processTask(task: (typeof tasks)[number]) {
      const result = await processRole({ options, payload, pool, role: task.role, row: task.row })
      results.push(result)
      processedTasks += 1

      if (shouldPrintProgress(options, processedTasks, totalTasks)) {
        console.log(
          JSON.stringify({
            action: result.action,
            processed: processedTasks,
            role: result.role,
            screenAppearanceId: result.screenAppearanceId,
            total: totalTasks,
          }),
        )
      }
    }

    if (options.existingR2Only && options.concurrency > 1) {
      let nextTaskIndex = 0
      await Promise.all(
        Array.from({ length: options.concurrency }, async () => {
          while (nextTaskIndex < tasks.length) {
            const task = tasks[nextTaskIndex]
            nextTaskIndex += 1
            await processTask(task)
          }
        }),
      )
    } else {
      for (const task of tasks) {
        await processTask(task)
      }
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
  let concurrency = 1
  let dryRun = false
  let existingR2Only = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/screen-appearance-media-link-report.json'
  let overwrite = false
  let progressEvery = 100
  let reuseExistingR2 = false
  let roles: Role[] = ['thumbnail', 'profile-image']
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--concurrency') {
      concurrency = parsePositiveInt(readRequiredValue(args, index, '--concurrency'), '--concurrency')
      index += 1
      continue
    }

    if (arg === '--existing-r2-only') {
      existingR2Only = true
      reuseExistingR2 = true
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
      limit = value === 'all' ? 'all' : parsePositiveInt(value, '--limit')
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

    if (arg === '--progress-every') {
      progressEvery = parsePositiveInt(readRequiredValue(args, index, '--progress-every'), '--progress-every')
      index += 1
      continue
    }

    if (arg === '--reuse-existing-r2') {
      reuseExistingR2 = true
      continue
    }

    if (arg === '--roles') {
      roles = parseRoles(readRequiredValue(args, index, '--roles'))
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return {
    concurrency,
    dryRun,
    existingR2Only,
    ids,
    limit,
    outputPath,
    overwrite,
    progressEvery,
    reuseExistingR2,
    roles,
    write,
  }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

function parsePositiveInt(value: string, name: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} 값은 양의 정수여야 합니다: ${value}`)
  }

  return parsed
}

function parseRoles(value: string): Role[] {
  const roles = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (roles.length === 0) {
    throw new Error('--roles 값이 비어 있습니다.')
  }

  for (const role of roles) {
    if (role !== 'thumbnail' && role !== 'profile-image') {
      throw new Error(`알 수 없는 --roles 값입니다: ${role}`)
    }
  }

  return roles as Role[]
}

async function readSchemaState(pool: Pool): Promise<SchemaState> {
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'screen_appearances'
        AND column_name IN ('thumbnail_media_id', 'profile_image_media_id')
    `,
  )
  const columns = new Set(result.rows.map((row) => row.column_name))

  return {
    hasProfileImageMediaId: columns.has('profile_image_media_id'),
    hasThumbnailMediaId: columns.has('thumbnail_media_id'),
    hasWritableFields: columns.has('profile_image_media_id') && columns.has('thumbnail_media_id'),
  }
}

async function readRows(
  pool: Pool,
  options: Options,
  schema: SchemaState,
): Promise<ScreenAppearanceRow[]> {
  const params: unknown[] = []
  const where: string[] = []

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    const missingMedia: string[] = []

    if (options.roles.includes('thumbnail') && schema.hasThumbnailMediaId) {
      missingMedia.push('(thumbnail_path IS NOT NULL AND thumbnail_media_id IS NULL)')
    }

    if (options.roles.includes('profile-image') && schema.hasProfileImageMediaId) {
      missingMedia.push('(profile_image_path IS NOT NULL AND profile_image_media_id IS NULL)')
    }

    if (missingMedia.length > 0) {
      where.push(`(${missingMedia.join(' OR ')})`)
    }
  }

  const thumbnailMediaSelect = schema.hasThumbnailMediaId
    ? 'thumbnail_media_id'
    : 'NULL::integer AS thumbnail_media_id'
  const profileImageMediaSelect = schema.hasProfileImageMediaId
    ? 'profile_image_media_id'
    : 'NULL::integer AS profile_image_media_id'
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`

  const result = await pool.query<ScreenAppearanceRow>(
    `
      SELECT
        id,
        title,
        performer_name,
        thumbnail_path,
        profile_image_path,
        ${thumbnailMediaSelect},
        ${profileImageMediaSelect}
      FROM screen_appearances
      ${whereSql}
      ORDER BY id ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

async function processRole({
  options,
  payload,
  pool,
  role,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  role: Role
  row: ScreenAppearanceRow
}): Promise<RowResult> {
  const existingMediaId = role === 'thumbnail' ? row.thumbnail_media_id : row.profile_image_media_id
  const base: RowResult = {
    action: 'dry-run',
    existingMediaId,
    role,
    screenAppearanceId: row.id,
    title: text(row.title),
  }

  if (!options.overwrite && existingMediaId) {
    return { ...base, action: 'skipped-existing', mediaId: existingMediaId }
  }

  const matched = matchImage(row, role)

  if (!matched) {
    return { ...base, action: 'skipped-no-source' }
  }

  const foundExistingMediaId = await findExistingMediaId(pool, matched)
  const resultBase = {
    ...base,
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaId: foundExistingMediaId,
    sourceUrl: matched.sourceUrl,
    targetFilename: matched.targetFilename,
    targetPrefix: matched.targetPrefix,
  }

  if (options.dryRun) {
    return resultBase
  }

  try {
    const title = role === 'thumbnail' ? text(row.title) : text(row.performer_name) ?? text(row.title)
    const existingR2Media = foundExistingMediaId
      ? undefined
      : await maybeCreateMediaFromExistingR2({ matched, options, pool, title })
    if (!foundExistingMediaId && !existingR2Media && !payload) {
      return {
        ...resultBase,
        action: 'unresolved-source-file',
        errorMessage: '기존 R2 object가 없고 Payload fallback이 비활성화되어 있습니다.',
      }
    }

    let mediaId = foundExistingMediaId ?? existingR2Media?.mediaId

    if (!mediaId) {
      if (!payload) {
        throw new Error('쓰기 fallback 에는 Payload client 가 필요합니다.')
      }

      mediaId = await createMediaFromSource({
        matched,
        payload,
        title,
      })
    }

    await linkMedia({ mediaId, pool, role, row })

    return {
      ...resultBase,
      action: foundExistingMediaId
        ? 'linked-existing-media'
        : existingR2Media
          ? 'created-media-from-r2-and-linked'
          : 'created-media-and-linked',
      targetFilename: existingR2Media?.filename ?? resultBase.targetFilename,
      mediaId,
    }
  } catch (error) {
    return {
      ...resultBase,
      action: error instanceof SourceNotFoundError ? 'unresolved-source-file' : 'write-error',
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

function matchImage(row: ScreenAppearanceRow, role: Role): MatchedImage | undefined {
  const source = role === 'thumbnail' ? text(row.thumbnail_path) : text(row.profile_image_path)

  if (!source) {
    return undefined
  }

  const sourcePath = sourcePathname(source)
  const extension = path.extname(sourcePath).toLowerCase() || '.jpg'
  const targetBaseName = `${ROLE_FILENAME_BASE[role]}-${row.id}`
  const targetPrefix = `${ROLE_PREFIX[role]}/${row.id}`
  const targetFilename = `${targetBaseName}${safeExtension(extension)}`
  const localPath = sourcePath.startsWith('/legacy/') || sourcePath.startsWith('/uploads/')
    ? `public${sourcePath}`
    : sourcePath.startsWith('public/')
      ? sourcePath
      : undefined
  const sourceUrl = /^https?:\/\//i.test(source) ? source : undefined

  return {
    legacyPath: sourcePath,
    localPath,
    sourceUrl,
    targetBaseName,
    targetFilename,
    targetPrefix,
  }
}

function sourcePathname(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value.startsWith('/') || value.startsWith('public/') ? value : `/${value}`
  }
}

function safeExtension(value: string) {
  return /^\.[a-z0-9]+$/.test(value) ? value : '.jpg'
}

async function findExistingMediaId(pool: Pool, matched: MatchedImage) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE prefix = $1 AND filename = ANY($2::text[]) ORDER BY id ASC LIMIT 1',
    [matched.targetPrefix, mediaFilenameCandidates(matched)],
  )

  return result.rows[0]?.id
}

function mediaFilenameCandidates(matched: MatchedImage) {
  return Array.from(new Set([`${matched.targetBaseName}.webp`, matched.targetFilename]))
}

async function maybeCreateMediaFromExistingR2({
  matched,
  options,
  pool,
  title,
}: {
  matched: MatchedImage
  options: Options
  pool: Pool
  title?: string
}) {
  if (!options.reuseExistingR2) {
    return undefined
  }

  const publicBaseUrl = text(process.env.R2_PUBLIC_BASE_URL)?.replace(/\/+$/, '')

  if (!publicBaseUrl) {
    return undefined
  }

  for (const filename of mediaFilenameCandidates(matched)) {
    const url = `${publicBaseUrl}/${matched.targetPrefix}/${filename}`
    const metadata = await readRemoteImageMetadata(url)

    if (!metadata) {
      continue
    }

    const result = await pool.query<{ id: number }>(
      `
        INSERT INTO media (
          alt,
          updated_at,
          created_at,
          url,
          thumbnail_u_r_l,
          filename,
          mime_type,
          filesize,
          width,
          height,
          focal_x,
          focal_y,
          prefix
        )
        VALUES ($1, NOW(), NOW(), $2, $2, $3, $4, $5, $6, $7, 50, 50, $8)
        RETURNING id
      `,
      [
        title ?? filename,
        url,
        filename,
        metadata.mimeType,
        metadata.filesize,
        metadata.width,
        metadata.height,
        matched.targetPrefix,
      ],
    )

    return { filename, mediaId: result.rows[0].id }
  }

  return undefined
}

async function readRemoteImageMetadata(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(`R2 기존 이미지를 확인하지 못했습니다: ${response.status} ${url}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const sharp = (await import('sharp')).default
  const metadata = await sharp(buffer).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error(`R2 기존 이미지 크기를 확인하지 못했습니다: ${url}`)
  }

  return {
    filesize: buffer.byteLength,
    height: metadata.height,
    mimeType: response.headers.get('content-type') ?? `image/${metadata.format ?? 'webp'}`,
    width: metadata.width,
  }
}

async function createMediaFromSource({
  matched,
  payload,
  title,
}: {
  matched: MatchedImage
  payload: DynamicPayload
  title?: string
}) {
  const tempPath = await prepareTempMediaFile(matched)
  let id: number | undefined

  try {
    const created = await payload.create({
      collection: 'media',
      data: {
        alt: title ?? matched.targetFilename,
        prefix: matched.targetPrefix,
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

async function prepareTempMediaFile(matched: MatchedImage) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'screen-appearance-media-'))
  const tempPath = path.join(tempDir, matched.targetFilename)

  if (matched.localPath) {
    const localSource = resolveProjectPath(matched.localPath)

    try {
      await fs.copyFile(localSource, tempPath)
      return tempPath
    } catch {
      if (!matched.sourceUrl) {
        throw new SourceNotFoundError(`로컬 원본 파일을 찾을 수 없습니다: ${matched.localPath}`)
      }
    }
  }

  if (!matched.sourceUrl) {
    throw new SourceNotFoundError('원본 URL이 없습니다.')
  }

  const response = await fetch(matched.sourceUrl, { signal: AbortSignal.timeout(20000) })

  if (!response.ok) {
    throw new SourceNotFoundError(`원본 이미지를 가져오지 못했습니다: ${response.status} ${matched.sourceUrl}`)
  }

  await fs.writeFile(tempPath, Buffer.from(await response.arrayBuffer()))
  return tempPath
}

async function linkMedia({
  mediaId,
  pool,
  role,
  row,
}: {
  mediaId: number
  pool: Pool
  role: Role
  row: ScreenAppearanceRow
}) {
  const column = role === 'thumbnail' ? 'thumbnail_media_id' : 'profile_image_media_id'

  await pool.query(
    `
      UPDATE screen_appearances
      SET ${column} = $1,
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

function buildTotals(results: RowResult[]) {
  return results.reduce<Record<string, number>>((totals, row) => {
    const key = `${row.role}:${row.action}`
    totals[key] = (totals[key] ?? 0) + 1
    totals.rows = (totals.rows ?? 0) + 1
    return totals
  }, {})
}

function shouldPrintProgress(options: Options, processed: number, total: number) {
  return options.progressEvery > 0 && (processed % options.progressEvery === 0 || processed === total)
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

class SourceNotFoundError extends Error {}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

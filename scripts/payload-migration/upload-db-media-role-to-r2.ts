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

type MediaRole = 'broadcast-stations.logo' | 'news.body-image' | 'news.thumbnail' | 'star-cards.image'

type Options = {
  compressionQuality: number
  concurrency: number
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  mediaRole: MediaRole
  outputPath: string
  overwrite: boolean
  progressEvery: number
  write: boolean
}

type MediaRow = {
  current_filename: string
  current_prefix: string | null
  image_index: number | null
  media_id: number
  mime_type: string | null
  owner_id: number
  ref_count: number
  target_filename: string
  target_prefix: string
  title: string | null
  url: string | null
}

type PreparedImage = {
  body: Buffer
  compressed: boolean
  contentType: string
}

type EntryResult = {
  action: 'dry-run' | 'failed' | 'skipped-already-r2' | 'uploaded'
  compressed: boolean
  currentFilename: string
  currentPrefix: string | null
  error?: string
  mediaId: number
  objectKey: string
  ownerId: number
  refCount: number
  targetFilename: string
  targetPrefix: string
  title?: string
  uploadedBytes?: number
}

const DEFAULT_COMPRESSION_QUALITY = 80
const ROLE_PREFIX: Record<MediaRole, string> = {
  'broadcast-stations.logo': 'media/broadcast-stations/logos',
  'news.body-image': 'media/news/body-images',
  'news.thumbnail': 'media/news/thumbnails',
  'star-cards.image': 'media/star-cards/images',
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
  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  const pool = new Pool({ connectionString })

  try {
    const rows = await readRows(pool, options)
    assertUniqueObjectKeys(rows)
    const progress = {
      compressed: 0,
      done: 0,
      failed: 0,
      skipped: 0,
      uploaded: 0,
    }

    const results = await mapWithConcurrency(rows, options.concurrency, async (row) => {
      const result = await processRow({ options, pool, row })
      progress.done += 1
      if (result.compressed) progress.compressed += 1
      if (result.action === 'failed') progress.failed += 1
      if (result.action === 'skipped-already-r2') progress.skipped += 1
      if (result.action === 'uploaded') progress.uploaded += 1

      if (options.write && (progress.done % options.progressEvery === 0 || progress.done === rows.length)) {
        console.log(
          JSON.stringify({
            compressed: progress.compressed,
            done: progress.done,
            failed: progress.failed,
            role: options.mediaRole,
            skipped: progress.skipped,
            total: rows.length,
            uploaded: progress.uploaded,
          }),
        )
      }

      return result
    })

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      objectKeySamples: results.map((result) => result.objectKey).slice(0, 10),
      options,
      prefix: ROLE_PREFIX[options.mediaRole],
      rows: results,
      totals: buildTotals(results),
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          objectKeySamples: output.objectKeySamples,
          outputPath: options.outputPath,
          prefix: output.prefix,
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
  let compressionQuality = DEFAULT_COMPRESSION_QUALITY
  let concurrency = 8
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let mediaRole: MediaRole | undefined
  let outputPath = ''
  let overwrite = false
  let progressEvery = 100
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--compression-quality') {
      compressionQuality = parseBoundedInt(
        readRequiredValue(args, index, '--compression-quality'),
        '--compression-quality',
        1,
        100,
      )
      index += 1
      continue
    }

    if (arg === '--concurrency') {
      concurrency = parseBoundedInt(readRequiredValue(args, index, '--concurrency'), '--concurrency', 1, 24)
      index += 1
      continue
    }

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
      limit = value === 'all' ? 'all' : parseBoundedInt(value, '--limit', 1, Number.MAX_SAFE_INTEGER)
      index += 1
      continue
    }

    if (arg === '--media-role') {
      mediaRole = toMediaRole(readRequiredValue(args, index, '--media-role'))
      index += 1
      continue
    }

    if (arg === '--no-compress') {
      compressionQuality = 0
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
      progressEvery = parseBoundedInt(readRequiredValue(args, index, '--progress-every'), '--progress-every', 1, 10000)
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }
  }

  if (!mediaRole) {
    throw new Error(
      '--media-role 값이 필요합니다. 허용 값: broadcast-stations.logo, news.thumbnail, news.body-image, star-cards.image',
    )
  }

  return {
    compressionQuality,
    concurrency,
    dryRun: !write || dryRun,
    ids,
    limit,
    mediaRole,
    outputPath: outputPath || `tmp/legacy-assets/${mediaRole.replace(/\./g, '-')}-r2-upload-report.json`,
    overwrite,
    progressEvery,
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

function parseBoundedInt(value: string, name: string, min: number, max: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} 값은 ${min} 이상 ${max} 이하 정수여야 합니다: ${value}`)
  }

  return parsed
}

function toMediaRole(value: string): MediaRole {
  if (
    value === 'broadcast-stations.logo' ||
    value === 'news.thumbnail' ||
    value === 'news.body-image' ||
    value === 'star-cards.image'
  ) {
    return value
  }

  throw new Error(`알 수 없는 --media-role 값입니다: ${value}`)
}

async function readRows(pool: Pool, options: Options) {
  if (options.mediaRole === 'broadcast-stations.logo') {
    return readBroadcastStationLogoRows(pool, options)
  }

  if (options.mediaRole === 'news.thumbnail') {
    return readNewsThumbnailRows(pool, options)
  }

  if (options.mediaRole === 'news.body-image') {
    return readNewsBodyRows(pool, options)
  }

  return readStarCardImageRows(pool, options)
}

async function readBroadcastStationLogoRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = ['broadcast_stations.logo_media_id IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`broadcast_stations.id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    where.push(`media.prefix IS DISTINCT FROM '${ROLE_PREFIX['broadcast-stations.logo']}'`)
  }

  const result = await pool.query<MediaRow>(
    `
      SELECT
        broadcast_stations.id AS owner_id,
        broadcast_stations.station_name AS title,
        media.id AS media_id,
        media.filename AS current_filename,
        media.prefix AS current_prefix,
        media.mime_type,
        media.url,
        NULL::int AS image_index,
        1::int AS ref_count,
        media.filename AS target_filename,
        '${ROLE_PREFIX['broadcast-stations.logo']}' AS target_prefix
      FROM broadcast_stations
      JOIN media ON media.id = broadcast_stations.logo_media_id
      WHERE ${where.join(' AND ')}
      ORDER BY broadcast_stations.id ASC
      ${limitSql(options)}
    `,
    params,
  )

  return result.rows
}

async function readNewsThumbnailRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = ['news.thumbnail_media_id IS NOT NULL', "news.published_at >= '2020-01-01'::timestamptz"]

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`news.id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    where.push(`media.prefix IS DISTINCT FROM ('${ROLE_PREFIX['news.thumbnail']}/' || news.id::text)`)
  }

  const result = await pool.query<MediaRow>(
    `
      SELECT
        news.id AS owner_id,
        news.title,
        media.id AS media_id,
        media.filename AS current_filename,
        media.prefix AS current_prefix,
        media.mime_type,
        media.url,
        NULL::int AS image_index,
        1::int AS ref_count,
        media.filename AS target_filename,
        '${ROLE_PREFIX['news.thumbnail']}/' || news.id::text AS target_prefix
      FROM news
      JOIN media ON media.id = news.thumbnail_media_id
      WHERE ${where.join(' AND ')}
      ORDER BY news.id ASC
      ${limitSql(options)}
    `,
    params,
  )

  return result.rows
}

async function readNewsBodyRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = ['canonical.media_id IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`canonical.owner_id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    where.push(
      `NOT (media.prefix = '${ROLE_PREFIX['news.body-image']}/' || canonical.owner_id::text AND media.filename = canonical.target_filename)`,
    )
  }

  const result = await pool.query<MediaRow>(
    `
      WITH refs AS (
        SELECT
          news.id AS owner_id,
          news.title,
          (node->>'value')::int AS media_id,
          row_number() OVER (PARTITION BY news.id ORDER BY ordinal) AS image_index
        FROM news
        CROSS JOIN LATERAL jsonb_path_query(news.body::jsonb, '$.** ? (@.relationTo == "media" && @.value.type() == "number")') WITH ORDINALITY AS item(node, ordinal)
        WHERE news.body IS NOT NULL
          AND news.published_at >= '2020-01-01'::timestamptz
      ),
      canonical AS (
        SELECT
          refs.*,
          count(*) OVER (PARTITION BY refs.media_id) AS ref_count,
          row_number() OVER (PARTITION BY refs.media_id ORDER BY refs.owner_id, refs.image_index) AS media_rank,
          'news-body-image-' || refs.owner_id::text || '-' || refs.image_index::text || lower(COALESCE(NULLIF(regexp_replace(media.filename, '^.*(\\.[A-Za-z0-9]+)$', '\\1'), media.filename), '.jpg')) AS target_filename
        FROM refs
        JOIN media ON media.id = refs.media_id
      )
      SELECT
        canonical.owner_id,
        canonical.title,
        canonical.media_id,
        media.filename AS current_filename,
        media.prefix AS current_prefix,
        media.mime_type,
        media.url,
        canonical.image_index,
        canonical.ref_count,
        canonical.target_filename,
        '${ROLE_PREFIX['news.body-image']}/' || canonical.owner_id::text AS target_prefix
      FROM canonical
      JOIN media ON media.id = canonical.media_id
      WHERE canonical.media_rank = 1 AND ${where.join(' AND ')}
      ORDER BY canonical.owner_id ASC, canonical.image_index ASC, canonical.media_id ASC
      ${limitSql(options)}
    `,
    params,
  )

  return result.rows.map((row) => ({
    ...row,
    target_filename: ensureImageExtension(row.target_filename, row.current_filename),
  }))
}

async function readStarCardImageRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = ['canonical.media_id IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`canonical.owner_id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    where.push(
      `NOT (media.prefix = '${ROLE_PREFIX['star-cards.image']}/' || canonical.owner_id::text AND media.filename = canonical.target_filename)`,
    )
  }

  const result = await pool.query<MediaRow>(
    `
      WITH refs AS (
        SELECT
          star_cards_body_images._parent_id AS owner_id,
          star_cards.title,
          star_cards_body_images.image_media_id AS media_id,
          row_number() OVER (
            PARTITION BY star_cards_body_images._parent_id
            ORDER BY star_cards_body_images._order, star_cards_body_images.id
          ) AS image_index
        FROM star_cards_body_images
        JOIN star_cards ON star_cards.id = star_cards_body_images._parent_id
        WHERE star_cards_body_images.image_media_id IS NOT NULL
      ),
      canonical AS (
        SELECT
          refs.*,
          count(*) OVER (PARTITION BY refs.media_id) AS ref_count,
          row_number() OVER (PARTITION BY refs.media_id ORDER BY refs.owner_id, refs.image_index) AS media_rank,
          'star-card-image-' || refs.owner_id::text || '-' || refs.image_index::text || lower(COALESCE(NULLIF(regexp_replace(media.filename, '^.*(\\.[A-Za-z0-9]+)$', '\\1'), media.filename), '.jpg')) AS target_filename
        FROM refs
        JOIN media ON media.id = refs.media_id
      )
      SELECT
        canonical.owner_id,
        canonical.title,
        canonical.media_id,
        media.filename AS current_filename,
        media.prefix AS current_prefix,
        media.mime_type,
        media.url,
        canonical.image_index,
        canonical.ref_count,
        canonical.target_filename,
        '${ROLE_PREFIX['star-cards.image']}/' || canonical.owner_id::text AS target_prefix
      FROM canonical
      JOIN media ON media.id = canonical.media_id
      WHERE canonical.media_rank = 1 AND ${where.join(' AND ')}
      ORDER BY canonical.owner_id ASC, canonical.image_index ASC, canonical.media_id ASC
      ${limitSql(options)}
    `,
    params,
  )

  return result.rows.map((row) => ({
    ...row,
    target_filename: ensureImageExtension(row.target_filename, row.current_filename),
  }))
}

function limitSql(options: Options) {
  return options.limit === 'all' ? '' : `LIMIT ${options.limit}`
}

function ensureImageExtension(targetFilename: string, sourceFilename: string) {
  if (/^.+\.[a-z0-9]+$/i.test(targetFilename)) {
    return targetFilename
  }

  const extension = path.extname(sourceFilename).toLowerCase()

  return `${targetFilename}${extension || '.jpg'}`
}

function assertUniqueObjectKeys(rows: MediaRow[]) {
  const seen = new Set<string>()

  for (const row of rows) {
    const objectKey = objectKeyFor(row)

    if (seen.has(objectKey)) {
      throw new Error(`중복 R2 object key 가 감지되었습니다: ${objectKey}`)
    }

    seen.add(objectKey)
  }
}

async function processRow({
  options,
  pool,
  row,
}: {
  options: Options
  pool: Pool
  row: MediaRow
}): Promise<EntryResult> {
  const objectKey = objectKeyFor(row)
  const base: EntryResult = {
    action: options.dryRun ? 'dry-run' : 'uploaded',
    compressed: false,
    currentFilename: row.current_filename,
    currentPrefix: row.current_prefix,
    mediaId: row.media_id,
    objectKey,
    ownerId: row.owner_id,
    refCount: row.ref_count,
    targetFilename: row.target_filename,
    targetPrefix: row.target_prefix,
    title: text(row.title),
  }

  if (
    !options.overwrite &&
    row.current_prefix === row.target_prefix &&
    row.current_filename === row.target_filename
  ) {
    return { ...base, action: 'skipped-already-r2' }
  }

  const localPath = resolveProjectPath('public/media', row.current_filename)

  try {
    if (options.dryRun) {
      await assertLocalFile(localPath)
      return base
    }

    const image = await prepareImage({ filename: row.current_filename, localPath, options, row })

    await uploadR2Object({
      body: image.body,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: image.contentType,
      key: objectKey,
    })

    await updateMediaRow({ image, pool, row })

    return {
      ...base,
      action: 'uploaded',
      compressed: image.compressed,
      uploadedBytes: image.body.byteLength,
    }
  } catch (error) {
    return {
      ...base,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function assertLocalFile(localPath: string) {
  const stat = await fs.stat(localPath)

  if (!stat.isFile()) {
    throw new Error(`로컬 파일이 아닙니다: ${localPath}`)
  }
}

async function prepareImage({
  filename,
  localPath,
  options,
  row,
}: {
  filename: string
  localPath: string
  options: Options
  row: MediaRow
}): Promise<PreparedImage> {
  const body = await fs.readFile(localPath)
  const contentType = normalizeContentType(row.mime_type) ?? contentTypeFor(filename)

  if (options.compressionQuality <= 0) {
    return { body, compressed: false, contentType }
  }

  const compressedBody = await compressImageBody({
    body,
    contentType,
    quality: options.compressionQuality,
  })

  if (!compressedBody || compressedBody.byteLength >= body.byteLength) {
    return { body, compressed: false, contentType }
  }

  return { body: compressedBody, compressed: true, contentType }
}

async function compressImageBody({
  body,
  contentType,
  quality,
}: {
  body: Buffer
  contentType: string
  quality: number
}) {
  try {
    if (contentType === 'image/jpeg') {
      return await sharp(body, { failOn: 'none' }).rotate().jpeg({ mozjpeg: true, quality }).toBuffer()
    }

    if (contentType === 'image/webp') {
      return await sharp(body, { failOn: 'none' }).rotate().webp({ quality }).toBuffer()
    }

    if (contentType === 'image/png') {
      return await sharp(body, { failOn: 'none' })
        .rotate()
        .png({ adaptiveFiltering: true, compressionLevel: 9, palette: true, quality })
        .toBuffer()
    }
  } catch {
    return undefined
  }

  return undefined
}

async function updateMediaRow({ image, pool, row }: { image: PreparedImage; pool: Pool; row: MediaRow }) {
  await pool.query(
    `
      UPDATE media
      SET
        filename = $1,
        filesize = $2,
        mime_type = $3,
        prefix = $4,
        thumbnail_u_r_l = NULL,
        url = $5,
        sizes_thumbnail_url = NULL,
        sizes_thumbnail_width = NULL,
        sizes_thumbnail_height = NULL,
        sizes_thumbnail_mime_type = NULL,
        sizes_thumbnail_filesize = NULL,
        sizes_thumbnail_filename = NULL,
        sizes_square_url = NULL,
        sizes_square_width = NULL,
        sizes_square_height = NULL,
        sizes_square_mime_type = NULL,
        sizes_square_filesize = NULL,
        sizes_square_filename = NULL,
        sizes_small_url = NULL,
        sizes_small_width = NULL,
        sizes_small_height = NULL,
        sizes_small_mime_type = NULL,
        sizes_small_filesize = NULL,
        sizes_small_filename = NULL,
        sizes_medium_url = NULL,
        sizes_medium_width = NULL,
        sizes_medium_height = NULL,
        sizes_medium_mime_type = NULL,
        sizes_medium_filesize = NULL,
        sizes_medium_filename = NULL,
        sizes_large_url = NULL,
        sizes_large_width = NULL,
        sizes_large_height = NULL,
        sizes_large_mime_type = NULL,
        sizes_large_filesize = NULL,
        sizes_large_filename = NULL,
        sizes_xlarge_url = NULL,
        sizes_xlarge_width = NULL,
        sizes_xlarge_height = NULL,
        sizes_xlarge_mime_type = NULL,
        sizes_xlarge_filesize = NULL,
        sizes_xlarge_filename = NULL,
        sizes_og_url = NULL,
        sizes_og_width = NULL,
        sizes_og_height = NULL,
        sizes_og_mime_type = NULL,
        sizes_og_filesize = NULL,
        sizes_og_filename = NULL,
        updated_at = NOW()
      WHERE id = $6
    `,
    [
      row.target_filename,
      image.body.byteLength,
      image.contentType,
      row.target_prefix,
      `/api/media/file/${encodeURIComponent(row.target_filename)}?prefix=${encodeURIComponent(row.target_prefix)}`,
      row.media_id,
    ],
  )
}

function objectKeyFor(row: MediaRow) {
  return path.posix.join(row.target_prefix, row.target_filename)
}

function contentTypeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  if (extension === '.avif') return 'image/avif'
  if (extension === '.bmp') return 'image/bmp'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.webp') return 'image/webp'

  return 'application/octet-stream'
}

function normalizeContentType(value: string | null | undefined) {
  const contentType = text(value)?.split(';')[0]?.trim().toLowerCase()

  return contentType || undefined
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))

  return results
}

function buildTotals(results: EntryResult[]) {
  return {
    compressedFiles: results.filter((result) => result.compressed).length,
    dryRun: count(results, 'dry-run'),
    failed: count(results, 'failed'),
    rows: results.length,
    skippedAlreadyR2: count(results, 'skipped-already-r2'),
    uploaded: count(results, 'uploaded'),
    uploadedBytes: results.reduce((sum, result) => sum + (result.uploadedBytes ?? 0), 0),
  }
}

function count(results: EntryResult[], action: EntryResult['action']) {
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

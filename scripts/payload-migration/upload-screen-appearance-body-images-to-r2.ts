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
  concurrency: number
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  progressEvery: number
  write: boolean
}

type BodyImageRow = {
  external_url: string | null
  filename: string
  image_index: number
  media_id: number
  mime_type: string | null
  parent_id: number
  prefix: string | null
  ref_count: number
  title: string | null
  url: string | null
}

type ImageInfo = {
  buffer: Buffer
  contentType: string
  filesize: number
}

type EntryResult = {
  action: 'dry-run' | 'failed' | 'skipped-already-r2' | 'uploaded'
  currentFilename: string
  currentPrefix: string | null
  error?: string
  filesize?: number
  mediaId: number
  objectKey: string
  refCount: number
  screenAppearanceId: number
  sourceUrl?: string
  targetFilename: string
  targetPrefix: string
  title?: string
}

const ROLE_PREFIX = 'media/screen-appearances/body-images'
const LOCAL_FALLBACK_DIR = 'tmp/legacy-assets/screen-appearance-body-fallback'

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

  try {
    const rows = await readBodyImageRows(pool, options)
    assertUniqueTargetFilenames(rows)

    const results = await mapWithConcurrency(rows, options.concurrency, async (row, index) => {
      const result = await processRow({ options, pool, row })

      if (options.write && (index + 1) % options.progressEvery === 0) {
        console.log(
          JSON.stringify({
            done: index + 1,
            failed: result.action === 'failed' ? 1 : 0,
            lastMediaId: row.media_id,
            total: rows.length,
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
      prefix: ROLE_PREFIX,
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
          prefix: ROLE_PREFIX,
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
  let concurrency = 8
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/screen-appearance-body-r2-upload-report.json'
  let overwrite = false
  let progressEvery = 100
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

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
    }
  }

  return {
    concurrency,
    dryRun: !write || dryRun,
    ids,
    limit,
    outputPath,
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

async function readBodyImageRows(pool: Pool, options: Options): Promise<BodyImageRow[]> {
  const params: unknown[] = []
  const where: string[] = ['canonical.image_id IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`canonical.parent_id::text = ANY($${params.length}::text[])`)
  }

  if (!options.overwrite) {
    where.push(`NOT (media.prefix LIKE '${ROLE_PREFIX}/%' AND media.external_url IS NULL)`)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const limitSql = options.limit === 'all' ? '' : `LIMIT ${options.limit}`

  const result = await pool.query<BodyImageRow>(
    `
      WITH image_refs AS (
        SELECT
          screen_appearances_body_images._parent_id AS parent_id,
          screen_appearances.title,
          screen_appearances_body_images.image_id,
          row_number() OVER (
            PARTITION BY screen_appearances_body_images._parent_id
            ORDER BY screen_appearances_body_images._order, screen_appearances_body_images.id
          ) AS image_index,
          row_number() OVER (
            PARTITION BY screen_appearances_body_images.image_id
            ORDER BY screen_appearances_body_images._parent_id, screen_appearances_body_images._order, screen_appearances_body_images.id
          ) AS media_rank,
          count(*) OVER (PARTITION BY screen_appearances_body_images.image_id) AS ref_count
        FROM screen_appearances_body_images
        JOIN screen_appearances
          ON screen_appearances.id = screen_appearances_body_images._parent_id
        WHERE screen_appearances_body_images.image_id IS NOT NULL
      ),
      canonical AS (
        SELECT *
        FROM image_refs
        WHERE media_rank = 1
      )
      SELECT
        canonical.parent_id,
        canonical.title,
        canonical.image_id AS media_id,
        canonical.image_index,
        canonical.ref_count,
        media.filename,
        media.prefix,
        media.mime_type,
        media.url,
        media.external_url
      FROM canonical
      JOIN media
        ON media.id = canonical.image_id
      ${whereSql}
      ORDER BY canonical.parent_id, canonical.image_index, canonical.image_id
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

function assertUniqueTargetFilenames(rows: BodyImageRow[]) {
  const seen = new Set<string>()

  for (const row of rows) {
    const objectKey = buildObjectKey(row)

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
  row: BodyImageRow
}): Promise<EntryResult> {
  const targetPrefix = `${ROLE_PREFIX}/${row.parent_id}`
  const targetFilename = buildTargetFilename(row)
  const objectKey = `${targetPrefix}/${targetFilename}`
  const sourceUrl = normalizeSourceUrl(row.external_url) ?? normalizeSourceUrl(row.url)
  const base: EntryResult = {
    action: 'dry-run',
    currentFilename: row.filename,
    currentPrefix: row.prefix,
    mediaId: row.media_id,
    objectKey,
    refCount: row.ref_count,
    screenAppearanceId: row.parent_id,
    sourceUrl,
    targetFilename,
    targetPrefix,
    title: text(row.title),
  }

  if (!options.overwrite && row.prefix === targetPrefix && row.filename === targetFilename && !row.external_url) {
    return { ...base, action: 'skipped-already-r2' }
  }

  if (!sourceUrl) {
    return { ...base, action: 'failed', error: '원본 URL이 없습니다.' }
  }

  if (options.dryRun) {
    return base
  }

  try {
    const image = (await readLocalFallbackImage(row)) ?? (await fetchImage(sourceUrl, row))

    await uploadR2Object({
      body: image.buffer,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: image.contentType,
      key: objectKey,
    })

    await updateMediaRow({ image, pool, row, targetFilename, targetPrefix })

    return { ...base, action: 'uploaded', filesize: image.filesize }
  } catch (error) {
    return {
      ...base,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function readLocalFallbackImage(row: BodyImageRow): Promise<ImageInfo | undefined> {
  const fallbackPath = resolveProjectPath(LOCAL_FALLBACK_DIR, `${row.media_id}${fileExtension(row)}`)

  try {
    const buffer = await fs.readFile(fallbackPath)

    return {
      buffer,
      contentType: normalizeContentType(row.mime_type) ?? contentTypeForExtension(fileExtension(row)),
      filesize: buffer.byteLength,
    }
  } catch {
    return undefined
  }
}

function buildObjectKey(row: BodyImageRow) {
  return `${ROLE_PREFIX}/${row.parent_id}/${buildTargetFilename(row)}`
}

function buildTargetFilename(row: BodyImageRow) {
  return `screen-appearance-body-image-${row.parent_id}-${row.image_index}${fileExtension(row)}`
}

function fileExtension(row: BodyImageRow) {
  const fromFilename = path.extname(row.filename)
  const fromUrl = path.extname(urlPathname(row.external_url) ?? urlPathname(row.url) ?? '')
  const extension = (fromFilename || fromUrl || '.jpg').toLowerCase()

  if (/^\.[a-z0-9]+$/.test(extension)) {
    return extension
  }

  return '.jpg'
}

function urlPathname(value: string | null | undefined) {
  const source = text(value)

  if (!source) {
    return undefined
  }

  try {
    return new URL(source).pathname
  } catch {
    return undefined
  }
}

function normalizeSourceUrl(value: string | null | undefined) {
  const source = text(value)

  if (!source) {
    return undefined
  }

  try {
    const url = new URL(source, 'https://www.baewoo.co.kr')

    if (url.protocol === 'http:') {
      url.protocol = 'https:'
    }

    return url.href
  } catch {
    return undefined
  }
}

async function fetchImage(sourceUrl: string, row: BodyImageRow): Promise<ImageInfo> {
  const response = await fetchWithRetry(sourceUrl)
  const contentType = normalizeContentType(response.headers.get('content-type')) ?? normalizeContentType(row.mime_type)

  if (!contentType?.startsWith('image/')) {
    throw new Error(`이미지 content-type 이 아닙니다: ${contentType ?? 'unknown'}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  return {
    buffer,
    contentType,
    filesize: buffer.byteLength,
  }
}

async function fetchWithRetry(sourceUrl: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(20000),
      })

      if (response.ok) {
        return response
      }

      lastError = new Error(`원격 원본 이미지를 가져오지 못했습니다: ${response.status} ${sourceUrl}`)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function normalizeContentType(value: string | null | undefined) {
  const contentType = text(value)?.split(';')[0]?.trim().toLowerCase()

  return contentType || undefined
}

function contentTypeForExtension(extension: string) {
  if (extension === '.avif') return 'image/avif'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.webp') return 'image/webp'

  return 'image/jpeg'
}

async function updateMediaRow({
  image,
  pool,
  row,
  targetFilename,
  targetPrefix,
}: {
  image: ImageInfo
  pool: Pool
  row: BodyImageRow
  targetFilename: string
  targetPrefix: string
}) {
  await pool.query(
    `
      UPDATE media
      SET
        external_url = NULL,
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
      targetFilename,
      image.filesize,
      image.contentType,
      targetPrefix,
      `/api/media/file/${encodeURIComponent(targetFilename)}?prefix=${encodeURIComponent(targetPrefix)}`,
      row.media_id,
    ],
  )
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
    dryRun: count(results, 'dry-run'),
    failed: count(results, 'failed'),
    rows: results.length,
    skippedAlreadyR2: count(results, 'skipped-already-r2'),
    uploaded: count(results, 'uploaded'),
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

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
  compressionQuality: number
  dryRun: boolean
  ids: string[]
  includeSizes: boolean
  limit: 'all' | number
  outputPath: string
  publishedFrom: string
  variantAboveBytes: number
  write: boolean
}

type NewsMediaRow = {
  filesize: number | null
  filename: string
  media_id: number
  news_id: number
  prefix: string | null
  sizes_large_filename: string | null
  sizes_medium_filename: string | null
  sizes_og_filename: string | null
  sizes_small_filename: string | null
  sizes_square_filename: string | null
  sizes_thumbnail_filename: string | null
  sizes_xlarge_filename: string | null
  title: string | null
}

type UploadFile = {
  filename: string
  localPath: string
  objectKey: string
  sizeName: string
}

type PreparedUploadFile = UploadFile & {
  body: Buffer
  compressed: boolean
  contentType: string
}

type EntryResult = {
  action: 'dry-run' | 'failed' | 'skipped-already-r2' | 'uploaded'
  currentPrefix: string | null
  files: UploadFile[]
  mediaId: number
  newsId: number
  targetPrefix: string
  title?: string
  uploaded: number
  compressed?: number
  error?: string
}

type SizeColumn = Extract<keyof NewsMediaRow, `sizes_${string}_filename`>

const ROLE_PREFIX = 'media/news/thumbnails'
const DEFAULT_COMPRESSION_QUALITY = 80
const DEFAULT_VARIANT_ABOVE_BYTES = 1024 * 1024
const SIZE_COLUMNS: Array<{ column: SizeColumn; name: string }> = [
  { column: 'sizes_thumbnail_filename', name: 'thumbnail' },
  { column: 'sizes_square_filename', name: 'square' },
  { column: 'sizes_small_filename', name: 'small' },
  { column: 'sizes_medium_filename', name: 'medium' },
  { column: 'sizes_large_filename', name: 'large' },
  { column: 'sizes_xlarge_filename', name: 'xlarge' },
  { column: 'sizes_og_filename', name: 'og' },
]

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
    const entries: EntryResult[] = []

    for (const row of rows) {
      entries.push(await processRow({ options, pool, row }))

      if (entries.length % 100 === 0 || entries.length === rows.length) {
        console.log(
          JSON.stringify({
            processed: entries.length,
            total: rows.length,
            uploaded: entries.reduce((sum, entry) => sum + entry.uploaded, 0),
          }),
        )
      }
    }

    const output = {
      dryRun: options.dryRun,
      entries,
      generatedAt: new Date().toISOString(),
      objectKeySamples: entries.flatMap((entry) => entry.files.map((file) => file.objectKey)).slice(0, 8),
      options,
      totals: buildTotals(entries),
      write: options.write,
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
  let compressionQuality = DEFAULT_COMPRESSION_QUALITY
  let dryRun = false
  let ids: string[] = []
  let includeSizes = false
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/news-thumbnail-r2-upload-report.json'
  let publishedFrom = '2020-01-01'
  let variantAboveBytes = DEFAULT_VARIANT_ABOVE_BYTES
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--compression-quality') {
      const value = readRequiredValue(args, index, '--compression-quality')
      const parsed = Number(value)

      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        throw new Error(`--compression-quality 값은 1 이상 100 이하 정수여야 합니다: ${value}`)
      }

      compressionQuality = parsed
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

    if (arg === '--include-sizes') {
      includeSizes = true
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

    if (arg === '--no-compress') {
      compressionQuality = 0
      continue
    }

    if (arg === '--published-from') {
      publishedFrom = readRequiredValue(args, index, '--published-from')

      if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedFrom)) {
        throw new Error(`--published-from 값은 YYYY-MM-DD 형식이어야 합니다: ${publishedFrom}`)
      }

      index += 1
      continue
    }

    if (arg === '--variant-above-mb') {
      const value = readRequiredValue(args, index, '--variant-above-mb')
      const parsed = Number(value)

      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`--variant-above-mb 값은 0 이상 숫자여야 합니다: ${value}`)
      }

      variantAboveBytes = Math.round(parsed * 1024 * 1024)
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return {
    compressionQuality,
    dryRun,
    ids,
    includeSizes,
    limit,
    outputPath,
    publishedFrom,
    variantAboveBytes,
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

async function readRows(pool: Pool, options: Options) {
  const params: unknown[] = [options.publishedFrom]
  const where = ['news.thumbnail_media_id IS NOT NULL', 'news.published_at >= $1::timestamptz']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`news.id::text = ANY($${params.length}::text[])`)
  }

  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<NewsMediaRow>(
    `
      SELECT
        news.id AS news_id,
        news.title,
        media.id AS media_id,
        media.filename,
        media.filesize,
        media.prefix,
        media.sizes_thumbnail_filename,
        media.sizes_square_filename,
        media.sizes_small_filename,
        media.sizes_medium_filename,
        media.sizes_large_filename,
        media.sizes_xlarge_filename,
        media.sizes_og_filename
      FROM news
      JOIN media ON media.id = news.thumbnail_media_id
      WHERE ${where.join(' AND ')}
      ORDER BY news.id ASC
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
  row: NewsMediaRow
}): Promise<EntryResult> {
  const targetPrefix = `${ROLE_PREFIX}/${row.news_id}`
  const files = buildUploadFiles(row, targetPrefix, options)
  const base: EntryResult = {
    action: options.dryRun ? 'dry-run' : 'uploaded',
    currentPrefix: row.prefix,
    files,
    mediaId: row.media_id,
    newsId: row.news_id,
    targetPrefix,
    title: text(row.title),
    uploaded: 0,
  }

  const includeSizeVariants = shouldIncludeSizeVariants(row, options)

  if (
    options.compressionQuality === 0 &&
    row.prefix === targetPrefix &&
    (includeSizeVariants || !hasSizeFilenames(row))
  ) {
    return { ...base, action: 'skipped-already-r2' }
  }

  const missingFile = await firstMissingFile(files)

  if (missingFile) {
    return {
      ...base,
      action: 'failed',
      error: `로컬 파일 없음: ${missingFile.localPath}`,
    }
  }

  if (options.dryRun) {
    return base
  }

  try {
    let uploadedOriginal: PreparedUploadFile | undefined

    for (const file of files) {
      const prepared = await prepareUploadFile({ file, options })

      await uploadR2Object({
        body: prepared.body,
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: prepared.contentType,
        key: file.objectKey,
      })

      if (file.sizeName === 'original') {
        uploadedOriginal = prepared
      }

      if (prepared.compressed) {
        base.compressed = (base.compressed ?? 0) + 1
      }

      base.uploaded += 1
    }

    await updateMediaRow({
      includeSizes: includeSizeVariants,
      originalFilesize: uploadedOriginal?.body.byteLength ?? row.filesize,
      pool,
      row,
      targetPrefix,
    })

    return base
  } catch (error) {
    return {
      ...base,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildUploadFiles(row: NewsMediaRow, targetPrefix: string, options: Options): UploadFile[] {
  const filenames = [
    { filename: row.filename, sizeName: 'original' },
    ...(shouldIncludeSizeVariants(row, options)
      ? SIZE_COLUMNS.flatMap((item) => {
          const filename = row[item.column]
          return filename ? [{ filename, sizeName: item.name }] : []
        })
      : []),
  ]

  return filenames.map((file) => ({
    filename: file.filename,
    localPath: resolveProjectPath('public/media', file.filename),
    objectKey: path.posix.join(targetPrefix, file.filename),
    sizeName: file.sizeName,
  }))
}

function hasSizeFilenames(row: NewsMediaRow) {
  return SIZE_COLUMNS.some((item) => Boolean(row[item.column]))
}

function shouldIncludeSizeVariants(_row: NewsMediaRow, options: Options) {
  if (options.includeSizes) {
    return true
  }

  return false
}

async function prepareUploadFile({
  file,
  options,
}: {
  file: UploadFile
  options: Options
}): Promise<PreparedUploadFile> {
  const body = await fs.readFile(file.localPath)
  const contentType = contentTypeFor(file.filename)

  if (options.compressionQuality <= 0) {
    return { ...file, body, compressed: false, contentType }
  }

  const compressedBody = await compressImageBody({
    body,
    contentType,
    quality: options.compressionQuality,
  })

  if (!compressedBody || compressedBody.byteLength >= body.byteLength) {
    return { ...file, body, compressed: false, contentType }
  }

  return { ...file, body: compressedBody, compressed: true, contentType }
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

async function firstMissingFile(files: UploadFile[]) {
  for (const file of files) {
    try {
      const stat = await fs.stat(file.localPath)

      if (!stat.isFile()) {
        return file
      }
    } catch {
      return file
    }
  }

  return undefined
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

async function updateMediaRow({
  includeSizes,
  originalFilesize,
  pool,
  row,
  targetPrefix,
}: {
  includeSizes: boolean
  originalFilesize: number | null
  pool: Pool
  row: NewsMediaRow
  targetPrefix: string
}) {
  if (includeSizes) {
    await pool.query('UPDATE media SET prefix = $1, updated_at = NOW() WHERE id = $2', [
      targetPrefix,
      row.media_id,
    ])
    return
  }

  await pool.query(
    `
      UPDATE media
      SET
        filesize = COALESCE($1, filesize),
        prefix = $2,
        thumbnail_u_r_l = NULL,
        url = $3,
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
      WHERE id = $4
    `,
    [
      originalFilesize,
      targetPrefix,
      `/api/media/file/${encodeURIComponent(row.filename)}?prefix=${encodeURIComponent(targetPrefix)}`,
      row.media_id,
    ],
  )
}

function buildTotals(entries: EntryResult[]) {
  return {
    compressedFiles: entries.reduce((sum, entry) => sum + (entry.compressed ?? 0), 0),
    dryRun: entries.filter((entry) => entry.action === 'dry-run').length,
    failed: entries.filter((entry) => entry.action === 'failed').length,
    rows: entries.length,
    skippedAlreadyR2: entries.filter((entry) => entry.action === 'skipped-already-r2').length,
    uploaded: entries.filter((entry) => entry.action === 'uploaded').length,
    uploadedFiles: entries.reduce((sum, entry) => sum + entry.uploaded, 0),
  }
}

function text(value: unknown) {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

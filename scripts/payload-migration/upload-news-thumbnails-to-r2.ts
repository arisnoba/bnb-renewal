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
  publishedFrom: string
  write: boolean
}

type NewsMediaRow = {
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

type EntryResult = {
  action: 'dry-run' | 'failed' | 'skipped-already-r2' | 'uploaded'
  currentPrefix: string | null
  files: UploadFile[]
  mediaId: number
  newsId: number
  targetPrefix: string
  title?: string
  uploaded: number
  error?: string
}

type SizeColumn = Extract<keyof NewsMediaRow, `sizes_${string}_filename`>

const ROLE_PREFIX = 'media/news/thumbnails'
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
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/news-thumbnail-r2-upload-report.json'
  let publishedFrom = '2020-01-01'
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

    if (arg === '--published-from') {
      publishedFrom = readRequiredValue(args, index, '--published-from')

      if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedFrom)) {
        throw new Error(`--published-from 값은 YYYY-MM-DD 형식이어야 합니다: ${publishedFrom}`)
      }

      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, limit, outputPath, publishedFrom, write }
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
  const files = buildUploadFiles(row, targetPrefix)
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

  if (row.prefix === targetPrefix) {
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
    for (const file of files) {
      await uploadR2Object({
        body: await fs.readFile(file.localPath),
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: contentTypeFor(file.filename),
        key: file.objectKey,
      })
      base.uploaded += 1
    }

    await pool.query('UPDATE media SET prefix = $1, updated_at = NOW() WHERE id = $2', [
      targetPrefix,
      row.media_id,
    ])

    return base
  } catch (error) {
    return {
      ...base,
      action: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildUploadFiles(row: NewsMediaRow, targetPrefix: string): UploadFile[] {
  const filenames = [
    { filename: row.filename, sizeName: 'original' },
    ...SIZE_COLUMNS.flatMap((item) => {
      const filename = row[item.column]
      return filename ? [{ filename, sizeName: item.name }] : []
    }),
  ]

  return filenames.map((file) => ({
    filename: file.filename,
    localPath: resolveProjectPath('public/media', file.filename),
    objectKey: path.posix.join(targetPrefix, file.filename),
    sizeName: file.sizeName,
  }))
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

function buildTotals(entries: EntryResult[]) {
  return {
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

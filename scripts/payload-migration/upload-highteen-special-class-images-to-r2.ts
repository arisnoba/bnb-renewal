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
  outputPath: string
  write: boolean
}

type MediaRow = {
  highteen_special_class_id: number
  filename: string
  media_id: number
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

type Entry = {
  currentPrefix: string | null
  files: UploadFile[]
  highteenSpecialClassId: number
  mediaId: number
  status: 'dry-run' | 'failed' | 'uploaded'
  targetPrefix: string
  title: string | null
  uploaded: number
  error?: string
}

const MEDIA_PREFIX = 'media/highteen-special-classes/images'
const MEDIA_LINK_REPORT = 'tmp/legacy-assets/highteen-special-class-media-link-report.json'

const SIZE_COLUMNS: Array<{ column: keyof Pick<
  MediaRow,
  | 'sizes_large_filename'
  | 'sizes_medium_filename'
  | 'sizes_og_filename'
  | 'sizes_small_filename'
  | 'sizes_square_filename'
  | 'sizes_thumbnail_filename'
  | 'sizes_xlarge_filename'
>; name: string }> = [
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
    const rows = await readRows(pool)
    const entries: Entry[] = []

    for (const row of rows) {
      entries.push(await processRow({ options, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      entries,
      generatedAt: new Date().toISOString(),
      objectKeySamples: entries.flatMap((entry) => entry.files.map((file) => file.objectKey)).slice(0, 8),
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
  let outputPath = 'tmp/legacy-assets/highteen-special-class-r2-upload-report.json'
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }
  }

  return { dryRun, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readRows(pool: Pool) {
  const classIdByMediaId = await readClassIdByMediaId()
  const mediaIds = [...classIdByMediaId.keys()]

  if (mediaIds.length === 0) {
    return []
  }

  const media = await pool.query<Omit<MediaRow, 'highteen_special_class_id' | 'title'> & { title: string | null }>(
    `
      SELECT
        media.id AS media_id,
        media.filename,
        media.prefix,
        media.sizes_thumbnail_filename,
        media.sizes_square_filename,
        media.sizes_small_filename,
        media.sizes_medium_filename,
        media.sizes_large_filename,
        media.sizes_xlarge_filename,
        media.sizes_og_filename,
        highteen_special_classes.title
      FROM media
      LEFT JOIN highteen_special_classes
        ON highteen_special_classes.thumbnail_media_id = media.id
      WHERE media.id = ANY($1::int[])
      ORDER BY media.id
    `,
    [mediaIds],
  )

  return media.rows.map((row) => ({
    ...row,
    highteen_special_class_id: classIdByMediaId.get(row.media_id) ?? 0,
  }))
}

async function readClassIdByMediaId() {
  const raw = await fs.readFile(resolveProjectPath(MEDIA_LINK_REPORT), 'utf8')
  const parsed = JSON.parse(raw) as {
    rows?: Array<{
      highteenSpecialClassId?: number
      mediaId?: number
    }>
  }
  const map = new Map<number, number>()

  for (const row of parsed.rows ?? []) {
    if (Number.isFinite(row.mediaId) && Number.isFinite(row.highteenSpecialClassId)) {
      map.set(Number(row.mediaId), Number(row.highteenSpecialClassId))
    }
  }

  return map
}

async function processRow({ options, pool, row }: { options: Options; pool: Pool; row: MediaRow }) {
  const targetPrefix = `${MEDIA_PREFIX}/${row.highteen_special_class_id}`
  const files = buildUploadFiles(row, targetPrefix)
  const entry: Entry = {
    currentPrefix: row.prefix,
    files,
    highteenSpecialClassId: row.highteen_special_class_id,
    mediaId: row.media_id,
    status: options.dryRun ? 'dry-run' : 'uploaded',
    targetPrefix,
    title: row.title,
    uploaded: 0,
  }

  if (options.dryRun) {
    return entry
  }

  try {
    for (const file of files) {
      const body = await fs.readFile(file.localPath)
      await uploadR2Object({
        body,
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: contentTypeFor(file.filename),
        key: file.objectKey,
      })
      entry.uploaded += 1
    }

    await pool.query('UPDATE media SET prefix = $1, updated_at = NOW() WHERE id = $2', [
      targetPrefix,
      row.media_id,
    ])

    return entry
  } catch (error) {
    entry.status = 'failed'
    entry.error = error instanceof Error ? error.message : String(error)
    return entry
  }
}

function buildUploadFiles(row: MediaRow, targetPrefix: string): UploadFile[] {
  const fileNames = [{ filename: row.filename, sizeName: 'original' }]

  for (const item of SIZE_COLUMNS) {
    const filename = row[item.column]

    if (filename) {
      fileNames.push({ filename, sizeName: item.name })
    }
  }

  return fileNames.map((file) => ({
    filename: file.filename,
    localPath: resolveProjectPath('public/media', file.filename),
    objectKey: path.posix.join(targetPrefix, file.filename),
    sizeName: file.sizeName,
  }))
}

function contentTypeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

function buildTotals(entries: Entry[]) {
  return {
    failed: entries.filter((entry) => entry.status === 'failed').length,
    files: entries.reduce((sum, entry) => sum + entry.files.length, 0),
    rows: entries.length,
    uploadedFiles: entries.reduce((sum, entry) => sum + entry.uploaded, 0),
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

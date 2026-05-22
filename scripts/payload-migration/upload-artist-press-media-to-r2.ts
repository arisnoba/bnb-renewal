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

type Role = 'agency-logo' | 'thumbnail'

type Options = {
  dryRun: boolean
  outputPath: string
  roles: Role[]
  write: boolean
}

type MediaRow = {
  artist_press_id: number
  filename: string
  media_id: number
  prefix: string | null
  role: Role
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
  artistPressId: number
  currentPrefix: string | null
  files: UploadFile[]
  mediaId: number
  role: Role
  status: 'dry-run' | 'failed' | 'uploaded'
  targetPrefix: string
  title: string | null
  uploaded: number
  error?: string
}

type SizeColumn = Extract<keyof MediaRow, `sizes_${string}_filename`>

const ROLE_PREFIX: Record<Role, string> = {
  'agency-logo': 'media/artist-press/agency-logos',
  thumbnail: 'media/artist-press/thumbnails',
}

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
    const rows = await readRows(pool, options.roles)
    const entries: Entry[] = []

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
      roles: options.roles,
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
  let outputPath = 'tmp/legacy-assets/artist-press-r2-upload-report.json'
  let roles: Role[] = ['thumbnail', 'agency-logo']
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

    if (arg === '--roles') {
      roles = readRequiredValue(args, index, '--roles')
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean)
        .map(toRole)
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }
  }

  if (roles.length === 0) {
    throw new Error('업로드할 role 이 없습니다.')
  }

  return { dryRun, outputPath, roles, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

function toRole(value: string): Role {
  if (value === 'thumbnail' || value === 'agency-logo') {
    return value
  }

  throw new Error(`알 수 없는 artist-press media role 입니다: ${value}`)
}

async function readRows(pool: Pool, roles: Role[]) {
  const selects: string[] = []

  if (roles.includes('thumbnail')) {
    selects.push(`
      SELECT
        'thumbnail'::text AS role,
        artist_press.id AS artist_press_id,
        artist_press.title,
        media.id AS media_id,
        media.*
      FROM artist_press
      JOIN media ON media.id = artist_press.thumbnail_media_id
    `)
  }

  if (roles.includes('agency-logo')) {
    selects.push(`
      SELECT
        'agency-logo'::text AS role,
        artist_press.id AS artist_press_id,
        artist_press.title,
        media.id AS media_id,
        media.*
      FROM artist_press
      JOIN media ON media.id = artist_press.agency_logo_media_id
    `)
  }

  const result = await pool.query<MediaRow>(`
    ${selects.join('\nUNION ALL\n')}
    ORDER BY role, artist_press_id
  `)

  return result.rows
}

async function processRow({ options, pool, row }: { options: Options; pool: Pool; row: MediaRow }) {
  const targetPrefix = `${ROLE_PREFIX[row.role]}/${row.artist_press_id}`
  const files = buildUploadFiles(row, targetPrefix)
  const entry: Entry = {
    artistPressId: row.artist_press_id,
    currentPrefix: row.prefix,
    files,
    mediaId: row.media_id,
    role: row.role,
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

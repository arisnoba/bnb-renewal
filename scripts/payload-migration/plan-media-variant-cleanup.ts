import path from 'node:path'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type CleanupMode = 'all' | 'body-images' | 'below-threshold' | 'policy'

type Options = {
  belowBytes: number
  ids: string[]
  limit: 'all' | number
  mode: CleanupMode
  outputPath: string
  prefix?: string
}

type MediaVariantRow = {
  filesize: number | string | null
  filename: string | null
  id: number
  prefix: string | null
  sizes_large_filename: string | null
  sizes_medium_filename: string | null
  sizes_og_filename: string | null
  sizes_small_filename: string | null
  sizes_square_filename: string | null
  sizes_thumbnail_filename: string | null
  sizes_xlarge_filename: string | null
}

type VariantFile = {
  objectKey: string
  sizeName: SizeName
}

type CleanupEntry = {
  cleanupReasons: string[]
  dbColumnsToNull: string[]
  filesize: number
  id: number
  originalFilename: string
  prefix: string
  variantFiles: VariantFile[]
}

type SizeName = 'large' | 'medium' | 'og' | 'small' | 'square' | 'thumbnail' | 'xlarge'

const DEFAULT_BELOW_BYTES = 1024 * 1024
const SIZE_COLUMNS: Array<{ column: keyof MediaVariantRow; dbPrefix: string; name: SizeName }> = [
  { column: 'sizes_thumbnail_filename', dbPrefix: 'sizes_thumbnail', name: 'thumbnail' },
  { column: 'sizes_square_filename', dbPrefix: 'sizes_square', name: 'square' },
  { column: 'sizes_small_filename', dbPrefix: 'sizes_small', name: 'small' },
  { column: 'sizes_medium_filename', dbPrefix: 'sizes_medium', name: 'medium' },
  { column: 'sizes_large_filename', dbPrefix: 'sizes_large', name: 'large' },
  { column: 'sizes_xlarge_filename', dbPrefix: 'sizes_xlarge', name: 'xlarge' },
  { column: 'sizes_og_filename', dbPrefix: 'sizes_og', name: 'og' },
]
const SIZE_DB_SUFFIXES = ['url', 'width', 'height', 'mime_type', 'filesize', 'filename']

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  logDbTargetInfo(target, { destructive: false })

  const pool = new Pool({ connectionString })

  try {
    const rows = await readVariantRows(pool, options)
    const entries = rows.map((row) => toCleanupEntry(row, options)).filter((entry) => entry.variantFiles.length > 0)
    const output = {
      destructive: false,
      entries,
      generatedAt: new Date().toISOString(),
      mode: options.mode,
      objectKeySamples: entries.flatMap((entry) => entry.variantFiles.map((file) => file.objectKey)).slice(0, 20),
      options,
      totals: buildTotals(entries),
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
  let belowBytes = DEFAULT_BELOW_BYTES
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let mode: CleanupMode = 'policy'
  let outputPath = 'tmp/legacy-assets/media-variant-cleanup-plan.json'
  let prefix: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--below-mb') {
      belowBytes = Math.round(parseNonNegativeNumber(readRequiredValue(args, index, '--below-mb'), '--below-mb') * 1024 * 1024)
      index += 1
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

    if (arg === '--mode') {
      mode = parseMode(readRequiredValue(args, index, '--mode'))
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--prefix') {
      prefix = readRequiredValue(args, index, '--prefix').replace(/^\/+|\/+$/g, '')
      index += 1
      continue
    }
  }

  return { belowBytes, ids, limit, mode, outputPath, prefix }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

function parseMode(value: string): CleanupMode {
  if (value === 'all' || value === 'body-images' || value === 'below-threshold' || value === 'policy') {
    return value
  }

  throw new Error(`--mode 값은 all, body-images, below-threshold, policy 중 하나여야 합니다: ${value}`)
}

function parseNonNegativeNumber(value: string, name: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} 값은 0 이상 숫자여야 합니다: ${value}`)
  }

  return parsed
}

function parsePositiveInt(value: string, name: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} 값은 양의 정수여야 합니다: ${value}`)
  }

  return parsed
}

async function readVariantRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = [
    `(${SIZE_COLUMNS.map((item) => `media.${item.column} IS NOT NULL`).join(' OR ')})`,
  ]

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`media.id::text = ANY($${params.length}::text[])`)
  }

  if (options.prefix) {
    params.push(options.prefix)
    const exactParam = params.length
    params.push(`${options.prefix}/%`)
    const likeParam = params.length
    where.push(`(media.prefix = $${exactParam} OR media.prefix LIKE $${likeParam})`)
  }

  const modeCondition = cleanupModeCondition(options, params)

  if (modeCondition) {
    where.push(modeCondition)
  }

  const limitSql = options.limit === 'all' ? '' : `LIMIT ${options.limit}`
  const result = await pool.query<MediaVariantRow>(
    `
      SELECT
        media.id,
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
      FROM media
      WHERE ${where.join(' AND ')}
      ORDER BY media.id ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

function cleanupModeCondition(options: Options, params: unknown[]) {
  if (options.mode === 'all') {
    return ''
  }

  if (options.mode === 'body-images') {
    return `media.prefix LIKE '%/body-images/%'`
  }

  params.push(options.belowBytes)
  const belowThreshold = `COALESCE(media.filesize, 0) < $${params.length}`

  if (options.mode === 'below-threshold') {
    return belowThreshold
  }

  return `(${belowThreshold} OR media.prefix LIKE '%/body-images/%')`
}

function toCleanupEntry(row: MediaVariantRow, options: Options): CleanupEntry {
  const prefix = normalizePrefix(row.prefix)
  const filesize = Number(row.filesize ?? 0)
  const variantFiles = SIZE_COLUMNS.flatMap((item) => {
    const filename = stringValue(row[item.column])

    return filename
      ? [
          {
            objectKey: path.posix.join(prefix, filename),
            sizeName: item.name,
          },
        ]
      : []
  })

  return {
    cleanupReasons: cleanupReasons({ filesize, options, prefix }),
    dbColumnsToNull: dbColumnsToNull(),
    filesize,
    id: row.id,
    originalFilename: stringValue(row.filename),
    prefix,
    variantFiles,
  }
}

function cleanupReasons({
  filesize,
  options,
  prefix,
}: {
  filesize: number
  options: Options
  prefix: string
}) {
  const reasons: string[] = []

  if (filesize < options.belowBytes) {
    reasons.push('below-threshold')
  }

  if (prefix.includes('/body-images/')) {
    reasons.push('body-images-original-only')
  }

  if (options.mode === 'all') {
    reasons.push('all')
  }

  return reasons
}

function normalizePrefix(value: unknown) {
  return String(value || 'media').replace(/^\/+|\/+$/g, '')
}

function stringValue(value: unknown) {
  return String(value ?? '').trim()
}

function dbColumnsToNull() {
  return SIZE_COLUMNS.flatMap((item) => SIZE_DB_SUFFIXES.map((suffix) => `${item.dbPrefix}_${suffix}`))
}

function buildTotals(entries: CleanupEntry[]) {
  const uniqueObjectKeys = new Set(entries.flatMap((entry) => entry.variantFiles.map((file) => file.objectKey)))

  return {
    dbColumnsToNull: dbColumnsToNull().length,
    mediaRows: entries.length,
    variantObjects: entries.reduce((sum, entry) => sum + entry.variantFiles.length, 0),
    variantObjectsUnique: uniqueObjectKeys.size,
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Pool } from 'pg'

import { uploadR2Object } from '../../src/lib/r2'
import {
  buildCompactR2MediaFilename,
  buildR2MediaObjectKey,
  getR2MediaPrefix,
  type R2MediaRole,
} from '../../src/lib/r2ObjectKeys'
import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Mode = 'all' | 'gallery' | 'posters'

type Options = {
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  mode: Mode
  outputPath: string
  write: boolean
}

type GalleryRow = {
  id: number
  name: string | null
  photo_image1: string | null
  photo_image2: string | null
  photo_image3: string | null
  photo_image4: string | null
  photo_image5: string | null
  photo_image6: string | null
}

type PosterRow = {
  poster_media_id: number | null
  poster_path: string | null
  teacher_id: number
  teacher_name: string | null
  title: string | null
  work_id: string
}

type GalleryResult = {
  action: 'dry-run' | 'skipped-already-r2' | 'unresolved-local-file' | 'uploaded-and-linked'
  column: GalleryColumn
  error?: string
  localPath?: string
  objectKey?: string
  sourcePath: string
  teacherId: number
  teacherName?: string
}

type PosterResult = {
  action:
    | 'created-media-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'unresolved-local-file'
  localPath?: string
  mediaId?: number
  objectKey?: string
  posterPath?: string
  teacherId: number
  teacherName?: string
  title?: string
  workId: string
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

type GalleryColumn =
  | 'photo_image1'
  | 'photo_image2'
  | 'photo_image3'
  | 'photo_image4'
  | 'photo_image5'
  | 'photo_image6'

const galleryColumns: GalleryColumn[] = [
  'photo_image1',
  'photo_image2',
  'photo_image3',
  'photo_image4',
  'photo_image5',
  'photo_image6',
]

const galleryRole: R2MediaRole = 'teachers.gallery-image'
const posterRole: R2MediaRole = 'teachers.representative-work-poster'

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
  const payload = options.write && shouldRunPosters(options) ? await getPayloadForWrite() : undefined

  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  const galleryResults: GalleryResult[] = []
  const posterResults: PosterResult[] = []

  try {
    if (shouldRunGallery(options)) {
      const galleryRows = await readGalleryRows(pool, options)

      for (const row of galleryRows) {
        for (const column of galleryColumns) {
          const sourcePath = text(row[column])

          if (!sourcePath) continue
          galleryResults.push(await processGalleryImage({ column, options, pool, row, sourcePath }))
        }
      }
    }

    if (shouldRunPosters(options)) {
      const posterRows = await readPosterRows(pool, options)

      for (const row of posterRows) {
        posterResults.push(await processPoster({ options, payload, pool, row }))
      }
    }

    const output = {
      dryRun: options.dryRun,
      gallery: {
        objectKeySamples: galleryResults.flatMap((result) => result.objectKey ?? []).slice(0, 10),
        rows: galleryResults,
        totals: buildTotals(galleryResults),
      },
      generatedAt: new Date().toISOString(),
      options,
      posters: {
        objectKeySamples: posterResults.flatMap((result) => result.objectKey ?? []).slice(0, 10),
        rows: posterResults,
        totals: buildTotals(posterResults),
      },
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          gallery: {
            objectKeySamples: output.gallery.objectKeySamples,
            totals: output.gallery.totals,
          },
          outputPath: options.outputPath,
          posters: {
            objectKeySamples: output.posters.objectKeySamples,
            totals: output.posters.totals,
          },
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
  let mode: Mode = 'all'
  let outputPath = 'tmp/legacy-assets/teacher-gallery-posters-r2-sync-report.json'
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

    if (arg === '--mode') {
      const value = readRequiredValue(args, index, '--mode')

      if (value !== 'all' && value !== 'gallery' && value !== 'posters') {
        throw new Error('`--mode` 값은 all, gallery, posters 중 하나여야 합니다.')
      }

      mode = value
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, limit, mode, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

function shouldRunGallery(options: Options) {
  return options.mode === 'all' || options.mode === 'gallery'
}

function shouldRunPosters(options: Options) {
  return options.mode === 'all' || options.mode === 'posters'
}

async function readGalleryRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where: string[] = [
    galleryColumns.map((column) => `NULLIF(TRIM(COALESCE(${column}, '')), '') IS NOT NULL`).join(' OR '),
  ]

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<GalleryRow>(
    `
      SELECT id, name, ${galleryColumns.join(', ')}
      FROM teachers
      WHERE ${where.map((item) => `(${item})`).join(' AND ')}
      ORDER BY id ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

async function readPosterRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = [
    "NULLIF(TRIM(COALESCE(w.poster_path, '')), '') IS NOT NULL",
    'w.poster_media_id IS NULL',
  ]

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`t.id::text = ANY($${params.length}::text[])`)
  }

  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<PosterRow>(
    `
      SELECT
        w.id AS work_id,
        w.poster_path,
        w.poster_media_id,
        w.title,
        t.id AS teacher_id,
        t.name AS teacher_name
      FROM teachers_representative_works w
      JOIN teachers t ON t.id = w._parent_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.id ASC, w._order ASC
      ${limitSql}
    `,
    params,
  )

  return result.rows
}

async function processGalleryImage({
  column,
  options,
  pool,
  row,
  sourcePath,
}: {
  column: GalleryColumn
  options: Options
  pool: Pool
  row: GalleryRow
  sourcePath: string
}) {
  const base = {
    column,
    sourcePath,
    teacherId: row.id,
    teacherName: text(row.name),
  }

  if (sourcePath.startsWith(`${getR2MediaPrefix(galleryRole)}/`)) {
    return { ...base, action: 'skipped-already-r2' as const, objectKey: sourcePath }
  }

  const localPath = resolveLegacyLocalPath(sourcePath)

  if (!localPath || !(await fileExists(resolveProjectPath(localPath)))) {
    return { ...base, action: 'unresolved-local-file' as const, localPath }
  }

  const objectKey = buildR2MediaObjectKey({
    filename: buildCompactR2MediaFilename({
      filename: path.basename(localPath),
      role: galleryRole,
      sizeName: column.replace('photo_image', 'photo'),
      sourceId: row.id,
    }),
    prefix: getR2MediaPrefix(galleryRole),
    sourceId: row.id,
  })

  if (options.dryRun) {
    return { ...base, action: 'dry-run' as const, localPath, objectKey }
  }

  const buffer = await fs.readFile(resolveProjectPath(localPath))

  await uploadR2Object({
    body: buffer,
    cacheControl: 'public, max-age=31536000, immutable',
    contentType: contentTypeFromPath(localPath),
    key: objectKey,
  })
  await pool.query(`UPDATE teachers SET ${column} = $1, updated_at = NOW() WHERE id = $2`, [
    objectKey,
    row.id,
  ])

  return { ...base, action: 'uploaded-and-linked' as const, localPath, objectKey }
}

async function processPoster({
  options,
  payload,
  pool,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: PosterRow
}): Promise<PosterResult> {
  const base = {
    posterPath: text(row.poster_path),
    teacherId: row.teacher_id,
    teacherName: text(row.teacher_name),
    title: text(row.title),
    workId: row.work_id,
  }

  if (row.poster_media_id) {
    return { ...base, action: 'skipped-existing', mediaId: row.poster_media_id }
  }

  const localPath = resolveLegacyLocalPath(row.poster_path)

  if (!localPath || !(await fileExists(resolveProjectPath(localPath)))) {
    return { ...base, action: 'unresolved-local-file', localPath }
  }

  const filename = buildCompactR2MediaFilename({
    filename: path.basename(localPath),
    role: posterRole,
    sourceId: row.work_id,
  })
  const targetPrefix = `${getR2MediaPrefix(posterRole)}/${row.teacher_id}`
  const objectKey = `${targetPrefix}/${filename}`
  const existingMediaId = await findExistingMediaId(pool, filename)

  if (options.dryRun) {
    return {
      ...base,
      action: 'dry-run',
      localPath,
      mediaId: existingMediaId,
      objectKey,
    }
  }

  if (!payload) {
    throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
  }

  const mediaId =
    existingMediaId ??
    (await createMediaFromLocalFile({
      alt: [row.teacher_name, row.title].map(text).filter(Boolean).join(' - ') || filename,
      filename,
      localPath,
      payload,
      prefix: targetPrefix,
    }))

  await pool.query(
    `UPDATE teachers_representative_works SET poster_media_id = $1 WHERE id = $2`,
    [mediaId, row.work_id],
  )

  return {
    ...base,
    action: existingMediaId ? 'linked-existing-media' : 'created-media-and-linked',
    localPath,
    mediaId,
    objectKey,
  }
}

async function createMediaFromLocalFile({
  alt,
  filename,
  localPath,
  payload,
  prefix,
}: {
  alt: string
  filename: string
  localPath: string
  payload: DynamicPayload
  prefix: string
}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bnb-teacher-media-'))
  const tempPath = path.join(tempDir, filename)
  let id: number | undefined

  try {
    await fs.copyFile(resolveProjectPath(localPath), tempPath)
    const created = await payload.create({
      collection: 'media',
      data: {
        alt,
        prefix,
      },
      filePath: tempPath,
      overrideAccess: true,
    })
    id = Number(created.id)

    if (!Number.isFinite(id)) {
      throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
    }
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true })
  }

  if (id === undefined) {
    throw new Error('media 생성 후 id를 확인할 수 없습니다.')
  }

  return id
}

async function findExistingMediaId(pool: Pool, filename: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1',
    [filename],
  )

  return result.rows[0]?.id
}

function resolveLegacyLocalPath(value: string | null | undefined) {
  const trimmed = text(value)

  if (!trimmed) {
    return ''
  }

  let pathname = trimmed

  try {
    pathname = new URL(trimmed).pathname
  } catch {
    pathname = trimmed
  }

  const publicPath = pathname.startsWith('/legacy/')
    ? pathname
    : pathname.startsWith('legacy/')
      ? `/${pathname}`
      : ''

  if (!publicPath) {
    return ''
  }

  return path.posix.join('public', ...publicPath.split('/').filter(Boolean))
}

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath)

    return stat.isFile()
  } catch {
    return false
  }
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const payload = await getPayload({ config: configPromise })

  return payload as unknown as DynamicPayload
}

function contentTypeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.avif') return 'image/avif'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.webp') return 'image/webp'

  return 'application/octet-stream'
}

function buildTotals<T extends { action: string }>(rows: T[]) {
  return rows.reduce<Record<string, number>>(
    (totals, row) => ({
      ...totals,
      [row.action]: (totals[row.action] ?? 0) + 1,
      total: totals.total + 1,
    }),
    { total: 0 },
  )
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  ids: string[]
  limit: 'all' | number
  outputPath: string
}

type ManifestEntry = {
  collection: 'teachers' | 'teachers_gallery'
  column: string
  ftpRemotePath: string
  id: string
  localPath: string
  normalizedUrl: string
  sourcePath: string
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const entries = await buildManifest(pool, options)

    await writeJsonFile(resolveProjectPath(options.outputPath), {
      entries,
      generatedAt: new Date().toISOString(),
      totals: {
        entries: entries.length,
        uniqueSourcePaths: new Set(entries.map((entry) => entry.sourcePath)).size,
      },
    })

    console.log(
      JSON.stringify(
        {
          entries: entries.length,
          outputPath: options.outputPath,
          uniqueSourcePaths: new Set(entries.map((entry) => entry.sourcePath)).size,
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
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/c0/teacher-image-manifest.json'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--ids') {
      ids = readRequiredValue(args, index, '--ids')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--limit') {
      const nextArg = readRequiredValue(args, index, '--limit')

      if (nextArg === 'all') {
        limit = 'all'
        index += 1
        continue
      }

      const parsed = Number(nextArg)

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${nextArg}`)
      }

      limit = parsed
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
    }
  }

  return { ids, limit, outputPath }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function buildManifest(pool: Pool, options: Options): Promise<ManifestEntry[]> {
  const teachers = await readTeachers(pool, options)
  const gallery = await readTeacherGallery(pool, options)
  const entries: ManifestEntry[] = []

  for (const teacher of teachers) {
    for (const column of [
      'profile_image_path',
      'photo_image1',
      'photo_image2',
      'photo_image3',
      'photo_image4',
      'photo_image5',
      'photo_image6',
    ]) {
      const sourcePath = toImagePath(teacher[column])

      if (!sourcePath) {
        continue
      }

      entries.push(toManifestEntry({
        collection: 'teachers',
        column,
        id: String(teacher.id),
        sourcePath,
        title: String(teacher.name ?? ''),
      }))
    }
  }

  for (const item of gallery) {
    const sourcePath = toImagePath(item.path)

    if (!sourcePath) {
      continue
    }

    entries.push(toManifestEntry({
      collection: 'teachers_gallery',
      column: 'path',
      id: String(item.id),
      sourcePath,
      title: item.teacher_name ? String(item.teacher_name) : undefined,
    }))
  }

  const uniqueEntries = dedupeManifestEntries(entries)
  return options.limit === 'all' ? uniqueEntries : uniqueEntries.slice(0, options.limit)
}

async function readTeachers(pool: Pool, options: Options) {
  const params: unknown[] = []
  const whereSql =
    options.ids.length > 0 ? ` WHERE "id"::text = ANY($${params.push(options.ids)}::text[])` : ''

  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT
        id,
        name,
        profile_image_path,
        photo_image1,
        photo_image2,
        photo_image3,
        photo_image4,
        photo_image5,
        photo_image6
      FROM teachers
      ${whereSql}
      ORDER BY id ASC
    `,
    params,
  )

  return result.rows
}

async function readTeacherGallery(pool: Pool, options: Options) {
  const params: unknown[] = []
  const whereSql =
    options.ids.length > 0
      ? ` WHERE "teachers_gallery"."_parent_id"::text = ANY($${params.push(options.ids)}::text[])`
      : ''

  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT
        teachers_gallery.id,
        teachers_gallery.path,
        teachers.name AS teacher_name
      FROM teachers_gallery
      LEFT JOIN teachers ON teachers.id = teachers_gallery._parent_id
      ${whereSql}
      ORDER BY teachers_gallery._parent_id ASC, teachers_gallery._order ASC
    `,
    params,
  )

  return result.rows
}

function toImagePath(value: unknown) {
  const path = String(value ?? '').trim()

  if (!path || /^https?:\/\//i.test(path)) {
    return undefined
  }

  if (!/\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(path)) {
    return undefined
  }

  return path.replace(/^\/+/, '')
}

function toManifestEntry(input: {
  collection: ManifestEntry['collection']
  column: string
  id: string
  sourcePath: string
  title?: string
}): ManifestEntry {
  const sourcePath = input.sourcePath

  return {
    collection: input.collection,
    column: input.column,
    ftpRemotePath: `web/data/teacher/${sourcePath}`,
    id: input.id,
    localPath: `tmp/c0/images/teachers/${sourcePath}`,
    normalizedUrl: `https://www.baewoo.co.kr/web/data/teacher/${sourcePath}`,
    sourcePath,
    title: input.title,
  }
}

function dedupeManifestEntries(entries: ManifestEntry[]) {
  const seen = new Set<string>()
  const deduped: ManifestEntry[] = []

  for (const entry of entries) {
    const key = `${entry.collection}:${entry.column}:${entry.id}:${entry.sourcePath}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(entry)
  }

  return deduped
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

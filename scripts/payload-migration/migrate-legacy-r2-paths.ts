import path from 'node:path'

import { Pool, type PoolClient } from 'pg'

import {
  copyR2Object,
  destroyR2Client,
  hasR2Config,
  listR2Objects,
  type R2ObjectSummary,
} from '../../src/lib/r2'
import {
  assertFolderedR2MediaObjectKey,
  getR2MediaPrefix,
  normalizeR2ObjectKey,
} from '../../src/lib/r2ObjectKeys'
import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  outputPath: string
  progressEvery: number
  write: boolean
}

type ProfileRow = {
  id: number | string
  photo_image1: string | null
  photo_image2: string | null
  photo_image3: string | null
  photo_image4: string | null
  photo_image5: string | null
  photo_image6: string | null
  profile_image_path: string | null
  profile_media_filename: string | null
  profile_media_prefix: string | null
}

type ProfileVersionRow = {
  id: number | string
  parent_id: number | string
  version_photo_image1: string | null
  version_photo_image2: string | null
  version_photo_image3: string | null
  version_photo_image4: string | null
  version_photo_image5: string | null
  version_photo_image6: string | null
  version_profile_image_path: string | null
  profile_media_filename: string | null
  profile_media_prefix: string | null
}

type ScreenAppearanceRow = {
  id: number | string
  profile_image_path: string | null
  profile_media_filename: string | null
  profile_media_prefix: string | null
  thumbnail_path: string | null
  thumbnail_media_filename: string | null
  thumbnail_media_prefix: string | null
}

type TeacherWorkRow = {
  id: number | string
  poster_media_filename: string | null
  poster_media_prefix: string | null
  poster_path: string | null
}

type DatabaseUpdate = {
  column: string
  fromValue: string
  id: number | string
  idColumn: string
  table: string
  toValue: string
}

type CopyPlan = {
  fromKey: string
  profileId: number | string
  toKey: string
}

type MigrationPlan = {
  copies: CopyPlan[]
  updates: DatabaseUpdate[]
}

type CopyResult = CopyPlan & {
  action: 'already-copied' | 'copied'
  size?: number
}

const DEFAULT_OUTPUT_PATH = 'tmp/legacy-assets/legacy-r2-path-migration-plan.json'
const galleryColumns = [
  'photo_image1',
  'photo_image2',
  'photo_image3',
  'photo_image4',
  'photo_image5',
  'photo_image6',
] as const
const profileVersionGalleryColumns = [
  'version_photo_image1',
  'version_photo_image2',
  'version_photo_image3',
  'version_photo_image4',
  'version_photo_image5',
  'version_photo_image6',
] as const

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  logDbTargetInfo(target, { destructive: options.write })

  if (!hasR2Config()) {
    throw new Error(
      'legacy R2 경로 전환에는 R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET, R2_PUBLIC_BASE_URL 환경변수가 필요합니다.'
    )
  }

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB/R2 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  const pool = new Pool({ connectionString, max: 4 })

  try {
    const plan = await buildMigrationPlan(pool)
    const legacyObjects = await listR2Objects('legacy/')
    const galleryObjects = await listR2Objects(`${getR2MediaPrefix('profiles.gallery-image')}/`)
    const validation = validateCopyPlan({
      copies: plan.copies,
      galleryObjects,
      legacyObjects,
    })

    let copyResults: CopyResult[] = []
    let updatedPaths = 0

    if (options.write) {
      copyResults = await executeCopies({
        copies: plan.copies,
        galleryObjects,
        legacyObjects,
        progressEvery: options.progressEvery,
      })
      await verifyCopiedObjects(plan.copies, legacyObjects)
      updatedPaths = await executeDatabaseUpdates(pool, plan.updates)
    }

    const verification = await verifyDatabasePaths(pool)
    const outputPath =
      options.write && options.outputPath === DEFAULT_OUTPUT_PATH
        ? 'tmp/legacy-assets/legacy-r2-path-migration-write-report.json'
        : options.outputPath
    const output = {
      copySamples: plan.copies.slice(0, 20),
      destructive: options.write,
      generatedAt: new Date().toISOString(),
      options,
      sourceDeletionPerformed: false,
      totals: {
        alreadyCopiedObjects: validation.alreadyCopiedObjects,
        copiedObjects: copyResults.filter((result) => result.action === 'copied').length,
        databasePathUpdates: plan.updates.length,
        legacyR2Objects: legacyObjects.length,
        plannedCopies: plan.copies.length,
        requiredSourceBytes: validation.requiredSourceBytes,
        updatedPaths,
      },
      updateSamples: plan.updates.slice(0, 20),
      verification,
    }

    await writeJsonFile(resolveProjectPath(outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath,
          sourceDeletionPerformed: output.sourceDeletionPerformed,
          totals: output.totals,
          verification,
        },
        null,
        2
      )
    )
  } finally {
    await pool.end()
    destroyR2Client()
  }
}

function parseArgs(args: string[]): Options {
  let outputPath = DEFAULT_OUTPUT_PATH
  let progressEvery = 100
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      write = false
      continue
    }

    if (arg === '--output') {
      outputPath = requiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--progress-every') {
      const value = Number(requiredValue(args, index, '--progress-every'))

      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`잘못된 --progress-every 값입니다: ${String(value)}`)
      }

      progressEvery = value
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }

    throw new Error(`알 수 없는 인자입니다: ${arg}`)
  }

  return { outputPath, progressEvery, write }
}

function requiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function buildMigrationPlan(pool: Pool): Promise<MigrationPlan> {
  const copiesByTarget = new Map<string, CopyPlan>()
  const updates: DatabaseUpdate[] = []
  const [profiles, profileVersions, screenAppearances, teacherWorks] = await Promise.all([
    readProfiles(pool),
    readProfileVersions(pool),
    readScreenAppearances(pool),
    readTeacherWorks(pool),
  ])

  for (const row of profiles) {
    addMediaPathUpdate({
      column: 'profile_image_path',
      filename: row.profile_media_filename,
      fromValue: row.profile_image_path,
      id: row.id,
      prefix: row.profile_media_prefix,
      table: 'profiles',
      updates,
    })

    for (const column of galleryColumns) {
      addGalleryPathUpdate({
        column,
        copiesByTarget,
        fromValue: row[column],
        id: row.id,
        profileId: row.id,
        table: 'profiles',
        updates,
      })
    }
  }

  for (const row of profileVersions) {
    addMediaPathUpdate({
      column: 'version_profile_image_path',
      filename: row.profile_media_filename,
      fromValue: row.version_profile_image_path,
      id: row.id,
      prefix: row.profile_media_prefix,
      table: '_profiles_v',
      updates,
    })

    for (const column of profileVersionGalleryColumns) {
      addGalleryPathUpdate({
        column,
        copiesByTarget,
        fromValue: row[column],
        id: row.id,
        profileId: row.parent_id,
        table: '_profiles_v',
        updates,
      })
    }
  }

  for (const row of screenAppearances) {
    addMediaPathUpdate({
      column: 'profile_image_path',
      filename: row.profile_media_filename,
      fromValue: row.profile_image_path,
      id: row.id,
      prefix: row.profile_media_prefix,
      table: 'screen_appearances',
      updates,
    })
    addMediaPathUpdate({
      column: 'thumbnail_path',
      filename: row.thumbnail_media_filename,
      fromValue: row.thumbnail_path,
      id: row.id,
      prefix: row.thumbnail_media_prefix,
      table: 'screen_appearances',
      updates,
    })
  }

  for (const row of teacherWorks) {
    addMediaPathUpdate({
      column: 'poster_path',
      filename: row.poster_media_filename,
      fromValue: row.poster_path,
      id: row.id,
      prefix: row.poster_media_prefix,
      table: 'teachers_representative_works',
      updates,
    })
  }

  return {
    copies: [...copiesByTarget.values()].sort((left, right) =>
      left.toKey.localeCompare(right.toKey)
    ),
    updates,
  }
}

function addGalleryPathUpdate({
  column,
  copiesByTarget,
  fromValue,
  id,
  profileId,
  table,
  updates,
}: {
  column: string
  copiesByTarget: Map<string, CopyPlan>
  fromValue: string | null
  id: number | string
  profileId: number | string
  table: string
  updates: DatabaseUpdate[]
}) {
  const fromKey = legacyObjectKey(fromValue)

  if (!fromKey) {
    return
  }

  const filename = path.posix.basename(fromKey)
  const toKey = assertFolderedR2MediaObjectKey(
    path.posix.join(getR2MediaPrefix('profiles.gallery-image'), String(profileId), filename)
  )
  const existing = copiesByTarget.get(toKey)

  if (existing && existing.fromKey !== fromKey) {
    throw new Error(
      `서로 다른 legacy 객체가 같은 대상 key를 사용합니다: ${existing.fromKey}, ${fromKey} -> ${toKey}`
    )
  }

  copiesByTarget.set(toKey, { fromKey, profileId, toKey })
  updates.push({
    column,
    fromValue: fromValue?.trim() ?? '',
    id,
    idColumn: 'id',
    table,
    toValue: toKey,
  })
}

function addMediaPathUpdate({
  column,
  filename,
  fromValue,
  id,
  prefix,
  table,
  updates,
}: {
  column: string
  filename: string | null
  fromValue: string | null
  id: number | string
  prefix: string | null
  table: string
  updates: DatabaseUpdate[]
}) {
  if (!legacyObjectKey(fromValue)) {
    return
  }

  const toValue = mediaObjectKey(prefix, filename)

  if (!toValue) {
    throw new Error(`${table}.${column}의 legacy 대체 media를 찾지 못했습니다: id=${String(id)}`)
  }

  updates.push({
    column,
    fromValue: fromValue?.trim() ?? '',
    id,
    idColumn: 'id',
    table,
    toValue,
  })
}

function legacyObjectKey(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('legacy/') || trimmed.startsWith('/legacy/')) {
    return normalizeR2ObjectKey(trimmed)
  }

  try {
    const pathname = new URL(trimmed).pathname

    return pathname.startsWith('/legacy/') ? normalizeR2ObjectKey(pathname) : ''
  } catch {
    return ''
  }
}

function mediaObjectKey(prefix: string | null, filename: string | null) {
  const cleanFilename = filename?.trim()

  if (!cleanFilename) {
    return ''
  }

  return assertFolderedR2MediaObjectKey(path.posix.join(prefix?.trim() || 'media', cleanFilename))
}

async function readProfiles(pool: Pool) {
  const result = await pool.query<ProfileRow>(`
    SELECT
      p.id,
      p.profile_image_path,
      p.photo_image1,
      p.photo_image2,
      p.photo_image3,
      p.photo_image4,
      p.photo_image5,
      p.photo_image6,
      m.prefix AS profile_media_prefix,
      m.filename AS profile_media_filename
    FROM profiles p
    LEFT JOIN media m ON m.id = p.profile_image_media_id
    WHERE
      p.profile_image_path LIKE '%legacy/%'
      OR p.photo_image1 LIKE '%legacy/%'
      OR p.photo_image2 LIKE '%legacy/%'
      OR p.photo_image3 LIKE '%legacy/%'
      OR p.photo_image4 LIKE '%legacy/%'
      OR p.photo_image5 LIKE '%legacy/%'
      OR p.photo_image6 LIKE '%legacy/%'
    ORDER BY p.id ASC
  `)

  return result.rows
}

async function readProfileVersions(pool: Pool) {
  const result = await pool.query<ProfileVersionRow>(`
    SELECT
      v.id,
      v.parent_id,
      v.version_profile_image_path,
      v.version_photo_image1,
      v.version_photo_image2,
      v.version_photo_image3,
      v.version_photo_image4,
      v.version_photo_image5,
      v.version_photo_image6,
      m.prefix AS profile_media_prefix,
      m.filename AS profile_media_filename
    FROM _profiles_v v
    LEFT JOIN media m ON m.id = v.version_profile_image_media_id
    WHERE
      v.version_profile_image_path LIKE '%legacy/%'
      OR v.version_photo_image1 LIKE '%legacy/%'
      OR v.version_photo_image2 LIKE '%legacy/%'
      OR v.version_photo_image3 LIKE '%legacy/%'
      OR v.version_photo_image4 LIKE '%legacy/%'
      OR v.version_photo_image5 LIKE '%legacy/%'
      OR v.version_photo_image6 LIKE '%legacy/%'
    ORDER BY v.id ASC
  `)

  return result.rows
}

async function readScreenAppearances(pool: Pool) {
  const result = await pool.query<ScreenAppearanceRow>(`
    SELECT
      s.id,
      s.profile_image_path,
      profile_media.prefix AS profile_media_prefix,
      profile_media.filename AS profile_media_filename,
      s.thumbnail_path,
      thumbnail_media.prefix AS thumbnail_media_prefix,
      thumbnail_media.filename AS thumbnail_media_filename
    FROM screen_appearances s
    LEFT JOIN media profile_media ON profile_media.id = s.profile_image_media_id
    LEFT JOIN media thumbnail_media ON thumbnail_media.id = s.thumbnail_media_id
    WHERE
      s.profile_image_path LIKE '%legacy/%'
      OR s.thumbnail_path LIKE '%legacy/%'
    ORDER BY s.id ASC
  `)

  return result.rows
}

async function readTeacherWorks(pool: Pool) {
  const result = await pool.query<TeacherWorkRow>(`
    SELECT
      w.id,
      w.poster_path,
      m.prefix AS poster_media_prefix,
      m.filename AS poster_media_filename
    FROM teachers_representative_works w
    LEFT JOIN media m ON m.id = w.poster_media_id
    WHERE w.poster_path LIKE '%legacy/%'
    ORDER BY w.id ASC
  `)

  return result.rows
}

function validateCopyPlan({
  copies,
  galleryObjects,
  legacyObjects,
}: {
  copies: CopyPlan[]
  galleryObjects: R2ObjectSummary[]
  legacyObjects: R2ObjectSummary[]
}) {
  const sourceByKey = new Map(legacyObjects.map((object) => [object.key, object]))
  const targetByKey = new Map(galleryObjects.map((object) => [object.key, object]))
  let alreadyCopiedObjects = 0
  let requiredSourceBytes = 0

  for (const copy of copies) {
    const source = sourceByKey.get(copy.fromKey)

    if (!source) {
      throw new Error(`R2 legacy 원본 객체를 찾지 못했습니다: ${copy.fromKey}`)
    }

    requiredSourceBytes += source.size ?? 0
    const target = targetByKey.get(copy.toKey)

    if (!target) {
      continue
    }

    assertSameObjectMetadata(source, target, copy)
    alreadyCopiedObjects += 1
  }

  return { alreadyCopiedObjects, requiredSourceBytes }
}

async function executeCopies({
  copies,
  galleryObjects,
  legacyObjects,
  progressEvery,
}: {
  copies: CopyPlan[]
  galleryObjects: R2ObjectSummary[]
  legacyObjects: R2ObjectSummary[]
  progressEvery: number
}) {
  const sourceByKey = new Map(legacyObjects.map((object) => [object.key, object]))
  const targetByKey = new Map(galleryObjects.map((object) => [object.key, object]))
  const results: CopyResult[] = []
  const batchSize = 20

  for (let index = 0; index < copies.length; index += batchSize) {
    const batch = copies.slice(index, index + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (copy): Promise<CopyResult> => {
        const source = sourceByKey.get(copy.fromKey)

        if (!source) {
          throw new Error(`R2 legacy 원본 객체를 찾지 못했습니다: ${copy.fromKey}`)
        }

        const target = targetByKey.get(copy.toKey)

        if (target) {
          assertSameObjectMetadata(source, target, copy)
          return { ...copy, action: 'already-copied', size: source.size }
        }

        await copyR2Object({ fromKey: copy.fromKey, toKey: copy.toKey })
        return { ...copy, action: 'copied', size: source.size }
      })
    )

    results.push(...batchResults)
    const done = Math.min(index + batchSize, copies.length)

    if (done % progressEvery === 0 || done === copies.length) {
      console.log(
        JSON.stringify({
          alreadyCopied: results.filter((result) => result.action === 'already-copied').length,
          copied: results.filter((result) => result.action === 'copied').length,
          done,
          total: copies.length,
        })
      )
    }
  }

  return results
}

async function verifyCopiedObjects(copies: CopyPlan[], legacyObjects: R2ObjectSummary[]) {
  const sourceByKey = new Map(legacyObjects.map((object) => [object.key, object]))
  const targetObjects = await listR2Objects(`${getR2MediaPrefix('profiles.gallery-image')}/`)
  const targetByKey = new Map(targetObjects.map((object) => [object.key, object]))

  for (const copy of copies) {
    const source = sourceByKey.get(copy.fromKey)
    const target = targetByKey.get(copy.toKey)

    if (!source || !target) {
      throw new Error(`R2 복사 검증에 실패했습니다: ${copy.fromKey} -> ${copy.toKey}`)
    }

    assertSameObjectMetadata(source, target, copy)
  }
}

function assertSameObjectMetadata(
  source: R2ObjectSummary,
  target: R2ObjectSummary,
  copy: CopyPlan
) {
  const sourceEtag = source.etag?.replaceAll('"', '')
  const targetEtag = target.etag?.replaceAll('"', '')

  if (source.size !== target.size || (sourceEtag && targetEtag && sourceEtag !== targetEtag)) {
    throw new Error(`R2 대상 key에 다른 객체가 있습니다: ${copy.fromKey} -> ${copy.toKey}`)
  }
}

async function executeDatabaseUpdates(pool: Pool, updates: DatabaseUpdate[]) {
  const client = await pool.connect()
  let updated = 0

  try {
    await client.query('BEGIN')

    for (const update of updates) {
      updated += await executeDatabaseUpdate(client, update)
    }

    await client.query('COMMIT')
    return updated
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function executeDatabaseUpdate(client: PoolClient, update: DatabaseUpdate) {
  const result = await client.query(
    `
      UPDATE ${quoteIdentifier(update.table)}
      SET ${quoteIdentifier(update.column)} = $1
      WHERE ${quoteIdentifier(update.idColumn)} = $2
        AND ${quoteIdentifier(update.column)} = $3
    `,
    [update.toValue, update.id, update.fromValue]
  )

  if (result.rowCount !== 1) {
    throw new Error(
      `DB 경로 갱신 대상이 실행 중 변경되었습니다: ${update.table}.${update.column}, id=${String(update.id)}`
    )
  }

  return 1
}

async function verifyDatabasePaths(pool: Pool) {
  const checks = [
    ['profiles', 'profile_image_path'],
    ...galleryColumns.map((column) => ['profiles', column]),
    ['_profiles_v', 'version_profile_image_path'],
    ...profileVersionGalleryColumns.map((column) => ['_profiles_v', column]),
    ['screen_appearances', 'profile_image_path'],
    ['screen_appearances', 'thumbnail_path'],
    ['teachers_representative_works', 'poster_path'],
  ] as const
  const remaining: Record<string, number> = {}

  for (const [table, column] of checks) {
    const result = await pool.query<{ count: number }>(
      `
        SELECT COUNT(*)::int AS count
        FROM ${quoteIdentifier(table)}
        WHERE ${quoteIdentifier(column)} LIKE '%legacy/%'
      `
    )
    const count = result.rows[0]?.count ?? 0

    if (count > 0) {
      remaining[`${table}.${column}`] = count
    }
  }

  return {
    remainingLegacyPathFields: remaining,
    remainingLegacyPaths: Object.values(remaining).reduce((sum, count) => sum + count, 0),
  }
}

function quoteIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) {
    throw new Error(`잘못된 SQL 식별자입니다: ${value}`)
  }

  return `"${value}"`
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

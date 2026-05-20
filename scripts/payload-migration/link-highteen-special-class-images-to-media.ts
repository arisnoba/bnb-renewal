import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  dryRun: boolean
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  write: boolean
}

type ImageRole = 'gallery' | 'thumbnail'

type ImageRow = {
  gallery_image_id: string | null
  highteen_special_class_id: number
  image_path: string | null
  image_role: ImageRole
  media_id: number | null
  title: string | null
}

type MatchedImage = {
  fileName: string
  legacyPath: string
  localPath: string
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'created-media-from-repaired-file-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'skipped-no-image'
    | 'unresolved-local-file'
    | 'write-error'
  errorMessage?: string
  existingMediaId?: number | null
  galleryImageId?: string | null
  highteenSpecialClassId: number
  imageRole: ImageRole
  legacyPath?: string
  localPath?: string
  mediaId?: number
  title?: string
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

const MEDIA_PREFIX = 'media/highteen-special-classes/images'

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

  const payload = options.write ? await getPayloadForWrite() : undefined
  const results: RowResult[] = []

  try {
    const rows = await readRows(pool, options)

    for (const row of rows) {
      results.push(await processRow({ options, payload, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      rows: results,
      totals: buildTotals(results),
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          totals: output.totals,
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
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/highteen-special-class-media-link-report.json'
  let overwrite = false
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
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

    if (arg === '--overwrite') {
      overwrite = true
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, limit, outputPath, overwrite, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readRows(pool: Pool, options: Options) {
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<ImageRow>(
    `
      SELECT *
      FROM (
        SELECT
          highteen_special_classes.id AS highteen_special_class_id,
          highteen_special_classes.title,
          'thumbnail'::text AS image_role,
          NULL::text AS gallery_image_id,
          highteen_special_classes.thumbnail_path AS image_path,
          highteen_special_classes.thumbnail_media_id AS media_id
        FROM highteen_special_classes
        WHERE highteen_special_classes.thumbnail_path IS NOT NULL

        UNION ALL

        SELECT
          highteen_special_classes_gallery_images._parent_id AS highteen_special_class_id,
          highteen_special_classes.title,
          'gallery'::text AS image_role,
          highteen_special_classes_gallery_images.id AS gallery_image_id,
          highteen_special_classes_gallery_images.image_path,
          highteen_special_classes_gallery_images.image_media_id AS media_id
        FROM highteen_special_classes_gallery_images
        JOIN highteen_special_classes
          ON highteen_special_classes.id = highteen_special_classes_gallery_images._parent_id
        WHERE highteen_special_classes_gallery_images.image_path IS NOT NULL
      ) AS images
      ORDER BY highteen_special_class_id ASC, image_role DESC, gallery_image_id ASC
      ${limitSql}
    `,
  )

  return result.rows
}

async function processRow({
  options,
  payload,
  pool,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: ImageRow
}): Promise<RowResult> {
  const base = {
    existingMediaId: row.media_id,
    galleryImageId: row.gallery_image_id,
    highteenSpecialClassId: row.highteen_special_class_id,
    imageRole: row.image_role,
    title: text(row.title),
  }

  if (!options.overwrite && row.media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.media_id,
    }
  }

  const matched = matchImage(row.image_path)

  if (!matched) {
    return {
      ...base,
      action: 'skipped-no-image',
    }
  }

  const exists = await localFileExists(matched.localPath)

  if (!exists) {
    return {
      ...base,
      action: 'unresolved-local-file',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
    }
  }

  const existingMediaId = await findExistingMediaId(pool, matched.fileName)

  if (options.dryRun) {
    return {
      ...base,
      action: 'dry-run',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaId: existingMediaId,
    }
  }

  if (!payload) {
    throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
  }

  try {
    let repairedFilePath: string | undefined
    let repaired = false

    const mediaId =
      existingMediaId ??
      (await createMediaFromLocalFile({ matched, payload, title: text(row.title) }).catch(
        async (error: unknown) => {
          repairedFilePath = await repairImageForUpload(matched.localPath)
          repaired = true

          try {
            return await createMediaFromLocalFile({
              filePath: repairedFilePath,
              matched,
              payload,
              title: text(row.title),
            })
          } catch (repairError) {
            throw repairError instanceof Error ? repairError : error
          } finally {
            if (repairedFilePath) {
              await fs.unlink(repairedFilePath).catch(() => undefined)
            }
          }
        },
      ))

    await linkMedia(pool, row, mediaId)

    return {
      ...base,
      action: existingMediaId
        ? 'linked-existing-media'
        : repaired
          ? 'created-media-from-repaired-file-and-linked'
          : 'created-media-and-linked',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaId,
    }
  } catch (error) {
    return {
      ...base,
      action: 'write-error',
      errorMessage: error instanceof Error ? error.message : String(error),
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
    }
  }
}

function matchImage(value: string | undefined | null): MatchedImage | undefined {
  const legacyPath = normalizeLegacyPath(value)

  if (!legacyPath) {
    return undefined
  }

  const fileName = path.basename(legacyPath)

  if (!fileName) {
    return undefined
  }

  return {
    fileName,
    legacyPath,
    localPath: legacyPath.startsWith('/legacy/') ? `public${legacyPath}` : legacyPath.replace(/^\/+/, ''),
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE prefix = $1 AND filename = $2 ORDER BY id ASC LIMIT 1',
    [MEDIA_PREFIX, fileName],
  )

  return result.rows[0]?.id
}

async function createMediaFromLocalFile({
  filePath,
  matched,
  payload,
  title,
}: {
  filePath?: string
  matched: MatchedImage
  payload: DynamicPayload
  title?: string
}) {
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: title ?? matched.fileName,
      prefix: MEDIA_PREFIX,
    },
    filePath: filePath ?? resolveProjectPath(matched.localPath),
    overrideAccess: true,
  })
  const id = Number(created.id)

  if (!Number.isFinite(id)) {
    throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
  }

  return id
}

async function linkMedia(pool: Pool, row: ImageRow, mediaId: number) {
  if (row.image_role === 'thumbnail') {
    await pool.query(
      `
        UPDATE highteen_special_classes
        SET thumbnail_media_id = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [mediaId, row.highteen_special_class_id],
    )
    return
  }

  await pool.query(
    `
      UPDATE highteen_special_classes_gallery_images
      SET image_media_id = $1
      WHERE id = $2
    `,
    [mediaId, row.gallery_image_id],
  )
}

async function repairImageForUpload(localPath: string) {
  const { default: sharp } = await import('sharp')
  const repairedDir = path.join(os.tmpdir(), 'bnb-highteen-special-class-image-repair')
  const repairedPath = path.join(repairedDir, `${Date.now()}-${path.basename(localPath)}`)

  await fs.mkdir(repairedDir, { recursive: true })
  await sharp(resolveProjectPath(localPath), { failOn: 'none' }).jpeg({ quality: 90 }).toFile(repairedPath)

  return repairedPath
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

async function localFileExists(localPath: string) {
  try {
    const stat = await fs.stat(resolveProjectPath(localPath))
    return stat.isFile()
  } catch {
    return false
  }
}

function normalizeLegacyPath(value: string | undefined | null) {
  const current = text(value)

  if (!current) {
    return undefined
  }

  try {
    return new URL(current).pathname
  } catch {
    return current.startsWith('/') ? current : `/${current}`
  }
}

function text(value: unknown) {
  const trimmed = String(value ?? '').trim()

  return trimmed || undefined
}

function buildTotals(results: RowResult[]) {
  return results.reduce<Record<string, number>>((totals, row) => {
    totals[row.action] = (totals[row.action] ?? 0) + 1
    return totals
  }, {})
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })

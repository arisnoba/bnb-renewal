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

type ImageRole = 'body' | 'logo'

type ImageRow = {
  body_image_id: string | null
  image_order: number | null
  legacy_path: string | null
  local_path: string | null
  image_role: ImageRole
  media_id: number | null
  slug: string
  star_card_id: number
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
  bodyImageId?: string | null
  errorMessage?: string
  existingMediaId?: number | null
  imageRole: ImageRole
  legacyPath?: string
  localPath?: string
  mediaId?: number
  starCardId: number
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

const MEDIA_PREFIX = 'media/star-cards/images'
const DOWNLOAD_REPORT_PATH = 'tmp/legacy-assets/star-cards-image-download-report.json'

type DownloadEntry = {
  assetRole?: string
  fileNo?: number
  localPath?: string
  remotePath?: string
  slug?: string
  sourceUrl?: string
}

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
  let outputPath = 'tmp/legacy-assets/star-card-media-link-report.json'
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
  const downloadEntries = await readDownloadEntries()
  const logoBySlug = new Map(
    downloadEntries
      .filter((entry) => entry.assetRole === 'logo' && entry.slug)
      .map((entry) => [String(entry.slug), entry]),
  )
  const bodyBySlugAndOrder = new Map(
    downloadEntries
      .filter((entry) => entry.assetRole === 'body' && entry.slug)
      .map((entry) => [`${String(entry.slug)}:${Number(entry.fileNo ?? 0)}`, entry]),
  )
  const result = await pool.query<ImageRow>(
    `
      SELECT *
      FROM (
        SELECT
          star_cards.id AS star_card_id,
          star_cards.title,
          star_cards.slug,
          'logo'::text AS image_role,
          NULL::text AS body_image_id,
          NULL::integer AS image_order,
          NULL::text AS local_path,
          NULL::text AS legacy_path,
          star_cards.logo_media_id AS media_id
        FROM star_cards

        UNION ALL

        SELECT
          star_cards_body_images._parent_id AS star_card_id,
          star_cards.title,
          star_cards.slug,
          'body'::text AS image_role,
          star_cards_body_images.id AS body_image_id,
          star_cards_body_images._order AS image_order,
          NULL::text AS local_path,
          NULL::text AS legacy_path,
          star_cards_body_images.image_media_id AS media_id
        FROM star_cards_body_images
        JOIN star_cards
          ON star_cards.id = star_cards_body_images._parent_id
      ) AS images
      ORDER BY star_card_id ASC, image_role DESC, image_order ASC NULLS FIRST
      ${limitSql}
    `,
  )

  return result.rows.map((row) => {
    const entry =
      row.image_role === 'logo'
        ? logoBySlug.get(row.slug)
        : bodyBySlugAndOrder.get(`${row.slug}:${row.image_order ?? 0}`)

    return {
      ...row,
      legacy_path: entry?.sourceUrl ?? entry?.remotePath ?? null,
      local_path: entry?.localPath ?? null,
    }
  })
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
    bodyImageId: row.body_image_id,
    existingMediaId: row.media_id,
    imageRole: row.image_role,
    starCardId: row.star_card_id,
    title: text(row.title),
  }

  if (!options.overwrite && row.media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.media_id,
    }
  }

  const matched = matchImage(row)

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

function matchImage(row: ImageRow): MatchedImage | undefined {
  const localPath = text(row.local_path)

  if (!localPath) {
    return undefined
  }

  const fileName = path.basename(localPath)

  if (!fileName) {
    return undefined
  }

  return {
    fileName,
    legacyPath: row.legacy_path ?? localPath,
    localPath,
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
  if (row.image_role === 'logo') {
    await pool.query(
      `
        UPDATE star_cards
        SET logo_media_id = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [mediaId, row.star_card_id],
    )
    return
  }

  await pool.query(
    `
      UPDATE star_cards_body_images
      SET image_media_id = $1
      WHERE id = $2
    `,
    [mediaId, row.body_image_id],
  )
}

async function repairImageForUpload(localPath: string) {
  const { default: sharp } = await import('sharp')
  const repairedDir = path.join(os.tmpdir(), 'bnb-star-card-image-repair')
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

async function readDownloadEntries() {
  const reportPath = resolveProjectPath(DOWNLOAD_REPORT_PATH)
  const raw = await fs.readFile(reportPath, 'utf8')
  const report = JSON.parse(raw) as { entries?: DownloadEntry[] }

  return Array.isArray(report.entries) ? report.entries : []
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

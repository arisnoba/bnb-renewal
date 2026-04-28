import fs from 'node:fs/promises'
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
  ids: string[]
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  write: boolean
}

type NewsRow = {
  id: number
  legacy_meta: unknown
  meta_image_id: number | null
  thumbnail_media_id: number | null
  thumbnail_path: string | null
  title: string | null
}

type Attachment = {
  fileName?: string
  fileNo?: number
  localPath?: string
  originalName?: string
  path?: string
  role?: string
}

type MatchedThumbnail = {
  fileName: string
  legacyPath: string
  localPath: string
  originalName?: string
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'skipped-no-thumbnail'
    | 'unresolved-local-file'
    | 'unresolved-thumbnail-path'
  existingMetaImageId?: number | null
  existingThumbnailMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  newsId: number
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
    const rows = await readNewsRows(pool, options)

    for (const row of rows) {
      results.push(await processRow({ options, payload, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      totals: buildTotals(results),
      write: options.write,
      rows: results,
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
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/news-thumbnail-media-link-report.json'
  let overwrite = false
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

    if (arg === '--overwrite') {
      overwrite = true
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, limit, outputPath, overwrite, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readNewsRows(pool: Pool, options: Options): Promise<NewsRow[]> {
  const params: unknown[] = []
  const where: string[] = ['thumbnail_path IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<NewsRow>(
    `
      SELECT
        id,
        title,
        thumbnail_path,
        thumbnail_media_id,
        meta_image_id,
        legacy_meta
      FROM news
      WHERE ${where.join(' AND ')}
      ORDER BY id ASC
      ${limitSql}
    `,
    params,
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
  row: NewsRow
}): Promise<RowResult> {
  const base = {
    existingMetaImageId: row.meta_image_id,
    existingThumbnailMediaId: row.thumbnail_media_id,
    newsId: row.id,
    title: text(row.title),
  }

  if (!options.overwrite && row.thumbnail_media_id && row.meta_image_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.thumbnail_media_id,
    }
  }

  const matched = await matchThumbnail(row)

  if (!matched && !row.thumbnail_path) {
    return {
      ...base,
      action: 'skipped-no-thumbnail',
    }
  }

  if (!matched) {
    return {
      ...base,
      action: 'unresolved-thumbnail-path',
      legacyPath: normalizeLegacyPath(row.thumbnail_path),
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

  const mediaId =
    existingMediaId ??
    (await createMediaFromLocalFile({
      matched,
      payload,
      title: text(row.title),
    }))

  await linkNewsToMedia({
    mediaId,
    options,
    pool,
    row,
  })

  return {
    ...base,
    action: existingMediaId ? 'linked-existing-media' : 'created-media-and-linked',
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaId,
  }
}

async function matchThumbnail(row: NewsRow): Promise<MatchedThumbnail | undefined> {
  const thumbnailPath = normalizeLegacyPath(row.thumbnail_path)

  if (!thumbnailPath) {
    return undefined
  }

  const attachments = readAttachments(row.legacy_meta)
  const byPath = attachments.find((attachment) => normalizeLegacyPath(attachment.path) === thumbnailPath)
  const byFileName = attachments.find((attachment) => {
    const attachmentFileName = text(attachment.fileName) ?? path.basename(normalizeLegacyPath(attachment.path) ?? '')
    return attachmentFileName && attachmentFileName === path.basename(thumbnailPath)
  })
  const attachment = byPath ?? byFileName
  const localPath = normalizeLocalPath(attachment?.localPath)

  if (attachment && localPath) {
    return {
      fileName: path.basename(localPath),
      legacyPath: thumbnailPath,
      localPath,
      originalName: attachment.originalName,
    }
  }

  return undefined
}

function readAttachments(value: unknown): Attachment[] {
  const meta = toRecord(value)
  const attachments = meta?.attachments

  if (Array.isArray(attachments)) {
    return attachments.filter(isRecord).map(attachmentFromRecord)
  }

  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments) as unknown

      if (Array.isArray(parsed)) {
        return parsed.filter(isRecord).map(attachmentFromRecord)
      }
    } catch {
      return []
    }
  }

  return []
}

function attachmentFromRecord(value: Record<string, unknown>): Attachment {
  return {
    fileName: text(value.fileName),
    fileNo: numberOrUndefined(value.fileNo),
    localPath: text(value.localPath),
    originalName: text(value.originalName),
    path: text(value.path),
    role: text(value.role),
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>('SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1', [
    fileName,
  ])

  return result.rows[0]?.id
}

async function createMediaFromLocalFile({
  matched,
  payload,
  title,
}: {
  matched: MatchedThumbnail
  payload: DynamicPayload
  title?: string
}) {
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: matched.originalName ?? title ?? matched.fileName,
    },
    filePath: resolveProjectPath(matched.localPath),
    overrideAccess: true,
  })
  const id = Number(created.id)

  if (!Number.isFinite(id)) {
    throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
  }

  return id
}

async function linkNewsToMedia({
  mediaId,
  options,
  pool,
  row,
}: {
  mediaId: number
  options: Options
  pool: Pool
  row: NewsRow
}) {
  const shouldSetThumbnail = options.overwrite || !row.thumbnail_media_id
  const shouldSetMeta = options.overwrite || !row.meta_image_id

  if (!shouldSetThumbnail && !shouldSetMeta) {
    return
  }

  await pool.query(
    `
      UPDATE news
      SET
        thumbnail_media_id = CASE WHEN $2 THEN $1 ELSE thumbnail_media_id END,
        meta_image_id = CASE WHEN $3 THEN $1 ELSE meta_image_id END,
        updated_at = NOW()
      WHERE id = $4
    `,
    [mediaId, shouldSetThumbnail, shouldSetMeta, row.id],
  )
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
  const textValue = text(value)

  if (!textValue) {
    return undefined
  }

  try {
    return new URL(textValue).pathname
  } catch {
    return textValue.startsWith('/') ? textValue : `/${textValue}`
  }
}

function normalizeLocalPath(value: string | undefined | null) {
  const textValue = text(value)

  if (!textValue) {
    return undefined
  }

  if (textValue.startsWith('public/')) {
    return textValue
  }

  if (textValue.startsWith('/legacy/')) {
    return `public${textValue}`
  }

  return textValue.replace(/^\/+/, '')
}

function buildTotals(results: RowResult[]) {
  return {
    createdMediaAndLinked: count(results, 'created-media-and-linked'),
    dryRun: count(results, 'dry-run'),
    linkedExistingMedia: count(results, 'linked-existing-media'),
    rows: results.length,
    skippedExisting: count(results, 'skipped-existing'),
    unresolvedLocalFile: count(results, 'unresolved-local-file'),
    unresolvedThumbnailPath: count(results, 'unresolved-thumbnail-path'),
  }
}

function count(results: RowResult[], action: RowResult['action']) {
  return results.filter((result) => result.action === action).length
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (isRecord(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return isRecord(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }

  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

function numberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

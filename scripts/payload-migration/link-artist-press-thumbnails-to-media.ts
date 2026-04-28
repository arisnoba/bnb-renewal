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

type AssetRole = 'agency-logo' | 'thumbnail'

type Options = {
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  write: boolean
}

type ArtistPressRow = {
  agency_logo_media_id: number | null
  agency_logo_path: string | null
  id: number
  legacy_meta: unknown
  meta_image_id: number | null
  source_db: string | null
  source_id: number | null
  thumbnail_media_id: number | null
  thumbnail_path: string | null
  title: string | null
}

type DownloadReportEntry = {
  assetRole?: string
  localPath?: string
  originalName?: string
  remotePath?: string
  sourceId?: number
  sourceUrl?: string
  workId?: number
}

type MatchedAsset = {
  fileName: string
  legacyPath: string
  localPath: string
  originalName?: string
  role: AssetRole
}

type AssetResult = {
  action:
    | 'created-media-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'skipped-no-legacy-path'
    | 'unresolved-legacy-path'
    | 'unresolved-local-file'
  existingMediaId?: number | null
  existingMetaImageId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  role: AssetRole
}

type RowResult = {
  artistPressId: number
  assets: AssetResult[]
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

  const schema = await readSchemaState(pool)

  if (options.write && !schema.hasWritableMediaColumns) {
    throw new Error(
      'artist_press.thumbnail_media_id, artist_press.meta_image_id, artist_press.agency_logo_media_id 컬럼이 모두 필요합니다.',
    )
  }

  const payload = options.write ? await getPayloadForWrite() : undefined
  const reportEntries = await readDownloadReportEntries()
  const results: RowResult[] = []

  try {
    const rows = await readArtistPressRows(pool, options, schema)

    for (const row of rows) {
      results.push(await processRow({ options, payload, pool, reportEntries, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      schema,
      totals: buildTotals(results),
      write: options.write,
      rows: results,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          schema,
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
  let outputPath = 'tmp/legacy-assets/artist-press-media-link-report.json'
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

async function readSchemaState(pool: Pool) {
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'artist_press'
        AND column_name IN ('thumbnail_media_id', 'meta_image_id', 'agency_logo_media_id')
    `,
  )
  const columns = new Set(result.rows.map((row) => row.column_name))

  return {
    hasAgencyLogoMediaId: columns.has('agency_logo_media_id'),
    hasMetaImageId: columns.has('meta_image_id'),
    hasThumbnailMediaId: columns.has('thumbnail_media_id'),
    hasWritableMediaColumns:
      columns.has('thumbnail_media_id') && columns.has('meta_image_id') && columns.has('agency_logo_media_id'),
  }
}

async function readArtistPressRows(
  pool: Pool,
  options: Options,
  schema: Awaited<ReturnType<typeof readSchemaState>>,
): Promise<ArtistPressRow[]> {
  const params: unknown[] = []
  const where: string[] = ['(thumbnail_path IS NOT NULL OR agency_logo_path IS NOT NULL)']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const thumbnailMediaSelect = schema.hasThumbnailMediaId ? 'thumbnail_media_id' : 'NULL::integer AS thumbnail_media_id'
  const metaImageSelect = schema.hasMetaImageId ? 'meta_image_id' : 'NULL::integer AS meta_image_id'
  const agencyLogoMediaSelect = schema.hasAgencyLogoMediaId
    ? 'agency_logo_media_id'
    : 'NULL::integer AS agency_logo_media_id'
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<ArtistPressRow>(
    `
      SELECT
        id,
        title,
        source_db,
        source_id,
        thumbnail_path,
        agency_logo_path,
        ${thumbnailMediaSelect},
        ${metaImageSelect},
        ${agencyLogoMediaSelect},
        legacy_meta
      FROM artist_press
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
  reportEntries,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  reportEntries: DownloadReportEntry[]
  row: ArtistPressRow
}): Promise<RowResult> {
  return {
    artistPressId: row.id,
    title: text(row.title),
    assets: [
      await processAsset({ options, payload, pool, reportEntries, role: 'thumbnail', row }),
      await processAsset({ options, payload, pool, reportEntries, role: 'agency-logo', row }),
    ],
  }
}

async function processAsset({
  options,
  payload,
  pool,
  reportEntries,
  role,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  reportEntries: DownloadReportEntry[]
  role: AssetRole
  row: ArtistPressRow
}): Promise<AssetResult> {
  const existingMediaId = role === 'thumbnail' ? row.thumbnail_media_id : row.agency_logo_media_id
  const base = {
    existingMediaId,
    existingMetaImageId: role === 'thumbnail' ? row.meta_image_id : undefined,
    role,
  }

  if (role === 'thumbnail' && !options.overwrite && row.thumbnail_media_id && row.meta_image_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.thumbnail_media_id,
    }
  }

  if (role === 'agency-logo' && !options.overwrite && row.agency_logo_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.agency_logo_media_id,
    }
  }

  const matched = matchAsset(row, role, reportEntries)

  if (!matched && !legacyPathForRole(row, role)) {
    return {
      ...base,
      action: 'skipped-no-legacy-path',
    }
  }

  if (!matched) {
    return {
      ...base,
      action: 'unresolved-legacy-path',
      legacyPath: normalizeLegacyPath(legacyPathForRole(row, role)),
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

  const mediaId = await findExistingMediaId(pool, matched.fileName)

  if (options.dryRun) {
    return {
      ...base,
      action: 'dry-run',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaId,
    }
  }

  if (!payload) {
    throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
  }

  const nextMediaId =
    mediaId ??
    (await createMediaFromLocalFile({
      matched,
      payload,
      title: text(row.title),
    }))

  await linkArtistPressAssetToMedia({
    mediaId: nextMediaId,
    options,
    pool,
    role,
    row,
  })

  return {
    ...base,
    action: mediaId ? 'linked-existing-media' : 'created-media-and-linked',
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaId: nextMediaId,
  }
}

function matchAsset(row: ArtistPressRow, role: AssetRole, reportEntries: DownloadReportEntry[]) {
  const legacyPath = normalizeLegacyPath(legacyPathForRole(row, role))

  if (!legacyPath) {
    return undefined
  }

  const byReport = findReportEntry(row, role, legacyPath, reportEntries)

  if (byReport?.localPath) {
    return {
      fileName: path.basename(byReport.localPath),
      legacyPath,
      localPath: normalizeLocalPath(byReport.localPath),
      originalName: text(byReport.originalName),
      role,
    } satisfies MatchedAsset
  }

  const localPath = buildLocalPathFromRow(row, role, legacyPath)

  if (!localPath) {
    return undefined
  }

  return {
    fileName: path.basename(localPath),
    legacyPath,
    localPath,
    role,
  } satisfies MatchedAsset
}

function findReportEntry(
  row: ArtistPressRow,
  role: AssetRole,
  legacyPath: string,
  reportEntries: DownloadReportEntry[],
) {
  const fileName = path.basename(legacyPath)

  return reportEntries.find((entry) => {
    if (entry.assetRole !== role) {
      return false
    }

    const sameId = entry.workId === row.id || entry.sourceId === row.source_id
    const samePath =
      normalizeLegacyPath(entry.remotePath) === legacyPath ||
      normalizeLegacyPath(entry.sourceUrl) === legacyPath ||
      path.basename(text(entry.localPath) ?? '') === fileName

    return sameId && samePath
  })
}

async function readDownloadReportEntries(): Promise<DownloadReportEntry[]> {
  const reportPath = resolveProjectPath('tmp/legacy-assets/artist-press-image-download-report.json')

  try {
    const raw = await fs.readFile(reportPath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    const entries = isRecord(parsed) ? parsed.entries : undefined

    return Array.isArray(entries) ? entries.filter(isRecord) : []
  } catch {
    return []
  }
}

function buildLocalPathFromRow(row: ArtistPressRow, role: AssetRole, legacyPath: string) {
  const sourceId = text(row.source_id) || text(toRecord(row.legacy_meta)?.sourceId)

  if (!sourceId) {
    return undefined
  }

  const sourceDb = text(row.source_db) || text(toRecord(row.legacy_meta)?.sourceDb) || 'baewoo'
  const parts = legacyPath.split('/').filter(Boolean)
  const boTable = parts.at(-2) || 'new_shoot'
  const fileName = path.basename(legacyPath)

  return `public/legacy/artist-press/${sourceDb}/${boTable}/${sourceId}/${role}/${fileName}`
}

function legacyPathForRole(row: ArtistPressRow, role: AssetRole) {
  return role === 'thumbnail' ? row.thumbnail_path : row.agency_logo_path
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
  matched: MatchedAsset
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

async function linkArtistPressAssetToMedia({
  mediaId,
  options,
  pool,
  role,
  row,
}: {
  mediaId: number
  options: Options
  pool: Pool
  role: AssetRole
  row: ArtistPressRow
}) {
  if (role === 'agency-logo') {
    const shouldSetAgencyLogo = options.overwrite || !row.agency_logo_media_id

    if (!shouldSetAgencyLogo) {
      return
    }

    await pool.query(
      `
        UPDATE artist_press
        SET
          agency_logo_media_id = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [mediaId, row.id],
    )
    return
  }

  const shouldSetThumbnail = options.overwrite || !row.thumbnail_media_id
  const shouldSetMeta = options.overwrite || !row.meta_image_id

  if (!shouldSetThumbnail && !shouldSetMeta) {
    return
  }

  await pool.query(
    `
      UPDATE artist_press
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

function normalizeLocalPath(value: string) {
  if (value.startsWith('public/')) {
    return value
  }

  if (value.startsWith('/legacy/')) {
    return `public${value}`
  }

  return value.replace(/^\/+/, '')
}

function buildTotals(results: RowResult[]) {
  const assets = results.flatMap((result) => result.assets)

  return {
    assets: assets.length,
    createdMediaAndLinked: count(assets, 'created-media-and-linked'),
    dryRun: count(assets, 'dry-run'),
    linkedExistingMedia: count(assets, 'linked-existing-media'),
    rows: results.length,
    skippedExisting: count(assets, 'skipped-existing'),
    skippedNoLegacyPath: count(assets, 'skipped-no-legacy-path'),
    unresolvedLegacyPath: count(assets, 'unresolved-legacy-path'),
    unresolvedLocalFile: count(assets, 'unresolved-local-file'),
  }
}

function count(results: AssetResult[], action: AssetResult['action']) {
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

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

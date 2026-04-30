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

type AgencyRow = {
  id: number
  logo_media_id: number | null
  slug: string | null
  source_db: string | null
  source_id: number | null
  source_table: string | null
  subject: string | null
}

type DownloadReportEntry = {
  assetRole?: string
  collection?: string
  localPath?: string
  originalName?: string
  remotePath?: string
  slug?: string
  sourceDb?: string
  sourceId?: number
  sourceTable?: string
  sourceUrl?: string
}

type MatchedLogo = {
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
    | 'skipped-no-logo'
    | 'unresolved-local-file'
    | 'unresolved-logo-path'
  agencyId: number
  existingLogoMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  slug?: string
  subject?: string
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

  if (options.write && !schema.hasLogoMediaId) {
    throw new Error('agencies.logo_media_id 컬럼이 없습니다.')
  }

  const payload = options.write ? await getPayloadForWrite() : undefined
  const reportEntries = await readDownloadReportEntries()
  const results: RowResult[] = []

  try {
    const rows = await readRows(pool, options, schema)

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
  let outputPath = 'tmp/legacy-assets/agency-logo-link-report.json'
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
        AND table_name = 'agencies'
        AND column_name = 'logo_media_id'
    `,
  )

  return {
    hasLogoMediaId: result.rows.some((row) => row.column_name === 'logo_media_id'),
  }
}

async function readRows(
  pool: Pool,
  options: Options,
  schema: Awaited<ReturnType<typeof readSchemaState>>,
): Promise<AgencyRow[]> {
  const params: unknown[] = []
  const where: string[] = ['slug IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const logoMediaSelect = schema.hasLogoMediaId ? 'logo_media_id' : 'NULL::integer AS logo_media_id'
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<AgencyRow>(
    `
      SELECT
        id,
        subject,
        slug,
        source_db,
        source_table,
        source_id,
        ${logoMediaSelect}
      FROM agencies
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
  row: AgencyRow
}): Promise<RowResult> {
  const base = {
    agencyId: row.id,
    existingLogoMediaId: row.logo_media_id,
    slug: text(row.slug),
    subject: text(row.subject),
  }

  if (!options.overwrite && row.logo_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.logo_media_id,
    }
  }

  const matched = matchLogo(row, reportEntries)

  if (!matched) {
    return {
      ...base,
      action: 'unresolved-logo-path',
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

  const existingMediaId = await findExistingAgencyLogoMediaId(pool, row)

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
      title: text(row.subject),
    }))

  await linkAgencyToMedia({ mediaId, pool, row })

  return {
    ...base,
    action: existingMediaId ? 'linked-existing-media' : 'created-media-and-linked',
    legacyPath: matched.legacyPath,
    localPath: matched.localPath,
    mediaId,
  }
}

function matchLogo(row: AgencyRow, reportEntries: DownloadReportEntry[]) {
  const byReport = findReportEntry(row, reportEntries)

  if (!byReport?.localPath) {
    return undefined
  }

  const legacyPath = normalizeLegacyPath(byReport.remotePath) ?? normalizeLegacyPath(byReport.sourceUrl)

  return {
    fileName: path.basename(byReport.localPath),
    legacyPath: legacyPath ?? byReport.localPath,
    localPath: normalizeLocalPath(byReport.localPath),
    originalName: text(byReport.originalName),
  } satisfies MatchedLogo
}

function findReportEntry(row: AgencyRow, reportEntries: DownloadReportEntry[]) {
  return reportEntries.find((entry) => {
    if (entry.collection !== 'agencies' || entry.assetRole !== 'profile' || !entry.localPath) {
      return false
    }

    const sameSlug = text(entry.slug) === text(row.slug)
    const sameSource =
      text(entry.sourceDb) === text(row.source_db) &&
      text(entry.sourceTable) === text(row.source_table) &&
      entry.sourceId === row.source_id

    return sameSlug || sameSource
  })
}

async function readDownloadReportEntries(): Promise<DownloadReportEntry[]> {
  const reportPath = resolveProjectPath('tmp/legacy-assets/agencies-image-download-report.json')

  try {
    const raw = await fs.readFile(reportPath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    const entries = isRecord(parsed) ? parsed.entries : undefined

    return Array.isArray(entries) ? entries.filter(isRecord) : []
  } catch {
    return []
  }
}

async function findExistingAgencyLogoMediaId(pool: Pool, row: AgencyRow) {
  const alt = agencyLogoAlt(row)
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE alt = $1 ORDER BY id ASC LIMIT 1',
    [alt],
  )

  return result.rows[0]?.id
}

async function createMediaFromLocalFile({
  matched,
  payload,
  title,
}: {
  matched: MatchedLogo
  payload: DynamicPayload
  title?: string
}) {
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: agencyLogoAlt({ subject: title ?? matched.originalName ?? matched.fileName }),
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

async function linkAgencyToMedia({
  mediaId,
  pool,
  row,
}: {
  mediaId: number
  pool: Pool
  row: AgencyRow
}) {
  await pool.query(
    `
      UPDATE agencies
      SET
        logo_media_id = $1,
        updated_at = NOW()
      WHERE id = $2
    `,
    [mediaId, row.id],
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

function agencyLogoAlt(row: Pick<AgencyRow, 'subject'>) {
  return `${text(row.subject) ?? '에이전시'} 로고`
}

function buildTotals(results: RowResult[]) {
  return {
    createdMediaAndLinked: count(results, 'created-media-and-linked'),
    dryRun: count(results, 'dry-run'),
    linkedExistingMedia: count(results, 'linked-existing-media'),
    rows: results.length,
    skippedExisting: count(results, 'skipped-existing'),
    skippedNoLogo: count(results, 'skipped-no-logo'),
    unresolvedLocalFile: count(results, 'unresolved-local-file'),
    unresolvedLogoPath: count(results, 'unresolved-logo-path'),
  }
}

function count(results: RowResult[], action: RowResult['action']) {
  return results.filter((result) => result.action === action).length
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

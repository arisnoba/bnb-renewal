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

type ExamSchoolLogoRow = {
  id: number
  legacy_meta: unknown
  logo_media_id: number | null
  logo_path: string | null
  school_name: string | null
  school_slug: string | null
}

type DownloadReportEntry = {
  assetRole?: string
  localPath?: string
  originalName?: string
  remotePath?: string
  slug?: string
  sourceId?: number
  sourceUrl?: string
  workId?: number
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
  existingLogoMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  schoolLogoId: number
  schoolName?: string
  schoolSlug?: string
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
    throw new Error('exam_school_logos.logo_media_id 컬럼이 없습니다.')
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
  let outputPath = 'tmp/legacy-assets/exam-school-logo-link-report.json'
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
        AND table_name = 'exam_school_logos'
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
): Promise<ExamSchoolLogoRow[]> {
  const params: unknown[] = []
  const where: string[] = ['logo_path IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const logoMediaSelect = schema.hasLogoMediaId ? 'logo_media_id' : 'NULL::integer AS logo_media_id'
  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<ExamSchoolLogoRow>(
    `
      SELECT
        id,
        school_name,
        school_slug,
        logo_path,
        ${logoMediaSelect},
        legacy_meta
      FROM exam_school_logos
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
  row: ExamSchoolLogoRow
}): Promise<RowResult> {
  const base = {
    existingLogoMediaId: row.logo_media_id,
    schoolLogoId: row.id,
    schoolName: text(row.school_name),
    schoolSlug: text(row.school_slug),
  }

  if (!options.overwrite && row.logo_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.logo_media_id,
    }
  }

  const matched = matchLogo(row, reportEntries)

  if (!matched && !row.logo_path) {
    return {
      ...base,
      action: 'skipped-no-logo',
    }
  }

  if (!matched) {
    return {
      ...base,
      action: 'unresolved-logo-path',
      legacyPath: normalizeLegacyPath(row.logo_path),
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
      title: text(row.school_name),
    }))

  await linkSchoolLogoToMedia({
    mediaId,
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

function matchLogo(row: ExamSchoolLogoRow, reportEntries: DownloadReportEntry[]) {
  const legacyPath = normalizeLegacyPath(row.logo_path)

  if (!legacyPath) {
    return undefined
  }

  const byReport = findReportEntry(row, legacyPath, reportEntries)

  if (byReport?.localPath) {
    return {
      fileName: path.basename(byReport.localPath),
      legacyPath,
      localPath: normalizeLocalPath(byReport.localPath),
      originalName: text(byReport.originalName),
    } satisfies MatchedLogo
  }

  const localPath = buildLocalPathFromRow(row, legacyPath)

  if (!localPath) {
    return undefined
  }

  return {
    fileName: path.basename(localPath),
    legacyPath,
    localPath,
  } satisfies MatchedLogo
}

function findReportEntry(
  row: ExamSchoolLogoRow,
  legacyPath: string,
  reportEntries: DownloadReportEntry[],
) {
  const fileName = path.basename(legacyPath)

  return reportEntries.find((entry) => {
    if (entry.assetRole !== 'logo') {
      return false
    }

    const sameId = entry.workId === row.id || entry.sourceId === row.id
    const sameSlug = text(entry.slug) === text(row.school_slug)
    const samePath =
      normalizeLegacyPath(entry.remotePath) === legacyPath ||
      normalizeLegacyPath(entry.sourceUrl) === legacyPath ||
      path.basename(text(entry.localPath) ?? '') === fileName

    return (sameId || sameSlug) && samePath
  })
}

async function readDownloadReportEntries(): Promise<DownloadReportEntry[]> {
  const reportPath = resolveProjectPath('tmp/legacy-assets/exam-school-logos-image-download-report.json')

  try {
    const raw = await fs.readFile(reportPath, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    const entries = isRecord(parsed) ? parsed.entries : undefined

    return Array.isArray(entries) ? entries.filter(isRecord) : []
  } catch {
    return []
  }
}

function buildLocalPathFromRow(row: ExamSchoolLogoRow, legacyPath: string) {
  const fileName = path.basename(legacyPath)
  return `public/legacy/exam-school-logos/bnbuniv/new_hoogi/${row.id}/logo/${fileName}`
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1',
    [fileName],
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

async function linkSchoolLogoToMedia({
  mediaId,
  pool,
  row,
}: {
  mediaId: number
  pool: Pool
  row: ExamSchoolLogoRow
}) {
  await pool.query(
    `
      UPDATE exam_school_logos
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

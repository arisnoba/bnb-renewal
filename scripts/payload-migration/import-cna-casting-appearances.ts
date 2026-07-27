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

const CASTING_COMPANY = 'CNA Agency'
const DEFAULT_CENTERS = ['art', 'avenue', 'highteen', 'kids']
const DEFAULT_OUTPUT_PATH = 'tmp/casting/cna-casting-appearance-import-report.json'
const EXPECTED_INPUT_COUNT = 88

type Options = {
  allowRemoteWrite: boolean
  inputPath: string
  outputPath: string
  write: boolean
}

type SourceItem = {
  expectedMediaFilename: string
  sourceFilename: string
  sourcePath: string
  sourceTitle: string
  year: string
}

type MediaMatch = {
  centers: string[]
  directCastingId: number | null
  directCastingTitle: string | null
  filename: string
  prefix: string
  url: string
}

type ImportItem = {
  centers: string[]
  directCastingId: number | null
  mediaFilename: string
  sourceFilename: string
  thumbnailPath: string
  title: string
  year: string
}

type ExistingCastingAppearance = {
  id: number
  title: string
  year: string
}

type ImportPlan =
  | {
      action: 'already-exists'
      existing: ExistingCastingAppearance
      item: ImportItem
    }
  | {
      action: 'create'
      item: ImportItem
    }

type ImportResult = {
  action: ImportPlan['action']
  castingAppearanceId?: number
  directCastingId: number | null
  mediaFilename: string
  title: string
  year: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  if (!target.isLocal && options.write && !options.allowRemoteWrite) {
    throw new Error('원격 DB 쓰기에는 --allow-remote-write 옵션이 필요합니다.')
  }

  logDbTargetInfo(target, { destructive: options.write })

  const pool = new Pool({ connectionString })

  try {
    const sourceItems = await readSourceItems(options.inputPath)

    if (sourceItems.length !== EXPECTED_INPUT_COUNT) {
      throw new Error(
        `CNA 포스터 수가 ${EXPECTED_INPUT_COUNT}건이 아닙니다: ${sourceItems.length}`,
      )
    }

    const mediaMatches = await readMediaMatches(
      pool,
      sourceItems.map((item) => item.expectedMediaFilename),
    )
    const items = buildImportItems(sourceItems, mediaMatches)
    const existing = await readExistingCastingAppearances(pool)
    const plans = buildImportPlans(items, existing)
    const results = options.write ? await applyPlans(pool, plans) : dryRunResults(plans)
    const output = {
      dryRun: !options.write,
      generatedAt: new Date().toISOString(),
      inputCount: sourceItems.length,
      results,
      totals: countByAction(results),
      years: countByYear(results),
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          totals: output.totals,
          years: output.years,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

async function readSourceItems(inputPath: string): Promise<SourceItem[]> {
  const absoluteInputPath = path.resolve(inputPath)
  const files = await readFilesRecursively(absoluteInputPath)
  const sourceItems = files
    .filter((filePath) => /\.(?:jpe?g|png|webp)$/i.test(filePath))
    .map((filePath) => sourceItemFromFile(filePath, absoluteInputPath))
  const duplicateMediaFilenames = duplicateValues(
    sourceItems.map((item) => item.expectedMediaFilename),
  )

  if (duplicateMediaFilenames.length > 0) {
    throw new Error(
      `같은 연도와 작품명의 포스터가 중복됩니다: ${duplicateMediaFilenames.join(', ')}`,
    )
  }

  return sourceItems.sort((left, right) => {
    const yearDifference = Number(right.year) - Number(left.year)

    return (
      yearDifference ||
      left.expectedMediaFilename.localeCompare(right.expectedMediaFilename, 'ko')
    )
  })
}

async function readFilesRecursively(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await readFilesRecursively(entryPath)))
      continue
    }

    if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

function sourceItemFromFile(filePath: string, inputPath: string): SourceItem {
  const relativePath = path.relative(inputPath, filePath)
  const pathSegments = relativePath.split(path.sep)
  const year = pathSegments.find((segment) => /^\d{4}$/.test(segment))

  if (!year) {
    throw new Error(`경로에서 연도를 찾을 수 없습니다: ${relativePath}`)
  }

  const sourceFilename = path.basename(filePath)
  const sourceBasename = path.basename(sourceFilename, path.extname(sourceFilename)).normalize('NFC')
  const isFilm = sourceBasename.startsWith('[영화]')
  const titlePart = sourceBasename.replace(/^\[영화\]/u, '')
  const sourceTitle = titlePart.replace(/[-_,]+/g, ' ').trim()
  const mediaTitlePart = titlePart
    .replace(/[^0-9a-z가-힣]+/giu, '_')
    .replace(/^_+|_+$/g, '')

  if (!sourceTitle || !mediaTitlePart) {
    throw new Error(`작품명을 찾을 수 없습니다: ${relativePath}`)
  }

  return {
    expectedMediaFilename: `${year}_${isFilm ? '영화_' : ''}${mediaTitlePart}.jpg`,
    sourceFilename,
    sourcePath: relativePath,
    sourceTitle,
    year,
  }
}

async function readMediaMatches(
  pool: Pool,
  expectedMediaFilenames: string[],
): Promise<MediaMatch[]> {
  const result = await pool.query<{
    centers: string[] | null
    direct_casting_id: number | null
    direct_casting_title: string | null
    filename: string
    prefix: string | null
    url: string | null
  }>(
    `
      SELECT
        media.filename,
        media.prefix,
        media.url,
        direct_castings.id AS direct_casting_id,
        direct_castings.title AS direct_casting_title,
        COALESCE((
          SELECT array_agg(value::text ORDER BY "order")
          FROM direct_castings_centers
          WHERE parent_id = direct_castings.id
        ), ARRAY[]::text[]) AS centers
      FROM media
      LEFT JOIN direct_castings
        ON direct_castings.thumbnail_media_id = media.id
       AND EXISTS (
         SELECT 1
         FROM direct_castings_company
         WHERE parent_id = direct_castings.id
           AND value = 'cna-agency'
       )
      WHERE media.filename = ANY($1::text[])
      ORDER BY media.filename
    `,
    [expectedMediaFilenames],
  )

  const matchesByFilename = new Map<string, MediaMatch[]>()

  for (const row of result.rows) {
    if (!row.prefix) {
      throw new Error(`미디어 prefix가 비어 있습니다: ${row.filename}`)
    }

    const matches = matchesByFilename.get(row.filename) ?? []
    matches.push({
      centers: row.centers ?? [],
      directCastingId: row.direct_casting_id,
      directCastingTitle: row.direct_casting_title,
      filename: row.filename,
      prefix: row.prefix,
      url: row.url || mediaApiUrl(row.filename, row.prefix),
    })
    matchesByFilename.set(row.filename, matches)
  }

  const missingFilenames = expectedMediaFilenames.filter(
    (filename) => !matchesByFilename.has(filename),
  )
  const duplicateFilenames = [...matchesByFilename.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([filename]) => filename)

  if (missingFilenames.length > 0) {
    throw new Error(`미디어 레코드를 찾을 수 없습니다: ${missingFilenames.join(', ')}`)
  }

  if (duplicateFilenames.length > 0) {
    throw new Error(`같은 파일명의 미디어가 중복됩니다: ${duplicateFilenames.join(', ')}`)
  }

  return [...matchesByFilename.values()].map((matches) => matches[0])
}

function buildImportItems(
  sourceItems: SourceItem[],
  mediaMatches: MediaMatch[],
): ImportItem[] {
  const mediaByFilename = new Map(
    mediaMatches.map((media) => [media.filename.normalize('NFC'), media]),
  )

  return sourceItems.map((sourceItem) => {
    const media = mediaByFilename.get(sourceItem.expectedMediaFilename.normalize('NFC'))

    if (!media) {
      throw new Error(`포스터 미디어 매핑이 없습니다: ${sourceItem.sourcePath}`)
    }

    return {
      centers: media.centers.length > 0 ? media.centers : DEFAULT_CENTERS,
      directCastingId: media.directCastingId,
      mediaFilename: media.filename,
      sourceFilename: sourceItem.sourceFilename,
      thumbnailPath: media.url,
      title: media.directCastingTitle?.trim() || sourceItem.sourceTitle,
      year: sourceItem.year,
    }
  })
}

async function readExistingCastingAppearances(
  pool: Pool,
): Promise<ExistingCastingAppearance[]> {
  const result = await pool.query<{
    id: number
    title: string
    year: string
  }>(
    `
      SELECT
        id,
        title,
        EXTRACT(YEAR FROM published_at)::int::text AS year
      FROM casting_appearances
      WHERE casting_company = $1
    `,
    [CASTING_COMPANY],
  )

  return result.rows
}

function buildImportPlans(
  items: ImportItem[],
  existing: ExistingCastingAppearance[],
): ImportPlan[] {
  const existingByTitleAndYear = new Map<string, ExistingCastingAppearance[]>()

  for (const row of existing) {
    const key = itemKey(row.title, row.year)
    const matches = existingByTitleAndYear.get(key) ?? []
    matches.push(row)
    existingByTitleAndYear.set(key, matches)
  }

  return items.map((item) => {
    const matches = existingByTitleAndYear.get(itemKey(item.title, item.year)) ?? []

    if (matches.length > 1) {
      throw new Error(
        `기존 출연현황이 중복됩니다: ${item.year} ${item.title} (ID: ${matches
          .map((row) => row.id)
          .join(', ')})`,
      )
    }

    if (matches.length === 1) {
      return {
        action: 'already-exists',
        existing: matches[0],
        item,
      }
    }

    return {
      action: 'create',
      item,
    }
  })
}

function dryRunResults(plans: ImportPlan[]): ImportResult[] {
  return plans.map((plan) => resultFromPlan(plan))
}

async function applyPlans(pool: Pool, plans: ImportPlan[]): Promise<ImportResult[]> {
  const results: ImportResult[] = []

  await pool.query('BEGIN')

  try {
    for (const plan of plans) {
      if (plan.action === 'already-exists') {
        results.push(resultFromPlan(plan))
        continue
      }

      const created = await pool.query<{ id: number }>(
        `
          INSERT INTO casting_appearances (
            title,
            casting_company,
            thumbnail_path,
            published_at,
            display_status,
            author_name,
            slug
          )
          VALUES ($1, $2, $3, $4, 'published', '배우앤배움 전체 센터', $5)
          RETURNING id
        `,
        [
          plan.item.title,
          CASTING_COMPANY,
          plan.item.thumbnailPath,
          `${plan.item.year}-01-01T00:00:00.000Z`,
          `pending-cna-casting-appearance-${plan.item.mediaFilename}`,
        ],
      )
      const castingAppearanceId = created.rows[0]?.id

      if (!castingAppearanceId) {
        throw new Error(
          `캐스팅 출연현황 생성 후 ID를 확인할 수 없습니다: ${plan.item.mediaFilename}`,
        )
      }

      await pool.query(
        'UPDATE casting_appearances SET slug = $1 WHERE id = $2',
        [String(castingAppearanceId), castingAppearanceId],
      )

      for (const [order, center] of plan.item.centers.entries()) {
        await pool.query(
          `
            INSERT INTO casting_appearances_centers ("order", parent_id, value)
            VALUES ($1, $2, $3)
          `,
          [order, castingAppearanceId, center],
        )
      }

      results.push(resultFromPlan(plan, castingAppearanceId))
    }

    await pool.query('COMMIT')
    return results
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }
}

function resultFromPlan(
  plan: ImportPlan,
  castingAppearanceId?: number,
): ImportResult {
  return {
    action: plan.action,
    castingAppearanceId:
      castingAppearanceId ??
      (plan.action === 'already-exists' ? plan.existing.id : undefined),
    directCastingId: plan.item.directCastingId,
    mediaFilename: plan.item.mediaFilename,
    title: plan.item.title,
    year: plan.item.year,
  }
}

function itemKey(title: string, year: string) {
  return `${year}:${normalizeTitle(title)}`
}

function normalizeTitle(value: string) {
  return value
    .normalize('NFC')
    .replace(/^영화\s*/u, '')
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]/giu, '')
}

function mediaApiUrl(filename: string, prefix: string) {
  return `/api/media/file/${encodeURIComponent(filename)}?prefix=${encodeURIComponent(prefix)}`
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    const normalizedValue = value.normalize('NFC')

    if (seen.has(normalizedValue)) {
      duplicates.add(value)
    } else {
      seen.add(normalizedValue)
    }
  }

  return [...duplicates]
}

function countByAction(results: ImportResult[]) {
  return results.reduce<Record<string, number>>((totals, result) => {
    totals[result.action] = (totals[result.action] ?? 0) + 1
    return totals
  }, {})
}

function countByYear(results: ImportResult[]) {
  return results.reduce<Record<string, number>>((totals, result) => {
    totals[result.year] = (totals[result.year] ?? 0) + 1
    return totals
  }, {})
}

function parseArgs(args: string[]): Options {
  let allowRemoteWrite = false
  let inputPath = ''
  let outputPath = DEFAULT_OUTPUT_PATH
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--write') {
      write = true
      continue
    }

    if (arg === '--allow-remote-write') {
      allowRemoteWrite = true
      continue
    }

    if (arg === '--input') {
      const value = args[index + 1]

      if (!value) {
        throw new Error('--input 값이 필요합니다.')
      }

      inputPath = value
      index += 1
      continue
    }

    if (arg === '--output') {
      const value = args[index + 1]

      if (!value) {
        throw new Error('--output 값이 필요합니다.')
      }

      outputPath = value
      index += 1
      continue
    }

    throw new Error(`지원하지 않는 옵션입니다: ${arg}`)
  }

  if (!inputPath) {
    throw new Error('CNA 포스터 폴더를 --input으로 지정해 주세요.')
  }

  return {
    allowRemoteWrite,
    inputPath,
    outputPath,
    write,
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

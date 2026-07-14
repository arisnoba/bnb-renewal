import fs from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'
import sharp from 'sharp'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

const COMPANY = 'cna-agency'
const CENTERS = ['art', 'avenue', 'highteen', 'kids']
const INPUT_DIR = 'data/casting'
const DEFAULT_OUTPUT_PATH = 'tmp/casting/cna-direct-casting-import-report.json'
const MIGRATION_NAME = '20260714_180000_direct_casting_avenue_center'

type Options = {
  outputPath: string
  write: boolean
}

type ExistingDirectCasting = {
  companies: string[]
  id: number
  title: string
  yearLabel: string
}

type ImportItem = {
  filePath: string
  filename: string
  title: string
  yearLabel: string
}

type ImportPlan =
  | {
      action: 'add-company' | 'already-has-company'
      existing: ExistingDirectCasting
      item: ImportItem
      match: 'title' | 'title-and-year'
    }
  | {
      action: 'create'
      item: ImportItem
    }

type ImportResult = {
  action: ImportPlan['action']
  directCastingId?: number
  filename: string
  title: string
  yearLabel: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  if (!target.isLocal) {
    throw new Error('이 스크립트는 로컬 DB에서만 실행할 수 있습니다.')
  }

  logDbTargetInfo(target, { destructive: options.write })

  const pool = new Pool({ connectionString })

  try {
    await assertAvenueMigration(pool)

    const [items, existing] = await Promise.all([readImportItems(), readExistingDirectCastings(pool)])
    const plans = buildImportPlans(items, existing)
    const results = options.write ? await applyPlans(pool, plans) : dryRunResults(plans)
    const output = {
      dryRun: !options.write,
      generatedAt: new Date().toISOString(),
      inputCount: items.length,
      results,
      totals: countByAction(results),
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(JSON.stringify({ outputPath: options.outputPath, totals: output.totals }, null, 2))
  } finally {
    await pool.end()
  }
}

async function assertAvenueMigration(pool: Pool) {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM payload_migrations
        WHERE name = $1
      ) AS "exists"
    `,
    [MIGRATION_NAME],
  )

  if (!result.rows[0]?.exists) {
    throw new Error(`필수 마이그레이션이 적용되지 않았습니다: ${MIGRATION_NAME}`)
  }
}

async function readImportItems(): Promise<ImportItem[]> {
  const directory = resolveProjectPath(INPUT_DIR)
  const yearDirectories = await fs.readdir(directory, { withFileTypes: true })
  const items: ImportItem[] = []

  for (const yearDirectory of yearDirectories) {
    if (!yearDirectory.isDirectory() || !/^\d{4}$/.test(yearDirectory.name)) {
      continue
    }

    const yearLabel = yearDirectory.name
    const files = await fs.readdir(path.join(directory, yearLabel), { withFileTypes: true })

    for (const file of files) {
      if (!file.isFile() || path.extname(file.name).toLowerCase() !== '.jpg') {
        continue
      }

      const prefix = `${yearLabel}_`

      if (!file.name.startsWith(prefix)) {
        throw new Error(`연도 접두사가 맞지 않는 파일입니다: ${file.name}`)
      }

      const title = path.basename(file.name, path.extname(file.name)).slice(prefix.length).replaceAll('_', ' ')

      if (!title.trim()) {
        throw new Error(`작품명을 찾을 수 없는 파일입니다: ${file.name}`)
      }

      items.push({
        filePath: path.join(INPUT_DIR, yearLabel, file.name),
        filename: file.name,
        title,
        yearLabel,
      })
    }
  }

  return items.sort((left, right) => left.filePath.localeCompare(right.filePath, 'ko'))
}

async function readExistingDirectCastings(pool: Pool): Promise<ExistingDirectCasting[]> {
  const result = await pool.query<{
    companies: string[] | null
    id: number
    title: string
    year_label: string | null
  }>(`
    SELECT
      direct_castings.id,
      direct_castings.title,
      direct_castings.year_label,
      COALESCE((
        SELECT array_agg(value::text ORDER BY "order")
        FROM direct_castings_company
        WHERE parent_id = direct_castings.id
      ), ARRAY[]::text[]) AS companies
    FROM direct_castings
  `)

  return result.rows.map((row) => ({
    companies: row.companies ?? [],
    id: row.id,
    title: row.title,
    yearLabel: row.year_label ?? '',
  }))
}

function buildImportPlans(items: ImportItem[], existing: ExistingDirectCasting[]): ImportPlan[] {
  const existingByTitle = new Map<string, ExistingDirectCasting[]>()

  for (const row of existing) {
    const key = normalizeTitle(row.title)
    const matches = existingByTitle.get(key) ?? []
    matches.push(row)
    existingByTitle.set(key, matches)
  }

  return items.map((item) => {
    const matches = existingByTitle.get(normalizeTitle(item.title)) ?? []
    const sameYearMatches = matches.filter((row) => row.yearLabel === item.yearLabel)
    const candidates = sameYearMatches.length > 0 ? sameYearMatches : matches

    if (candidates.length === 0) {
      return { action: 'create', item }
    }

    if (candidates.length > 1) {
      throw new Error(
        `중복 여부를 하나로 결정할 수 없습니다: ${item.yearLabel} ${item.title} (기존 ID: ${candidates.map((row) => row.id).join(', ')})`,
      )
    }

    const existing = candidates[0]

    return {
      action: existing.companies.includes(COMPANY) ? 'already-has-company' : 'add-company',
      existing,
      item,
      match: sameYearMatches.length > 0 ? 'title-and-year' : 'title',
    }
  })
}

function normalizeTitle(value: string) {
  return value
    .normalize('NFC')
    .replace(/^영화\s*/u, '')
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]/giu, '')
}

function dryRunResults(plans: ImportPlan[]): ImportResult[] {
  return plans.map((plan) => ({
    action: plan.action,
    directCastingId: 'existing' in plan ? plan.existing.id : undefined,
    filename: plan.item.filename,
    title: plan.item.title,
    yearLabel: plan.item.yearLabel,
  }))
}

async function applyPlans(pool: Pool, plans: ImportPlan[]): Promise<ImportResult[]> {
  const copiedMediaPaths: string[] = []

  try {
    const results: ImportResult[] = []

    await pool.query('BEGIN')

    for (const plan of plans) {
      if (plan.action === 'add-company') {
        await addCompany(pool, plan.existing)
        results.push(resultFromPlan(plan, plan.existing.id))
        continue
      }

      if (plan.action === 'already-has-company') {
        results.push(resultFromPlan(plan, plan.existing.id))
        continue
      }

      results.push(await createDirectCasting(pool, plan.item, copiedMediaPaths))
    }

    await pool.query('COMMIT')
    return results
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => undefined)
    await Promise.all(copiedMediaPaths.map((mediaPath) => fs.unlink(mediaPath).catch(() => undefined)))
    throw error
  }
}

async function addCompany(pool: Pool, existing: ExistingDirectCasting) {
  await pool.query(
    `
      INSERT INTO direct_castings_company ("order", parent_id, value)
      VALUES (
        COALESCE((SELECT MAX("order") + 1 FROM direct_castings_company WHERE parent_id = $1), 0),
        $1,
        $2::"public"."enum_direct_castings_company"
      )
    `,
    [existing.id, COMPANY],
  )
}

async function createDirectCasting(
  pool: Pool,
  item: ImportItem,
  copiedMediaPaths: string[],
): Promise<ImportResult> {
  const created = await pool.query<{ id: number }>(
    `
      INSERT INTO direct_castings (
        title,
        year_label,
        display_status,
        published_at,
        author_name,
        slug
      )
      VALUES ($1, $2, 'published', $3, '배우앤배움 전체 센터', $4)
      RETURNING id
    `,
    [item.title, item.yearLabel, `${item.yearLabel}-01-01T00:00:00.000Z`, `pending-cna-${item.filename}`],
  )
  const directCastingId = created.rows[0]?.id

  if (!directCastingId) {
    throw new Error(`다이렉트캐스팅 생성 후 ID를 확인할 수 없습니다: ${item.filename}`)
  }

  await pool.query('UPDATE direct_castings SET slug = $1 WHERE id = $2', [String(directCastingId), directCastingId])
  await insertValues(pool, 'direct_castings_company', directCastingId, [COMPANY])
  await insertValues(pool, 'direct_castings_centers', directCastingId, CENTERS)

  const mediaId = await createMedia(pool, directCastingId, item, copiedMediaPaths)
  await pool.query('UPDATE direct_castings SET thumbnail_media_id = $1 WHERE id = $2', [mediaId, directCastingId])

  return {
    action: 'create',
    directCastingId,
    filename: item.filename,
    title: item.title,
    yearLabel: item.yearLabel,
  }
}

async function insertValues(pool: Pool, table: 'direct_castings_centers' | 'direct_castings_company', parentId: number, values: string[]) {
  for (const [order, value] of values.entries()) {
    await pool.query(
      `INSERT INTO ${table} ("order", parent_id, value) VALUES ($1, $2, $3)`,
      [order, parentId, value],
    )
  }
}

async function createMedia(
  pool: Pool,
  directCastingId: number,
  item: ImportItem,
  copiedMediaPaths: string[],
) {
  const sourcePath = resolveProjectPath(item.filePath)
  const destinationPath = resolveProjectPath('public/media', item.filename)
  const [metadata, stats] = await Promise.all([sharp(sourcePath).metadata(), fs.stat(sourcePath)])
  const prefix = path.posix.join('media/direct-castings/thumbnails', String(directCastingId))
  const url = `/api/media/file/${encodeURIComponent(item.filename)}?prefix=${encodeURIComponent(prefix)}`

  await fs.mkdir(path.dirname(destinationPath), { recursive: true })
  const copied = await copyMediaFile(sourcePath, destinationPath)

  if (copied) {
    copiedMediaPaths.push(destinationPath)
  }

  const media = await pool.query<{ id: number }>(
    `
      INSERT INTO media (
        alt,
        filename,
        filesize,
        height,
        mime_type,
        prefix,
        thumbnail_u_r_l,
        url,
        width
      )
      VALUES ($1, $2, $3, $4, 'image/jpeg', $5, $6, $6, $7)
      RETURNING id
    `,
    [
      `${item.title} 대표 이미지`,
      item.filename,
      stats.size,
      metadata.height ?? null,
      prefix,
      url,
      metadata.width ?? null,
    ],
  )
  const mediaId = media.rows[0]?.id

  if (!mediaId) {
    throw new Error(`미디어 생성 후 ID를 확인할 수 없습니다: ${item.filename}`)
  }

  return mediaId
}

async function copyMediaFile(sourcePath: string, destinationPath: string) {
  try {
    await fs.copyFile(sourcePath, destinationPath, fs.constants.COPYFILE_EXCL)
    return true
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error
    }

    const [source, destination] = await Promise.all([fs.readFile(sourcePath), fs.readFile(destinationPath)])

    if (!source.equals(destination)) {
      throw new Error(`같은 파일명으로 다른 미디어가 이미 있습니다: ${path.basename(destinationPath)}`)
    }

    return false
  }
}

function isAlreadyExistsError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')
}

function resultFromPlan(
  plan: Exclude<ImportPlan, { action: 'create' }>,
  directCastingId: number,
): ImportResult {
  return {
    action: plan.action,
    directCastingId,
    filename: plan.item.filename,
    title: plan.item.title,
    yearLabel: plan.item.yearLabel,
  }
}

function countByAction(results: ImportResult[]) {
  return results.reduce<Record<string, number>>((totals, result) => {
    totals[result.action] = (totals[result.action] ?? 0) + 1
    return totals
  }, {})
}

function parseArgs(args: string[]): Options {
  let outputPath = DEFAULT_OUTPUT_PATH
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--write') {
      write = true
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

  return { outputPath, write }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

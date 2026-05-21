import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

const execFileAsync = promisify(execFile)

type Options = {
  dryRun: boolean
  outputPath: string
  overwrite: boolean
  write: boolean
}

type LegacyArtistPressRow = {
  agencyLogoOriginalName?: string | null
  slug?: string | null
  title?: string | null
}

type ArtistPressRow = {
  agency_id: number | null
  agency_logo_media_id: number | null
  id: number
  slug: string
  title: string | null
}

type AgencyGroup = {
  agencyName: string
  isAmbiguous: boolean
  legacyRows: LegacyArtistPressRow[]
  logoMediaId: number | null
  originalName: string
  postIds: number[]
  sampleTitle?: string
  shouldAutoLink: boolean
  slug: string
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

  try {
    await assertSchemaReady(pool)

    const legacyRows = await readLegacyArtistPressRows()
    const artistPressRows = await readArtistPressRows(pool)
    const groups = buildAgencyGroups(legacyRows, artistPressRows)

    const reportRows = []
    let createdOrUpdated = 0
    let linked = 0
    let skippedExistingLink = 0
    let skippedManualReview = 0

    for (const group of groups) {
      let agencyId: number | undefined

      if (options.write) {
        agencyId = await upsertAgencyGroup(pool, group)
        createdOrUpdated += 1
      }

      if (!group.shouldAutoLink) {
        skippedManualReview += group.postIds.length
      } else if (options.write && agencyId) {
        const linkResult = await linkArtistPressRows(pool, {
          agencyId,
          overwrite: options.overwrite,
          postIds: group.postIds,
        })

        linked += linkResult.linked
        skippedExistingLink += linkResult.skippedExisting
      }

      reportRows.push({
        agencyId,
        agencyName: group.agencyName,
        isAmbiguous: group.isAmbiguous,
        linked: group.shouldAutoLink ? group.postIds.length : 0,
        logoMediaId: group.logoMediaId,
        originalName: group.originalName,
        sampleTitle: group.sampleTitle,
        shouldAutoLink: group.shouldAutoLink,
        slug: group.slug,
        useCount: group.legacyRows.length,
      })
    }

    const report = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      totals: {
        autoLinkableGroups: groups.filter((group) => group.shouldAutoLink).length,
        createdOrUpdated,
        groups: groups.length,
        legacyRows: legacyRows.length,
        linked,
        manualReviewGroups: groups.filter((group) => !group.shouldAutoLink).length,
        skippedExistingLink,
        skippedManualReview,
      },
      write: options.write,
      rows: reportRows,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), report)
    console.log(JSON.stringify(report.totals, null, 2))
    console.log(`report: ${options.outputPath}`)
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    dryRun: false,
    outputPath: 'tmp/legacy-assets/artist-press-agencies-backfill-report.json',
    overwrite: false,
    write: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--write') {
      options.write = true
      continue
    }

    if (arg === '--overwrite') {
      options.overwrite = true
      continue
    }

    if (arg === '--output') {
      const value = args[index + 1]

      if (!value) {
        throw new Error('--output 값이 필요합니다.')
      }

      options.outputPath = value
      index += 1
      continue
    }

    throw new Error(`지원하지 않는 옵션입니다: ${arg}`)
  }

  return options
}

async function assertSchemaReady(pool: Pool) {
  const { rows } = await pool.query<{ column_name: string }>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'artist_press'
      AND column_name IN ('agency_id', 'agency_logo_media_id', 'slug')
  `)

  const columns = new Set(rows.map((row) => row.column_name))

  if (!columns.has('agency_id') || !columns.has('agency_logo_media_id') || !columns.has('slug')) {
    throw new Error('artist_press.agency_id, agency_logo_media_id, slug 컬럼이 필요합니다.')
  }
}

async function readLegacyArtistPressRows(): Promise<LegacyArtistPressRow[]> {
  const query = `
    SELECT JSON_OBJECT(
      'slug', slug,
      'title', title,
      'agencyLogoOriginalName', agency_logo_original_name
    )
    FROM bnb_legacy_work.artist_press
    WHERE agency_logo_original_name IS NOT NULL
    ORDER BY agency_logo_original_name, slug
  `

  const { stdout } = await execFileAsync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'legacy-mariadb',
      'mariadb',
      '-uroot',
      '-proot',
      '--batch',
      '--raw',
      '--skip-column-names',
      '--execute',
      query,
    ],
    { maxBuffer: 1024 * 1024 * 64 },
  )

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LegacyArtistPressRow)
}

async function readArtistPressRows(pool: Pool): Promise<ArtistPressRow[]> {
  const { rows } = await pool.query<ArtistPressRow>(`
    SELECT id, slug, title, agency_logo_media_id, agency_id
    FROM artist_press
    WHERE slug IS NOT NULL
  `)

  return rows
}

function buildAgencyGroups(
  legacyRows: LegacyArtistPressRow[],
  artistPressRows: ArtistPressRow[],
): AgencyGroup[] {
  const artistPressBySlug = new Map(artistPressRows.map((row) => [row.slug, row]))
  const artistPressByTitle = uniqueArtistPressTitleMap(artistPressRows)
  const grouped = new Map<string, LegacyArtistPressRow[]>()

  for (const row of legacyRows) {
    const originalName = cleanText(row.agencyLogoOriginalName)
    const artistPressRow = findArtistPressRow(row, artistPressBySlug, artistPressByTitle)

    if (!originalName || !artistPressRow) {
      continue
    }

    grouped.set(originalName, [...(grouped.get(originalName) ?? []), row])
  }

  const usedKeys = new Set<string>()

  return Array.from(grouped.entries())
    .map(([originalName, rows]) => {
      const postRows = rows
        .map((row) => findArtistPressRow(row, artistPressBySlug, artistPressByTitle))
        .filter((row): row is ArtistPressRow => Boolean(row))
      const slug = uniqueSlug(slugFromOriginalName(originalName), usedKeys)
      const isAmbiguous = isAmbiguousOriginalName(originalName)
      const shouldAutoLink = !isAmbiguous && rows.length >= 2

      return {
        agencyName: agencyNameFromOriginalName(originalName),
        isAmbiguous,
        legacyRows: rows,
        logoMediaId: postRows.find((row) => row.agency_logo_media_id)?.agency_logo_media_id ?? null,
        originalName,
        postIds: postRows.map((row) => row.id),
        sampleTitle: cleanText(rows[0]?.title),
        shouldAutoLink,
        slug,
      }
    })
    .sort((a, b) => b.legacyRows.length - a.legacyRows.length || a.agencyName.localeCompare(b.agencyName))
}

function uniqueArtistPressTitleMap(rows: ArtistPressRow[]) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const title = cleanText(row.title)

    if (title) {
      counts.set(title, (counts.get(title) ?? 0) + 1)
    }
  }

  return new Map(
    rows
      .map((row) => [cleanText(row.title), row] as const)
      .filter((entry): entry is readonly [string, ArtistPressRow] => Boolean(entry[0]))
      .filter(([title]) => counts.get(title) === 1),
  )
}

function findArtistPressRow(
  legacyRow: LegacyArtistPressRow,
  bySlug: Map<string, ArtistPressRow>,
  byTitle: Map<string, ArtistPressRow>,
) {
  const slug = cleanText(legacyRow.slug)
  const title = cleanText(legacyRow.title)

  return (slug ? bySlug.get(slug) : undefined) ?? (title ? byTitle.get(title) : undefined)
}

async function upsertAgencyGroup(pool: Pool, group: AgencyGroup) {
  const { rows } = await pool.query<{ id: number }>(
    `
      INSERT INTO artist_press_agencies (
        agency_name,
        slug,
        logo_media_id,
        author_name,
        updated_at,
        created_at
      )
      VALUES ($1, $2, $3, '배우앤배움 아트센터', now(), now())
      ON CONFLICT (slug)
      DO UPDATE SET
        agency_name = EXCLUDED.agency_name,
        logo_media_id = COALESCE(artist_press_agencies.logo_media_id, EXCLUDED.logo_media_id),
        updated_at = now()
      RETURNING id
    `,
    [
      group.agencyName,
      group.slug,
      group.logoMediaId,
    ],
  )

  const agencyId = rows[0]?.id

  if (!agencyId) {
    throw new Error(`${group.slug} 소속사 설정을 저장하지 못했습니다.`)
  }

  await pool.query('DELETE FROM artist_press_agencies_centers WHERE parent_id = $1', [agencyId])
  await pool.query(
    `
      INSERT INTO artist_press_agencies_centers ("order", parent_id, value)
      VALUES (0, $1, 'art')
    `,
    [agencyId],
  )

  return agencyId
}

async function linkArtistPressRows(
  pool: Pool,
  {
    agencyId,
    overwrite,
    postIds,
  }: {
    agencyId: number
    overwrite: boolean
    postIds: number[]
  },
) {
  if (postIds.length === 0) {
    return { linked: 0, skippedExisting: 0 }
  }

  const existingResult = await pool.query<{ count: string }>(
    'SELECT count(*) FROM artist_press WHERE id = ANY($1::int[]) AND agency_id IS NOT NULL',
    [postIds],
  )
  const skippedExisting = overwrite ? 0 : Number(existingResult.rows[0]?.count ?? 0)
  const result = await pool.query(
    `
      UPDATE artist_press
      SET agency_id = $1, updated_at = now()
      WHERE id = ANY($2::int[])
        AND ($3::boolean OR agency_id IS NULL)
    `,
    [agencyId, postIds, overwrite],
  )

  return { linked: result.rowCount ?? 0, skippedExisting }
}

function agencyNameFromOriginalName(originalName: string) {
  const basename = originalName.replace(/\.[^.]+$/, '')
  const cleaned = basename
    .replace(/[_]+/g, ' ')
    .replace(/[-]+/g, ' ')
    .replace(/\b(real|logo|thumbnail)\b/gi, '')
    .replace(/로고|썸네일|세로형|가로형|최종|수정본/g, '')
    .replace(/\s*\d+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || basename.trim() || originalName
}

function slugFromOriginalName(originalName: string) {
  const base = agencyNameFromOriginalName(originalName)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const romanized = base
    .replace(/[가-힣]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return romanized || `legacy-${hashString(originalName)}`
}

function uniqueSlug(slug: string, usedKeys: Set<string>) {
  let nextSlug = slug
  let suffix = 2

  while (usedKeys.has(nextSlug)) {
    nextSlug = `${slug}-${suffix}`
    suffix += 1
  }

  usedKeys.add(nextSlug)

  return nextSlug
}

function isAmbiguousOriginalName(originalName: string) {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/\s+/g, '')

  return (
    base === 'logo' ||
    base === '로고' ||
    base === '로고2' ||
    base.includes('무로고') ||
    base.includes('nologo')
  )
}

function cleanText(value: unknown) {
  const text = String(value ?? '').trim()

  return text || undefined
}

function hashString(value: string) {
  let hash = 5381

  for (const char of value) {
    hash = (hash * 33) ^ char.charCodeAt(0)
  }

  return (hash >>> 0).toString(36)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

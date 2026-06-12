import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
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

type BroadcastStationCase = {
  logoSourcePatterns: RegExp[]
  matchPatterns: RegExp[]
  slug: string
  stationName: string
}

type LegacyLogoRow = {
  bfFile: string
  bfNo: number
  bfSource: string
  sourceDb: string
  wrId: number
}

type ScreenAppearanceRow = {
  broadcast_station_id: number | null
  id: number
  project_title: string | null
  title: string | null
}

type MatchedLogo = LegacyLogoRow & {
  localPath: string
}

type PreparedStation = {
  id?: number
  logo?: MatchedLogo
  logoMediaId?: number
  matchedRows: ScreenAppearanceRow[]
  station: BroadcastStationCase
}

type RowResult = {
  action: 'ambiguous' | 'dry-run' | 'linked' | 'missing-logo' | 'skipped-existing' | 'unmatched'
  broadcastStationId?: number
  existingBroadcastStationId?: number | null
  id: number
  matchedStations?: string[]
  projectTitle?: string | null
  stationSlug?: string
  title?: string | null
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

const MEDIA_PREFIX = 'media/broadcast-stations/logos'
const LOGO_TEMP_DIR = 'tmp/legacy-assets/broadcast-station-logos'

const broadcastStationCases: BroadcastStationCase[] = [
  {
    logoSourcePatterns: [/^sbs(?:[-_ ]?logo\d*)?\.(png|jpe?g)$/i],
    matchPatterns: [/\bSBS\b/i],
    slug: 'sbs',
    stationName: 'SBS',
  },
  {
    logoSourcePatterns: [/^mbc(?:[-_ ]?logo\d*)?\.(png|jpe?g)$/i, /^mbc-로고\.(png|jpe?g)$/i],
    matchPatterns: [/\bMBC\b/i],
    slug: 'mbc',
    stationName: 'MBC',
  },
  {
    logoSourcePatterns: [/^kbs(?:1|2)?(?:[_ -].*)?\.(png|jpe?g)$/i],
    matchPatterns: [/\bKBS(?:1|2)?\b/i],
    slug: 'kbs',
    stationName: 'KBS',
  },
  {
    logoSourcePatterns: [/^tvn(?:-\d+)?\.(png|jpe?g)$/i],
    matchPatterns: [/\btvN\b/i],
    slug: 'tvn',
    stationName: 'tvN',
  },
  {
    logoSourcePatterns: [/^jtbc\.(png|jpe?g)$/i],
    matchPatterns: [/\bJTBC\b/i],
    slug: 'jtbc',
    stationName: 'JTBC',
  },
  {
    logoSourcePatterns: [/^ocn\.(png|jpe?g)$/i],
    matchPatterns: [/\bOCN\b/i],
    slug: 'ocn',
    stationName: 'OCN',
  },
  {
    logoSourcePatterns: [/^mbn.*\.(png|jpe?g)$/i],
    matchPatterns: [/\bMBN\b/i],
    slug: 'mbn',
    stationName: 'MBN',
  },
  {
    logoSourcePatterns: [/^ena(?:[-_ ].*)?\.(png|jpe?g)$/i],
    matchPatterns: [/\bENA\b/i],
    slug: 'ena',
    stationName: 'ENA',
  },
  {
    logoSourcePatterns: [/^tving.*\.(png|jpe?g)$/i],
    matchPatterns: [/\bTVING\b/i, /티빙/i],
    slug: 'tving',
    stationName: 'TVING',
  },
  {
    logoSourcePatterns: [/^(?:wavve|웨이브)(?:[-_ ].*)?\.(png|jpe?g)$/i],
    matchPatterns: [/\bWavve\b/i, /웨이브/i],
    slug: 'wavve',
    stationName: 'Wavve',
  },
  {
    logoSourcePatterns: [/^(?:netflix|넷플릭스)(?:[-_ ]?(?:logo|로고))?\.(png|jpe?g)$/i],
    matchPatterns: [/\bNetflix\b/i, /넷플릭스/i],
    slug: 'netflix',
    stationName: 'Netflix',
  },
  {
    logoSourcePatterns: [/^(?:disney|디즈니플러스)(?:[-_ ]?(?:logo|로고))?\.(png|jpe?g)$/i],
    matchPatterns: [/\bDisney\+?\b/i, /디즈니(?:플러스|\+)/i],
    slug: 'disney-plus',
    stationName: 'Disney+',
  },
  {
    logoSourcePatterns: [/^(?:channel[-_ ]?a|채널a).*\.(png|jpe?g)$/i],
    matchPatterns: [/채널A/i, /Channel\s*A/i],
    slug: 'channel-a',
    stationName: '채널A',
  },
  {
    logoSourcePatterns: [/^(?:tv[-_ ]?chosun|tv조선).*\.(png|jpe?g)$/i],
    matchPatterns: [/TV조선/i, /TV\s*CHOSUN/i],
    slug: 'tv-chosun',
    stationName: 'TV조선',
  },
]

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
  const payload = options.write ? await getPayloadForWrite() : undefined

  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  try {
    await assertSchemaReady(pool)

    const [rows, legacyLogoRows] = await Promise.all([readScreenAppearanceRows(pool), readLegacyLogoRows()])
    const preparedStations = await prepareStations(rows, legacyLogoRows)
    const stationBySlug = new Map(preparedStations.map((entry) => [entry.station.slug, entry]))
    const rowResults: RowResult[] = []
    let createdMedia = 0
    let createdOrUpdatedStations = 0
    let linked = 0
    let reusedMedia = 0
    let skippedExistingLink = 0

    if (options.write && !payload) {
      throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
    }

    for (const prepared of preparedStations) {
      if (!prepared.logo || prepared.matchedRows.length === 0) {
        continue
      }

      if (options.write) {
        const mediaResult = await upsertLogoMedia({
          logo: prepared.logo,
          payload: payload as DynamicPayload,
          station: prepared.station,
        })
        prepared.logoMediaId = mediaResult.mediaId
        createdMedia += mediaResult.created ? 1 : 0
        reusedMedia += mediaResult.created ? 0 : 1
        prepared.id = await upsertBroadcastStation(pool, {
          logoMediaId: mediaResult.mediaId,
          overwrite: options.overwrite,
          station: prepared.station,
        })
        createdOrUpdatedStations += 1
      }
    }

    for (const row of rows) {
      const matches = matchStations(row)

      if (matches.length === 0) {
        rowResults.push(baseRowResult(row, { action: 'unmatched' }))
        continue
      }

      if (matches.length > 1) {
        rowResults.push(
          baseRowResult(row, {
            action: 'ambiguous',
            matchedStations: matches.map((station) => station.slug),
          }),
        )
        continue
      }

      const station = matches[0]
      const prepared = stationBySlug.get(station.slug)

      if (!prepared?.logo) {
        rowResults.push(baseRowResult(row, { action: 'missing-logo', stationSlug: station.slug }))
        continue
      }

      if (row.broadcast_station_id && !options.overwrite) {
        skippedExistingLink += 1
        rowResults.push(
          baseRowResult(row, {
            action: 'skipped-existing',
            existingBroadcastStationId: row.broadcast_station_id,
            stationSlug: station.slug,
          }),
        )
        continue
      }

      if (options.write) {
        if (!prepared.id) {
          throw new Error(`${station.slug} 방송사 id를 확인할 수 없습니다.`)
        }

        const updateResult = await linkScreenAppearance(pool, {
          broadcastStationId: prepared.id,
          overwrite: options.overwrite,
          row,
        })

        linked += updateResult.linked ? 1 : 0
        skippedExistingLink += updateResult.skippedExisting ? 1 : 0
        rowResults.push(
          baseRowResult(row, {
            action: updateResult.linked ? 'linked' : 'skipped-existing',
            broadcastStationId: prepared.id,
            existingBroadcastStationId: row.broadcast_station_id,
            stationSlug: station.slug,
          }),
        )
      } else {
        rowResults.push(baseRowResult(row, { action: 'dry-run', stationSlug: station.slug }))
      }
    }

    const report = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      logoCandidates: preparedStations.map((entry) => ({
        localPath: entry.logo?.localPath,
        logoOriginalName: entry.logo?.bfSource,
        matchedRows: entry.matchedRows.length,
        sourceDb: entry.logo?.sourceDb,
        stationName: entry.station.stationName,
        stationSlug: entry.station.slug,
        wrId: entry.logo?.wrId,
      })),
      options,
      rows: rowResults,
      totals: {
        ambiguousRows: count(rowResults, 'ambiguous'),
        createdMedia,
        createdOrUpdatedStations,
        dryRunRows: count(rowResults, 'dry-run'),
        linked,
        logoCandidateRows: legacyLogoRows.length,
        matchedRows: rowResults.filter((row) => row.action !== 'ambiguous' && row.action !== 'unmatched').length,
        missingLogoRows: count(rowResults, 'missing-logo'),
        reusedMedia,
        screenAppearanceRows: rows.length,
        skippedExistingLink,
        stationsWithLogo: preparedStations.filter((entry) => entry.logo).length,
        unmatchedRows: count(rowResults, 'unmatched'),
      },
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), report)
    console.log(JSON.stringify(report.totals, null, 2))
    console.log(`report: ${options.outputPath}`)
  } finally {
    await pool.end()
    await payload?.destroy()
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    dryRun: false,
    outputPath: 'tmp/legacy-assets/screen-appearance-broadcast-stations-backfill-report.json',
    overwrite: false,
    write: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--output') {
      options.outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--overwrite') {
      options.overwrite = true
      continue
    }

    if (arg === '--write') {
      options.write = true
      continue
    }

    throw new Error(`지원하지 않는 옵션입니다: ${arg}`)
  }

  return options
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function assertSchemaReady(pool: Pool) {
  const { rows } = await pool.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('broadcast_stations', 'screen_appearances', 'media')
  `)
  const tables = new Set(rows.map((row) => row.table_name))

  if (!tables.has('broadcast_stations') || !tables.has('screen_appearances') || !tables.has('media')) {
    throw new Error('broadcast_stations, screen_appearances, media 테이블이 필요합니다.')
  }

  const columnsResult = await pool.query<{ column_name: string }>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'screen_appearances'
      AND column_name = 'broadcast_station_id'
  `)

  if (columnsResult.rows.length === 0) {
    throw new Error('screen_appearances.broadcast_station_id 컬럼이 필요합니다.')
  }
}

async function readScreenAppearanceRows(pool: Pool): Promise<ScreenAppearanceRow[]> {
  const { rows } = await pool.query<ScreenAppearanceRow>(`
    SELECT id, title, project_title, broadcast_station_id
    FROM screen_appearances
    ORDER BY id ASC
  `)

  return rows
}

async function readLegacyLogoRows(): Promise<LegacyLogoRow[]> {
  const query = `
    SELECT JSON_OBJECT(
      'sourceDb', source_db,
      'wrId', wr_id,
      'bfNo', bf_no,
      'bfSource', bf_source,
      'bfFile', bf_file
    )
    FROM (
      SELECT 'baewoo' AS source_db, wr_id, bf_no, bf_source, bf_file
      FROM baewoo.g5_board_file
      WHERE bo_table = 'new_notice' AND bf_file IS NOT NULL AND bf_file <> ''
      UNION ALL
      SELECT 'kidscenter' AS source_db, wr_id, bf_no, bf_source, bf_file
      FROM kidscenter.g5_board_file
      WHERE bo_table = 'new_notice' AND bf_file IS NOT NULL AND bf_file <> ''
      UNION ALL
      SELECT 'bnbhighteen' AS source_db, wr_id, bf_no, bf_source, bf_file
      FROM bnbhighteen.g5_board_file
      WHERE bo_table = 'new_notice' AND bf_file IS NOT NULL AND bf_file <> ''
      UNION ALL
      SELECT 'bnbuniv' AS source_db, wr_id, bf_no, bf_source, bf_file
      FROM bnbuniv.g5_board_file
      WHERE bo_table = 'new_notice' AND bf_file IS NOT NULL AND bf_file <> ''
    ) candidates
    ORDER BY source_db, wr_id DESC, bf_no ASC
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
    .map((line) => normalizeLogoRow(JSON.parse(line) as Record<string, unknown>))
}

function normalizeLogoRow(row: Record<string, unknown>): LegacyLogoRow {
  return {
    bfFile: text(row.bfFile) ?? '',
    bfNo: toNumber(row.bfNo),
    bfSource: text(row.bfSource) ?? '',
    sourceDb: text(row.sourceDb) ?? '',
    wrId: toNumber(row.wrId),
  }
}

async function prepareStations(
  rows: ScreenAppearanceRow[],
  legacyLogoRows: LegacyLogoRow[],
): Promise<PreparedStation[]> {
  const matchedRowsByStation = new Map<string, ScreenAppearanceRow[]>()

  for (const row of rows) {
    const matches = matchStations(row)

    if (matches.length !== 1) {
      continue
    }

    const station = matches[0]
    const matchedRows = matchedRowsByStation.get(station.slug) ?? []
    matchedRows.push(row)
    matchedRowsByStation.set(station.slug, matchedRows)
  }

  const prepared: PreparedStation[] = []

  for (const station of broadcastStationCases) {
    prepared.push({
      logo: await selectLogoForStation(station, legacyLogoRows),
      matchedRows: matchedRowsByStation.get(station.slug) ?? [],
      station,
    })
  }

  return prepared
}

async function selectLogoForStation(
  station: BroadcastStationCase,
  legacyLogoRows: LegacyLogoRow[],
): Promise<MatchedLogo | undefined> {
  const candidates: MatchedLogo[] = []

  for (const row of legacyLogoRows) {
    if (!station.logoSourcePatterns.some((pattern) => pattern.test(row.bfSource))) {
      continue
    }

    const localPath = resolveLegacyLocalLogoPath(row)

    if (await localFileExists(localPath)) {
      candidates.push({ ...row, localPath })
    }
  }

  candidates.sort(compareLogoCandidates)

  return candidates[0]
}

function compareLogoCandidates(a: MatchedLogo, b: MatchedLogo) {
  const sourceDiff = sourceDbPriority(a.sourceDb) - sourceDbPriority(b.sourceDb)

  if (sourceDiff !== 0) {
    return sourceDiff
  }

  const wrDiff = b.wrId - a.wrId

  if (wrDiff !== 0) {
    return wrDiff
  }

  return a.bfNo - b.bfNo
}

function sourceDbPriority(sourceDb: string) {
  const priorities = ['baewoo', 'kidscenter', 'bnbhighteen', 'bnbuniv']
  const index = priorities.indexOf(sourceDb)

  return index === -1 ? priorities.length : index
}

function matchStations(row: Pick<ScreenAppearanceRow, 'project_title' | 'title'>) {
  const haystack = `${text(row.title) ?? ''} ${text(row.project_title) ?? ''}`

  return broadcastStationCases.filter((station) =>
    station.matchPatterns.some((pattern) => pattern.test(haystack)),
  )
}

async function upsertLogoMedia({
  logo,
  payload,
  station,
}: {
  logo: MatchedLogo
  payload: DynamicPayload
  station: BroadcastStationCase
}) {
  const filename = logoMediaFilename(station, logo)
  const existingMediaId = await findExistingLogoMediaId(filename, station)

  if (existingMediaId) {
    return { created: false, mediaId: existingMediaId }
  }

  const tempPath = resolveProjectPath(LOGO_TEMP_DIR, filename)
  await fs.mkdir(path.dirname(tempPath), { recursive: true })
  await fs.copyFile(resolveProjectPath(logo.localPath), tempPath)

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: `${station.stationName} 로고`,
      prefix: MEDIA_PREFIX,
    },
    filePath: tempPath,
    overrideAccess: true,
  })
  const id = Number(created.id)

  if (!Number.isFinite(id)) {
    throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
  }

  return { created: true, mediaId: id }
}

async function findExistingLogoMediaId(filename: string, station: BroadcastStationCase) {
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const pool = new Pool({ connectionString })

  try {
    const { rows } = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM media
        WHERE filename = $1
           OR (prefix = $2 AND alt = $3)
        ORDER BY id ASC
        LIMIT 1
      `,
      [filename, MEDIA_PREFIX, `${station.stationName} 로고`],
    )

    return rows[0]?.id
  } finally {
    await pool.end()
  }
}

async function upsertBroadcastStation(
  pool: Pool,
  {
    logoMediaId,
    overwrite,
    station,
  }: {
    logoMediaId: number
    overwrite: boolean
    station: BroadcastStationCase
  },
) {
  const { rows } = await pool.query<{ id: number }>(
    `
      INSERT INTO broadcast_stations (station_name, slug, logo_media_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE
      SET
        station_name = EXCLUDED.station_name,
        logo_media_id = CASE
          WHEN $4::boolean OR broadcast_stations.logo_media_id IS NULL THEN EXCLUDED.logo_media_id
          ELSE broadcast_stations.logo_media_id
        END,
        updated_at = NOW()
      RETURNING id
    `,
    [station.stationName, station.slug, logoMediaId, overwrite],
  )

  return rows[0].id
}

async function linkScreenAppearance(
  pool: Pool,
  {
    broadcastStationId,
    overwrite,
    row,
  }: {
    broadcastStationId: number
    overwrite: boolean
    row: ScreenAppearanceRow
  },
) {
  if (row.broadcast_station_id && !overwrite) {
    return { linked: false, skippedExisting: true }
  }

  const result = await pool.query(
    `
      UPDATE screen_appearances
      SET broadcast_station_id = $1,
          updated_at = NOW()
      WHERE id = $2
        AND ($3::boolean OR broadcast_station_id IS NULL)
    `,
    [broadcastStationId, row.id, overwrite],
  )

  return { linked: result.rowCount === 1, skippedExisting: result.rowCount !== 1 }
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

function resolveLegacyLocalLogoPath(row: LegacyLogoRow) {
  return path.join(
    'public',
    'legacy',
    'news',
    row.sourceDb,
    'new_notice',
    String(row.wrId),
    `file-${row.bfNo}`,
    row.bfFile,
  )
}

async function localFileExists(localPath: string) {
  try {
    const stat = await fs.stat(resolveProjectPath(localPath))
    return stat.isFile()
  } catch {
    return false
  }
}

function logoMediaFilename(station: BroadcastStationCase, logo: Pick<LegacyLogoRow, 'bfFile'>) {
  const extension = path.extname(logo.bfFile).toLowerCase() || '.png'

  return `broadcast-station-logo-${station.slug}${extension}`
}

function baseRowResult(row: ScreenAppearanceRow, result: Omit<RowResult, 'id' | 'projectTitle' | 'title'>): RowResult {
  return {
    id: row.id,
    projectTitle: row.project_title,
    title: row.title,
    ...result,
  }
}

function count(rows: RowResult[], action: RowResult['action']) {
  return rows.filter((row) => row.action === action).length
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

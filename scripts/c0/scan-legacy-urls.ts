import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type ScanTarget = {
  columns: string[]
  idColumn: string
  table: string
  titleColumn?: string
}

type Options = {
  collection: 'all' | string
  ids: string[]
  limit: 'all' | number
  outputPath?: string
}

type ExtractedUrl = {
  attribute: string
  kind: 'absolute' | 'css-url' | 'href' | 'raw-absolute' | 'raw-relative' | 'relative' | 'src'
  normalizedUrl: string
  url: string
}

type UrlSample = {
  attribute: string
  column: string
  id: number | string
  table: string
  title?: string
}

type UrlSummary = {
  count: number
  hostOrPrefix: string
  normalizedUrl: string
  samples: UrlSample[]
  url: string
}

const LEGACY_HOSTS = new Set([
  'baewoo.co.kr',
  'www.baewoo.co.kr',
  'baewoobaewoo.cafe24.com',
  'baewoo.kr',
  'www.baewoo.kr',
  'baewoo.me',
  'www.baewoo.me',
  'baewoo.net',
  'www.baewoo.net',
  'academy.baewoo.co.kr',
  'baewoorun.baewoo.co.kr',
  'bnbplay.baewoo.co.kr',
])

const TARGETS: ScanTarget[] = [
  { table: 'teachers', idColumn: 'id', titleColumn: 'name', columns: ['profile_image_path', 'legacy_meta'] },
  {
    table: 'teachers_gallery',
    idColumn: 'id',
    columns: ['profile_image_path', 'image_path', 'url', 'legacy_meta'],
  },
  {
    table: 'agencies',
    idColumn: 'id',
    titleColumn: 'name',
    columns: ['body_html', 'profile_image_path', 'legacy_meta'],
  },
  {
    table: 'agencies_actors',
    idColumn: 'id',
    titleColumn: 'name',
    columns: ['profile_image_path', 'legacy_meta'],
  },
  {
    table: 'profiles',
    idColumn: 'id',
    titleColumn: 'name',
    columns: ['body_html', 'profile_image_path', 'legacy_meta'],
  },
  { table: 'news', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'castings', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  {
    table: 'video_castings',
    idColumn: 'id',
    titleColumn: 'title',
    columns: ['youtube_url', 'legacy_meta'],
  },
  { table: 'banners', idColumn: 'id', titleColumn: 'title', columns: ['url', 'legacy_meta'] },
  {
    table: 'teacher_files',
    idColumn: 'id',
    titleColumn: 'title',
    columns: ['file_path', 'legacy_meta'],
  },
  { table: 'lineups', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'movies', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  {
    table: 'appearances',
    idColumn: 'id',
    titleColumn: 'title',
    columns: ['body_html', 'legacy_meta'],
  },
  {
    table: 'appearances_extra',
    idColumn: 'id',
    titleColumn: 'title',
    columns: ['body_html', 'legacy_meta'],
  },
  { table: 'star_cards', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'shoots', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'dramas', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'directings', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
  { table: 'reviews', idColumn: 'id', titleColumn: 'title', columns: ['body_html', 'legacy_meta'] },
]

const IMAGE_EXTENSION_RE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const selectedTargets = selectTargets(options)
    const result = await scanTargets(pool, selectedTargets, options)

    if (options.outputPath) {
      const outputPath = resolveProjectPath(options.outputPath)
      await writeJsonFile(outputPath, result)
      console.log(
        JSON.stringify(
          {
            documentsScanned: result.totals.documentsScanned,
            outputPath: options.outputPath,
            uniqueUrls: result.totals.uniqueUrls,
            urlOccurrences: result.totals.urlOccurrences,
          },
          null,
          2,
        ),
      )
      return
    }

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  let collection: Options['collection'] = 'all'
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--collection') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (!nextArg) {
        throw new Error('`--collection` 값이 비어 있습니다.')
      }

      collection = nextArg
      index += 1
      continue
    }

    if (arg === '--limit') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (nextArg === 'all') {
        limit = 'all'
        index += 1
        continue
      }

      const parsed = Number(nextArg)

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`잘못된 --limit 값입니다: ${nextArg}`)
      }

      limit = parsed
      index += 1
      continue
    }

    if (arg === '--ids') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (!nextArg) {
        throw new Error('`--ids` 값이 비어 있습니다.')
      }

      ids = nextArg
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--output') {
      const nextArg = String(args[index + 1] ?? '').trim()

      if (!nextArg) {
        throw new Error('`--output` 값이 비어 있습니다.')
      }

      outputPath = nextArg
      index += 1
    }
  }

  return { collection, ids, limit, outputPath }
}

function selectTargets(options: Options) {
  if (options.collection === 'all') {
    return TARGETS
  }

  const normalized = normalizeCollectionName(options.collection)
  const selected = TARGETS.filter((target) => target.table === normalized)

  if (selected.length === 0) {
    throw new Error(`지원하지 않는 collection/table 입니다: ${options.collection}`)
  }

  return selected
}

function normalizeCollectionName(value: string) {
  return value.trim().replaceAll('-', '_')
}

async function scanTargets(pool: Pool, targets: ScanTarget[], options: Options) {
  const byUrl = new Map<string, UrlSummary>()
  const byTable: Record<string, { documentsScanned: number; urlOccurrences: number; uniqueUrls: number }> = {}
  const byHostOrPrefix: Record<string, number> = {}
  const byKind: Record<string, number> = {}

  for (const target of targets) {
    const existingColumns = await getExistingColumns(pool, target)

    if (existingColumns.length === 0) {
      continue
    }

    const rows = await readRows(pool, target, existingColumns, options.limit, options.ids)
    let tableOccurrences = 0
    const tableUrls = new Set<string>()

    for (const row of rows) {
      for (const column of existingColumns) {
        const value = row[column]
        const text = stringifyScannableValue(value)

        if (!text) {
          continue
        }

        for (const extracted of extractLegacyUrls(text)) {
          const key = extracted.normalizedUrl
          const hostOrPrefix = classifyHostOrPrefix(extracted.normalizedUrl)
          const summary =
            byUrl.get(key) ??
            {
              count: 0,
              hostOrPrefix,
              normalizedUrl: extracted.normalizedUrl,
              samples: [],
              url: extracted.url,
            }

          summary.count += 1

          if (summary.samples.length < 5) {
            summary.samples.push({
              attribute: extracted.attribute,
              column,
              id: toSampleId(row[target.idColumn]),
              table: target.table,
              title: target.titleColumn ? toSampleTitle(row[target.titleColumn]) : undefined,
            })
          }

          byUrl.set(key, summary)
          byHostOrPrefix[hostOrPrefix] = (byHostOrPrefix[hostOrPrefix] ?? 0) + 1
          byKind[extracted.kind] = (byKind[extracted.kind] ?? 0) + 1
          tableOccurrences += 1
          tableUrls.add(key)
        }
      }
    }

    byTable[target.table] = {
      documentsScanned: rows.length,
      uniqueUrls: tableUrls.size,
      urlOccurrences: tableOccurrences,
    }
  }

  const uniqueUrls = Array.from(byUrl.values()).sort((left, right) => right.count - left.count)

  return {
    generatedAt: new Date().toISOString(),
    options,
    totals: {
      documentsScanned: Object.values(byTable).reduce((sum, item) => sum + item.documentsScanned, 0),
      uniqueUrls: uniqueUrls.length,
      urlOccurrences: uniqueUrls.reduce((sum, item) => sum + item.count, 0),
    },
    byHostOrPrefix: sortRecord(byHostOrPrefix),
    byKind: sortRecord(byKind),
    byTable,
    uniqueUrls,
  }
}

async function getExistingColumns(pool: Pool, target: ScanTarget) {
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = ANY($2::text[])
    `,
    [target.table, target.columns],
  )
  const existing = new Set(result.rows.map((row) => row.column_name))
  return target.columns.filter((column) => existing.has(column))
}

async function readRows(
  pool: Pool,
  target: ScanTarget,
  columns: string[],
  limit: 'all' | number,
  ids: string[] = [],
): Promise<Array<Record<string, unknown>>> {
  const selectedColumns = new Set([target.idColumn, ...columns])

  if (target.titleColumn) {
    selectedColumns.add(target.titleColumn)
  }

  const selectSql = Array.from(selectedColumns)
    .map((column) => `"${column}"`)
    .join(', ')
  const params: unknown[] = []
  const whereSql =
    ids.length > 0
      ? ` WHERE "${target.idColumn}"::text = ANY($${params.push(ids)}::text[])`
      : ''
  const limitSql = limit === 'all' ? '' : ` LIMIT ${limit}`

  const result = await pool.query<Record<string, unknown>>(
    `SELECT ${selectSql} FROM "${target.table}"${whereSql} ORDER BY "${target.idColumn}" ASC${limitSql}`,
    params,
  )

  return result.rows
}

function toSampleId(value: unknown): number | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return String(value ?? '')
}

function toSampleTitle(value: unknown): string | undefined {
  const title = String(value ?? '').trim()
  return title ? title : undefined
}

function stringifyScannableValue(value: unknown): string {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}

function extractLegacyUrls(text: string): ExtractedUrl[] {
  const matches: ExtractedUrl[] = []
  const structuredUrls = new Set<string>()

  for (const match of text.matchAll(/<img\b[^>]*\s(src)=["']([^"']+)["'][^>]*>/gi)) {
    pushIfLegacy(matches, match[2], 'src', match[1] ?? 'src', structuredUrls)
  }

  for (const match of text.matchAll(/<a\b[^>]*\s(href)=["']([^"']+)["'][^>]*>/gi)) {
    if (looksLikeImageUrl(match[2])) {
      pushIfLegacy(matches, match[2], 'href', match[1] ?? 'href', structuredUrls)
    }
  }

  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    pushIfLegacy(matches, match[1], 'css-url', 'style', structuredUrls)
  }

  for (const match of text.matchAll(/https?:\/\/[A-Za-z0-9_.:-]+\/[^\s"'<>),\\]+/g)) {
    if (structuredUrls.has(normalizeLegacyUrl(match[0]) ?? '')) {
      continue
    }

    pushIfLegacy(matches, match[0], 'raw-absolute', 'raw')
  }

  for (const match of text.matchAll(/(?:^|[\s"'(=])((?:\/data|\/web\/img)\/[^\s"'<>),\\]+)/g)) {
    if (structuredUrls.has(normalizeLegacyUrl(match[1]) ?? '')) {
      continue
    }

    pushIfLegacy(matches, match[1], 'raw-relative', 'raw')
  }

  return dedupeExtracted(matches)
}

function pushIfLegacy(
  matches: ExtractedUrl[],
  value: string | undefined,
  kind: ExtractedUrl['kind'],
  attribute: string,
  structuredUrls?: Set<string>,
) {
  const url = cleanUrl(value)

  if (!url) {
    return
  }

  const normalizedUrl = normalizeLegacyUrl(url)

  if (!normalizedUrl) {
    return
  }

  matches.push({
    attribute,
    kind,
    normalizedUrl,
    url,
  })

  structuredUrls?.add(normalizedUrl)
}

function cleanUrl(value: string | undefined) {
  return decodeHtmlEntities(String(value ?? '').trim())
    .replace(/^url\(["']?/, '')
    .replace(/["']?\)$/, '')
}

function decodeHtmlEntities(value: string) {
  return value.replaceAll('&amp;', '&').replaceAll('&#038;', '&')
}

function normalizeLegacyUrl(value: string): string | undefined {
  if (value.startsWith('/data/') || value.startsWith('/web/img/')) {
    return `https://www.baewoo.co.kr${value}`
  }

  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    return undefined
  }

  if (!isLegacyHost(parsed.hostname)) {
    return undefined
  }

  if (!looksLikeImageUrl(parsed.pathname) && !isKnownLegacyPath(parsed.pathname)) {
    return undefined
  }

  parsed.hash = ''
  parsed.protocol = 'https:'
  parsed.hostname = normalizeLegacyHost(parsed.hostname)
  parsed.port = ''

  return parsed.toString()
}

function normalizeLegacyHost(hostname: string) {
  const normalized = hostname.toLowerCase()

  if (normalized === 'baewoo.co.kr') {
    return 'www.baewoo.co.kr'
  }

  return normalized
}

function isLegacyHost(hostname: string) {
  const normalized = hostname.toLowerCase()

  return LEGACY_HOSTS.has(normalized) || normalized.endsWith('.baewoo.co.kr')
}

function looksLikeImageUrl(value: string | undefined) {
  if (!value) {
    return false
  }

  const path = value.split(/[?#]/, 1)[0] ?? ''
  return IMAGE_EXTENSION_RE.test(path)
}

function isKnownLegacyPath(pathname: string) {
  return (
    pathname.startsWith('/data/') ||
    pathname.startsWith('/web/img/') ||
    pathname.startsWith('/web/data/')
  )
}

function dedupeExtracted(matches: ExtractedUrl[]) {
  const seen = new Set<string>()
  const deduped: ExtractedUrl[] = []

  for (const match of matches) {
    const key = `${match.kind}:${match.normalizedUrl}:${match.attribute}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(match)
  }

  return deduped
}

function classifyHostOrPrefix(url: string) {
  const parsed = new URL(url)

  if (parsed.pathname.startsWith('/data/')) {
    return '/data/'
  }

  if (parsed.pathname.startsWith('/web/img/')) {
    return '/web/img/'
  }

  if (parsed.pathname.startsWith('/web/data/')) {
    return '/web/data/'
  }

  return parsed.hostname
}

function sortRecord(record: Record<string, number>) {
  return Object.fromEntries(Object.entries(record).sort((left, right) => right[1] - left[1]))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

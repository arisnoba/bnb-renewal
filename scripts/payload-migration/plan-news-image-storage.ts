import fs from 'node:fs/promises'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  outputPath: string
}

type NewsRow = {
  body_html: string | null
  id: number
  legacy_meta: unknown
  source_db: string | null
  source_id: number | null
  source_table: string | null
  thumbnail_path: string | null
  title: string | null
}

type LegacyAttachment = {
  fileName?: string
  fileNo?: number
  filesize?: number
  localPath?: string
  originalName?: string
  path?: string
  role?: string
}

type Candidate = {
  bytes?: number
  exists: boolean
  fileNo?: number
  legacyPath?: string
  localPath: string
  originalName?: string
  role: string
}

type PlanEntry = {
  candidates: Candidate[]
  kind: 'board-file' | 'editor' | 'other'
  legacyUrl: string
  localPath?: string
  newsId: number
  normalizedUrl: string
  pathname: string
  replacementPolicy: 'direct' | 'manual-required'
  sourceDb?: string
  sourceId?: number
  sourceTable?: string
  status: 'needs-review' | 'resolved-local' | 'unresolved'
  title?: string
}

const IMAGE_EXTENSION_RE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const rows = await readNewsRows(pool)
    const entries: PlanEntry[] = []

    for (const row of rows) {
      const attachments = readLegacyAttachments(row.legacy_meta)
      const candidates = await buildCandidates(row, attachments)

      for (const image of extractImageSources(row.body_html ?? '')) {
        const normalizedUrl = normalizeLegacyUrl(image)

        if (!normalizedUrl) {
          continue
        }

        entries.push(await buildPlanEntry(row, image, normalizedUrl, candidates))
      }
    }

    const output = {
      generatedAt: new Date().toISOString(),
      options,
      totals: buildTotals(rows, entries),
      byKind: countBy(entries, (entry) => entry.kind),
      byStatus: countBy(entries, (entry) => entry.status),
      entries,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          byKind: output.byKind,
          byStatus: output.byStatus,
          outputPath: options.outputPath,
          totals: output.totals,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  let outputPath = 'tmp/legacy-assets/news-storage-plan.json'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
    }
  }

  return { outputPath }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readNewsRows(pool: Pool): Promise<NewsRow[]> {
  const result = await pool.query<NewsRow>(
    `
      SELECT
        id,
        title,
        body_html,
        thumbnail_path,
        legacy_meta,
        source_db,
        source_table,
        source_id
      FROM news
      WHERE body_html IS NOT NULL
      ORDER BY id ASC
    `,
  )

  return result.rows
}

function readLegacyAttachments(value: unknown): LegacyAttachment[] {
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

function attachmentFromRecord(value: Record<string, unknown>): LegacyAttachment {
  return {
    fileName: text(value.fileName),
    fileNo: numberOrUndefined(value.fileNo),
    filesize: numberOrUndefined(value.filesize),
    localPath: text(value.localPath),
    originalName: text(value.originalName),
    path: text(value.path),
    role: text(value.role),
  }
}

async function buildCandidates(row: NewsRow, attachments: LegacyAttachment[]) {
  const byLocalPath = new Map<string, Candidate>()
  const thumbnailPath = normalizeLegacyPath(row.thumbnail_path)

  for (const attachment of attachments) {
    const localPath = normalizeLocalPath(attachment.localPath)

    if (!localPath) {
      continue
    }

    const role = attachment.role ?? (attachment.fileNo == null ? 'attachment' : `file-${attachment.fileNo}`)
    const candidate: Candidate = {
      bytes: attachment.filesize,
      exists: await localFileExists(localPath),
      fileNo: attachment.fileNo,
      legacyPath: normalizeLegacyPath(attachment.path),
      localPath,
      originalName: attachment.originalName,
      role,
    }

    byLocalPath.set(candidate.localPath, candidate)
  }

  if (thumbnailPath) {
    for (const candidate of byLocalPath.values()) {
      if (candidate.legacyPath === thumbnailPath) {
        candidate.role = candidate.role === 'thumbnail' ? candidate.role : `thumbnail:${candidate.role}`
      }
    }
  }

  return Array.from(byLocalPath.values()).sort(compareCandidates)
}

async function buildPlanEntry(
  row: NewsRow,
  legacyUrl: string,
  normalizedUrl: string,
  candidates: Candidate[],
): Promise<PlanEntry> {
  const parsed = new URL(normalizedUrl)
  const pathname = parsed.pathname
  const kind = imageKind(pathname)
  const directCandidate = findDirectCandidate(pathname, candidates)
  const sourceDb = text(row.source_db)
  const sourceTable = text(row.source_table)
  const sourceId = numberOrUndefined(row.source_id)
  const base = {
    candidates,
    kind,
    legacyUrl,
    newsId: row.id,
    normalizedUrl,
    pathname,
    sourceDb,
    sourceId,
    sourceTable,
    title: text(row.title),
  }

  if (directCandidate?.exists) {
    return {
      ...base,
      localPath: directCandidate.localPath,
      replacementPolicy: 'direct',
      status: 'resolved-local',
    }
  }

  if (kind === 'editor' && candidates.length > 0) {
    return {
      ...base,
      replacementPolicy: 'manual-required',
      status: 'needs-review',
    }
  }

  return {
    ...base,
    replacementPolicy: 'manual-required',
    status: 'unresolved',
  }
}

function extractImageSources(value: string) {
  const sources: string[] = []

  for (const match of value.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = decodeHtmlEntities(String(match[1] ?? '').trim())

    if (src) {
      sources.push(src)
    }
  }

  return sources
}

function normalizeLegacyUrl(value: string): string | undefined {
  const cleaned = decodeHtmlEntities(value).trim()

  if (!cleaned) {
    return undefined
  }

  if (cleaned.startsWith('/web/data/') || cleaned.startsWith('/web/img/') || cleaned.startsWith('/data/')) {
    return `https://www.baewoo.co.kr${cleaned}`
  }

  let parsed: URL

  try {
    parsed = new URL(cleaned)
  } catch {
    return undefined
  }

  if (!isLegacyHost(parsed.hostname) || !looksLikeImageUrl(parsed.pathname)) {
    return undefined
  }

  parsed.hash = ''
  parsed.protocol = 'https:'
  parsed.hostname = normalizeLegacyHost(parsed.hostname)
  parsed.port = ''

  return parsed.toString()
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

function findDirectCandidate(pathname: string, candidates: Candidate[]) {
  const normalizedPath = normalizeLegacyPath(pathname)

  if (!normalizedPath) {
    return undefined
  }

  return candidates.find((candidate) => candidate.legacyPath === normalizedPath)
}

function imageKind(pathname: string): PlanEntry['kind'] {
  if (pathname.startsWith('/web/data/editor/')) {
    return 'editor'
  }

  if (pathname.startsWith('/web/data/file/')) {
    return 'board-file'
  }

  return 'other'
}

async function localFileExists(localPath: string) {
  try {
    const stat = await fs.stat(resolveProjectPath(localPath))
    return stat.isFile()
  } catch {
    return false
  }
}

function buildTotals(rows: NewsRow[], entries: PlanEntry[]) {
  return {
    candidateFiles: new Set(entries.flatMap((entry) => entry.candidates.map((candidate) => candidate.localPath))).size,
    documentsScanned: rows.length,
    imageOccurrences: entries.length,
    missingCandidateFiles: new Set(
      entries.flatMap((entry) =>
        entry.candidates
          .filter((candidate) => !candidate.exists)
          .map((candidate) => candidate.localPath),
      ),
    ).size,
    uniqueLegacyUrls: new Set(entries.map((entry) => entry.normalizedUrl)).size,
  }
}

function countBy<T extends string>(entries: PlanEntry[], getKey: (entry: PlanEntry) => T) {
  const counts: Partial<Record<T, number>> = {}

  for (const entry of entries) {
    const key = getKey(entry)
    counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.fromEntries(Object.entries(counts).sort((left, right) => Number(right[1]) - Number(left[1])))
}

function compareCandidates(left: Candidate, right: Candidate) {
  const leftRank = candidateRank(left)
  const rightRank = candidateRank(right)

  if (leftRank !== rightRank) {
    return leftRank - rightRank
  }

  return (left.fileNo ?? 9999) - (right.fileNo ?? 9999)
}

function candidateRank(candidate: Candidate) {
  if (candidate.role.startsWith('thumbnail')) return 0
  if (candidate.role === 'file-0') return 1
  return 2
}

function decodeHtmlEntities(value: string) {
  return value.replaceAll('&amp;', '&').replaceAll('&#038;', '&')
}

function normalizeLegacyHost(hostname: string) {
  const normalized = hostname.toLowerCase()

  if (normalized === 'baewoo.co.kr') return 'www.baewoo.co.kr'
  if (normalized === 'www.baewoo.me') return 'baewoo.me'
  if (normalized === 'www.baewoo.net') return 'baewoo.net'
  if (normalized === 'www.baewoo.kr') return 'baewoo.kr'

  return normalized
}

function isLegacyHost(hostname: string) {
  const normalized = hostname.toLowerCase()

  return (
    normalized === 'baewoo.co.kr' ||
    normalized === 'www.baewoo.co.kr' ||
    normalized === 'baewoobaewoo.cafe24.com' ||
    normalized === 'baewoo.kr' ||
    normalized === 'www.baewoo.kr' ||
    normalized === 'baewoo.me' ||
    normalized === 'www.baewoo.me' ||
    normalized === 'baewoo.net' ||
    normalized === 'www.baewoo.net' ||
    normalized.endsWith('.baewoo.co.kr')
  )
}

function looksLikeImageUrl(value: string | undefined) {
  if (!value) {
    return false
  }

  const path = value.split(/[?#]/, 1)[0] ?? ''
  return IMAGE_EXTENSION_RE.test(path)
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

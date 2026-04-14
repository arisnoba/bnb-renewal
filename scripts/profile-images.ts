import path from 'node:path'

import { parseInsertFile, type LegacyRow } from './legacy-sql'

const LEGACY_PROFILE_BASE_URL = 'https://www.baewoo.co.kr'
export const LEGACY_PROFILE_BOARD = 'new_profile'

export type LegacyBoardFile = {
  bfFile: string
  bfNo: number
  bfSource: string
  boTable: string
  wrId: number
}

export type LegacyProfileImageManifestEntry = {
  fileName: string
  publicPath: string
  remotePath: string
  sourceId: number
  sourceUrl: string
}

export async function loadLegacyProfileImageUrlMap(
  projectRoot: string,
): Promise<Map<number, string>> {
  const profileRows = await loadLegacyProfileRows(projectRoot)
  const boardFilesById = await loadLegacyProfileBoardFilesById(projectRoot)

  const resolvedEntries = profileRows
    .filter((row) => Number(row.wr_is_comment ?? 0) === 0)
    .map((row) => {
      const sourceId = Number(row.wr_id ?? 0)
      const imageUrl = resolveLegacyProfileImageUrl(
        row,
        boardFilesById.get(sourceId) ?? [],
      )

      return imageUrl ? [sourceId, imageUrl] : null
    })
    .filter((entry): entry is [number, string] => entry !== null)

  return new Map(resolvedEntries)
}

export async function loadLegacyProfileImageManifest(
  projectRoot: string,
): Promise<LegacyProfileImageManifestEntry[]> {
  const imageUrlMap = await loadLegacyProfileImageUrlMap(projectRoot)

  return [...imageUrlMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([sourceId, sourceUrl]) => {
      const target = buildProfileImageDownloadTarget({
        projectRoot,
        sourceId,
        sourceUrl,
      })

      return {
        fileName: path.posix.basename(new URL(sourceUrl).pathname),
        publicPath: target.publicPath,
        remotePath: `web/data/file/${LEGACY_PROFILE_BOARD}/${path.posix.basename(
          new URL(sourceUrl).pathname,
        )}`,
        sourceId,
        sourceUrl,
      }
    })
}

export function resolveLegacyProfileImageUrl(
  row: LegacyRow,
  attachments: LegacyBoardFile[],
): string | undefined {
  const boardFileUrl = attachments
    .filter((attachment) => isImageFilename(attachment.bfFile || attachment.bfSource))
    .sort((left, right) => left.bfNo - right.bfNo)[0]

  if (boardFileUrl) {
    return buildLegacyBoardFileUrl(boardFileUrl.boTable, boardFileUrl.bfFile)
  }

  const htmlSources = extractImageSourcesFromHtml(String(row.wr_content ?? ''))

  for (const source of htmlSources) {
    const normalized = normalizeLegacyImageUrl(source)

    if (normalized) {
      return normalized
    }
  }

  return undefined
}

export function isRemoteProfileImagePath(value?: string | null): value is string {
  return /^https?:\/\//i.test(String(value ?? '').trim())
}

export function buildProfileImageDownloadTarget({
  projectRoot,
  sourceId,
  sourceUrl,
}: {
  projectRoot: string
  sourceId: number
  sourceUrl: string
}) {
  const fileName = sanitizeFileName(path.posix.basename(new URL(sourceUrl).pathname))
  const relativePath = path.posix.join('legacy', 'profiles', String(sourceId), fileName)

  return {
    absolutePath: path.join(projectRoot, 'public', relativePath),
    publicPath: `/${relativePath}`,
  }
}

async function loadLegacyBoardFiles(filePath: string): Promise<LegacyBoardFile[]> {
  const rows = await parseInsertFile(filePath)

  return rows.map((row) => ({
    bfFile: String(row.bf_file ?? '').trim(),
    bfNo: Number(row.bf_no ?? 0),
    bfSource: String(row.bf_source ?? '').trim(),
    boTable: String(row.bo_table ?? '').trim(),
    wrId: Number(row.wr_id ?? 0),
  }))
}

async function loadLegacyProfileRows(projectRoot: string) {
  return parseInsertFile(path.join(projectRoot, 'data/baewoo-curated/p1/g5_write_new_profile.sql'))
}

async function loadLegacyProfileBoardFilesById(projectRoot: string) {
  const boardFiles = await loadLegacyBoardFiles(
    path.join(projectRoot, 'data/baewoo-split/tables/g5_board_file.sql'),
  )

  return indexLegacyBoardFiles(boardFiles, LEGACY_PROFILE_BOARD)
}

function indexLegacyBoardFiles(rows: LegacyBoardFile[], boTable: string) {
  const result = new Map<number, LegacyBoardFile[]>()

  for (const row of rows) {
    if (row.boTable !== boTable || !row.bfFile) {
      continue
    }

    const items = result.get(row.wrId) ?? []
    items.push(row)
    result.set(row.wrId, items)
  }

  return result
}

function buildLegacyBoardFileUrl(boTable: string, fileName: string) {
  const encodedSegments = ['web', 'data', 'file', boTable, fileName].map((segment) =>
    encodeURIComponent(segment),
  )

  return `${LEGACY_PROFILE_BASE_URL}/${encodedSegments.join('/')}`
}

function extractImageSourcesFromHtml(html: string): string[] {
  const sources: string[] = []

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const source = String(match[1] ?? '').trim()

    if (source) {
      sources.push(source)
    }
  }

  return sources
}

function normalizeLegacyImageUrl(source: string): string | undefined {
  if (!source) {
    return undefined
  }

  if (/^https?:\/\//i.test(source)) {
    return source
  }

  if (source.startsWith('//')) {
    return `https:${source}`
  }

  if (source.startsWith('/')) {
    return `${LEGACY_PROFILE_BASE_URL}${source}`
  }

  return `${LEGACY_PROFILE_BASE_URL}/web/${source.replace(/^\.?\//, '')}`
}

function isImageFilename(value: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value)
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^A-Za-z0-9._-]/g, '_')
}

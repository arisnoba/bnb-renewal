import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
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
  allowRemoteFetch: boolean
  dryRun: boolean
  ids: number[]
  limit: 'all' | number
  outputPath: string
  publishedFrom: string
  write: boolean
}

type NewsRow = {
  body: unknown
  id: number
  slug: string | null
  title: string | null
}

type ImageMatch = {
  mediaFileName: string
  mediaId?: number
  src: string
}

type RowResult = {
  action: 'dry-run' | 'skipped-no-pending-upload' | 'skipped-unresolved-image' | 'updated'
  imageCount: number
  images: ImageMatch[]
  newsId: number
  slug?: string
  title?: string
  unresolvedImages: string[]
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

const MEDIA_PREFIX = 'media/news/body-images'
const HOST_BY_SOURCE_DB: Record<string, string> = {
  baewoo: 'https://www.baewoo.co.kr',
  bnbhighteen: 'https://www.baewoo.me',
  bnbuniv: 'https://www.baewoo.kr',
  kidscenter: 'https://www.baewoo.net',
}
const CANONICAL_HOST_BY_HOST: Record<string, string> = {
  'baewoo.co.kr': 'www.baewoo.co.kr',
  'baewoobaewoo.cafe24.com': 'www.baewoo.co.kr',
  'bnbhighteen.cafe24.com': 'www.baewoo.me',
  'bnbuniv.cafe24.com': 'www.baewoo.kr',
  'kidscenter.cafe24.com': 'www.baewoo.net',
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  if (options.write && !options.allowRemoteFetch) {
    throw new Error('본문 이미지를 원격 URL에서 가져오려면 --allow-remote-fetch 를 명시해야 합니다.')
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
    const rows = await readNewsRows(pool, options)
    const results: RowResult[] = []

    for (const row of rows) {
      results.push(await processRow({ options, payload, pool, row }))
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      options,
      totals: buildTotals(results),
      write: options.write,
      rows: results,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
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
  let allowRemoteFetch = false
  let dryRun = false
  let ids: number[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/news-body-media-backfill-report.json'
  let publishedFrom = '2020-01-01'
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--allow-remote-fetch') {
      allowRemoteFetch = true
      continue
    }

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--ids') {
      ids = readRequiredValue(args, index, '--ids')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
      index += 1
      continue
    }

    if (arg === '--limit') {
      const value = readRequiredValue(args, index, '--limit')
      limit = value === 'all' ? 'all' : Number(value)

      if (limit !== 'all' && (!Number.isFinite(limit) || limit <= 0)) {
        throw new Error(`잘못된 --limit 값입니다: ${value}`)
      }

      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--published-from') {
      publishedFrom = readRequiredValue(args, index, '--published-from')

      if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedFrom)) {
        throw new Error(`--published-from 값은 YYYY-MM-DD 형식이어야 합니다: ${publishedFrom}`)
      }

      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { allowRemoteFetch, dryRun, ids, limit, outputPath, publishedFrom, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = args[index + 1]

  if (!value) {
    throw new Error(`${name} 값을 입력해야 합니다.`)
  }

  return value
}

async function readNewsRows(pool: Pool, options: Options) {
  const values: unknown[] = [options.publishedFrom]
  const conditions = [
    `published_at >= $1::timestamptz`,
    `body IS NOT NULL`,
    `body::text LIKE '%"pending"%'`,
  ]

  if (options.ids.length > 0) {
    values.push(options.ids)
    conditions.push(`id = ANY($${values.length}::int[])`)
  }

  const limitClause = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<NewsRow>(
    `
      SELECT id, slug, title, body
      FROM news
      WHERE ${conditions.join(' AND ')}
      ORDER BY id ASC
      ${limitClause}
    `,
    values,
  )

  return result.rows
}

async function processRow({
  options,
  payload,
  pool,
  row,
}: {
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: NewsRow
}): Promise<RowResult> {
  const body = cloneJson(row.body)
  const pendingNodes = collectPendingUploadNodes(body)

  if (pendingNodes.length === 0) {
    return baseRowResult(row, 'skipped-no-pending-upload')
  }

  const images: ImageMatch[] = []
  const unresolvedImages: string[] = []

  for (const node of pendingNodes) {
    const src = text(toRecord(node.pending)?.src)
    const sourceUrl = src ? normalizeSourceUrl(src, row) : undefined

    if (!sourceUrl) {
      unresolvedImages.push(src || '(empty)')
      continue
    }

    const mediaFileName = buildMediaFileName(row, sourceUrl)
    const mediaId = options.write
      ? await ensureMediaForImage({
          mediaFileName,
          payload,
          pool,
          row,
          sourceUrl,
        }).catch((error: unknown) => {
          unresolvedImages.push(`${sourceUrl} (${error instanceof Error ? error.message : String(error)})`)
          return undefined
        })
      : undefined

    if (mediaId) {
      replacePendingUploadNode(node, mediaId)
    }

    images.push({
      mediaFileName,
      mediaId,
      src: sourceUrl,
    })
  }

  if (unresolvedImages.length > 0) {
    return {
      ...baseRowResult(row, 'skipped-unresolved-image'),
      imageCount: images.length,
      images,
      unresolvedImages,
    }
  }

  normalizeUploadNodes(body)

  if (options.dryRun) {
    return {
      ...baseRowResult(row, 'dry-run'),
      imageCount: images.length,
      images,
    }
  }

  await pool.query('UPDATE news SET body = $1::jsonb, updated_at = now() WHERE id = $2', [
    JSON.stringify(body),
    row.id,
  ])

  return {
    ...baseRowResult(row, 'updated'),
    imageCount: images.length,
    images,
  }
}

async function ensureMediaForImage({
  mediaFileName,
  payload,
  pool,
  row,
  sourceUrl,
}: {
  mediaFileName: string
  payload?: DynamicPayload
  pool: Pool
  row: NewsRow
  sourceUrl: string
}) {
  const existingMediaId = await findExistingMediaId(pool, mediaFileName)

  if (existingMediaId) {
    return existingMediaId
  }

  if (!payload) {
    throw new Error('media 생성에는 Payload 클라이언트가 필요합니다.')
  }

  const tempPath = await downloadToTempMediaFile(sourceUrl, mediaFileName)

  try {
    const created = await createMediaWithRepair({
      mediaFileName,
      payload,
      row,
      tempPath,
    })
    const id = Number(created.id)

    if (!Number.isFinite(id)) {
      throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
    }

    return id
  } finally {
    await fs.rm(path.dirname(tempPath), { force: true, recursive: true }).catch(() => undefined)
  }
}

async function createMediaWithRepair({
  mediaFileName,
  payload,
  row,
  tempPath,
}: {
  mediaFileName: string
  payload: DynamicPayload
  row: NewsRow
  tempPath: string
}) {
  const createArgs = (filePath: string) => ({
    collection: 'media' as const,
    data: {
      alt: row.title || mediaFileName,
      prefix: MEDIA_PREFIX,
    },
    filePath,
    overrideAccess: true,
  })

  try {
    return await payload.create(createArgs(tempPath))
  } catch (error) {
    const repairedPath = await repairImageForUpload(tempPath)

    try {
      return await payload.create(createArgs(repairedPath))
    } catch {
      throw error
    } finally {
      await fs.unlink(repairedPath).catch(() => undefined)
    }
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>('SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1', [
    fileName,
  ])

  return result.rows[0]?.id
}

async function downloadToTempMediaFile(sourceUrl: string, mediaFileName: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'news-body-media-'))
  const tempPath = path.join(tempDir, mediaFileName)
  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error(`외부 이미지 다운로드 실패: ${response.status}`)
  }

  await fs.writeFile(tempPath, Buffer.from(await response.arrayBuffer()))

  return tempPath
}

async function repairImageForUpload(localPath: string) {
  const { default: sharp } = await import('sharp')
  const repairedDir = path.join(os.tmpdir(), 'bnb-news-body-repair')
  const repairedPath = path.join(repairedDir, `${Date.now()}-${path.basename(localPath, path.extname(localPath))}.jpg`)

  await fs.mkdir(repairedDir, { recursive: true })
  await sharp(localPath, { failOn: 'none' }).jpeg({ quality: 90 }).toFile(repairedPath)

  return repairedPath
}

function buildMediaFileName(row: NewsRow, sourceUrl: string) {
  const pathname = pathFromUrl(sourceUrl)
  const extension = imageExtension(path.extname(pathname).toLowerCase())
  const baseName = sanitizeFileName(path.basename(pathname, path.extname(pathname)))
  const hash = crypto.createHash('sha1').update(sourceUrl).digest('hex').slice(0, 10)

  return `news-body-${row.id}-${hash}-${baseName}${extension}`
}

function pathFromUrl(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}

function imageExtension(value: string) {
  return ['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(value) ? value : '.jpg'
}

function sanitizeFileName(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'image'
  )
}

function collectPendingUploadNodes(value: unknown) {
  const nodes: Array<Record<string, unknown>> = []

  visit(value, (node) => {
    if (node.type === 'upload' && isRecord(node.pending)) {
      nodes.push(node)
    }
  })

  return nodes
}

function replacePendingUploadNode(node: Record<string, unknown>, mediaId: number) {
  delete node.pending
  node.fields = isRecord(node.fields) ? node.fields : {}
  node.relationTo = 'media'
  node.value = mediaId
}

function normalizeUploadNodes(value: unknown) {
  unwrapUploadOnlyParagraphs(value)
  normalizeUploadNodeValues(value)
}

function unwrapUploadOnlyParagraphs(value: unknown) {
  if (!value || typeof value !== 'object') {
    return
  }

  if ('root' in value) {
    unwrapUploadOnlyParagraphs((value as { root?: unknown }).root)
  }

  if (!('children' in value) || !Array.isArray((value as { children?: unknown }).children)) {
    return
  }

  const record = value as { children: unknown[] }

  record.children = record.children.flatMap((child: unknown) => {
    if (!child || typeof child !== 'object') {
      return [child]
    }

    unwrapUploadOnlyParagraphs(child)

    const childRecord = child as { children?: unknown[]; format?: unknown; type?: unknown }

    if (childRecord.type !== 'paragraph' || !Array.isArray(childRecord.children)) {
      return [child]
    }

    if (!childRecord.children.some(isUploadNodeRecord)) {
      return [child]
    }

    return splitParagraphAroundUploads(childRecord)
  })
}

function splitParagraphAroundUploads(paragraph: { children?: unknown[]; format?: unknown; type?: unknown }) {
  const result: unknown[] = []
  let paragraphChildren: unknown[] = []

  const flushParagraph = () => {
    const visibleChildren = paragraphChildren.filter((item) => !isIgnorableUploadParagraphChild(item))

    if (visibleChildren.length === 0) {
      paragraphChildren = []
      return
    }

    result.push({
      ...paragraph,
      children: paragraphChildren,
    })
    paragraphChildren = []
  }

  for (const child of paragraph.children ?? []) {
    if (isUploadNodeRecord(child)) {
      flushParagraph()
      result.push({
        ...child,
        format: typeof paragraph.format === 'string' ? paragraph.format : '',
      })
      continue
    }

    paragraphChildren.push(child)
  }

  flushParagraph()

  return result.length > 0 ? result : [paragraph]
}

function normalizeUploadNodeValues(value: unknown) {
  if (!value || typeof value !== 'object') {
    return
  }

  if (isUploadNodeRecord(value) && typeof value.value === 'string') {
    const parsed = Number(value.value)

    if (Number.isFinite(parsed)) {
      value.value = parsed
    }
  }

  if ('children' in value && Array.isArray((value as { children?: unknown }).children)) {
    for (const child of (value as { children: unknown[] }).children) {
      normalizeUploadNodeValues(child)
    }
  }

  if ('root' in value) {
    normalizeUploadNodeValues((value as { root?: unknown }).root)
  }
}

function visit(value: unknown, callback: (node: Record<string, unknown>) => void) {
  if (!isRecord(value)) {
    return
  }

  callback(value)

  if (Array.isArray(value.children)) {
    for (const child of value.children) {
      visit(child, callback)
    }
  }

  if (isRecord(value.root)) {
    visit(value.root, callback)
  }
}

function isUploadNodeRecord(value: unknown): value is { type: 'upload'; value?: unknown } & Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && (value as { type?: unknown }).type === 'upload')
}

function isIgnorableUploadParagraphChild(value: unknown) {
  if (!value || typeof value !== 'object') {
    return true
  }

  const type = (value as { type?: unknown }).type

  if (type === 'linebreak') {
    return true
  }

  if (type === 'text') {
    const textValue = String((value as { text?: unknown }).text ?? '').replace(/\u00a0/g, '').trim()

    return !textValue
  }

  return false
}

function baseRowResult(row: NewsRow, action: RowResult['action']): RowResult {
  return {
    action,
    imageCount: 0,
    images: [],
    newsId: row.id,
    slug: row.slug ?? undefined,
    title: row.title ?? undefined,
    unresolvedImages: [],
  }
}

function buildTotals(results: RowResult[]) {
  return {
    createdOrExistingImages: results.reduce((sum, row) => sum + row.images.filter((image) => image.mediaId).length, 0),
    dryRunImages: results.reduce((sum, row) => sum + row.images.length, 0),
    dryRunRows: count(results, 'dry-run'),
    rows: results.length,
    skippedNoPendingUpload: count(results, 'skipped-no-pending-upload'),
    skippedUnresolvedImage: count(results, 'skipped-unresolved-image'),
    unresolvedImages: results.reduce((sum, row) => sum + row.unresolvedImages.length, 0),
    updatedRows: count(results, 'updated'),
  }
}

function count(results: RowResult[], action: RowResult['action']) {
  return results.filter((result) => result.action === action).length
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

function cloneJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as unknown
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function normalizeSourceUrl(value: string, row: NewsRow) {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return undefined
  }

  if (trimmed.startsWith('//')) {
    return canonicalizeUrl(`https:${trimmed}`)
  }

  if (isHttpUrl(trimmed)) {
    return canonicalizeUrl(trimmed)
  }

  if (trimmed.startsWith('/')) {
    return canonicalizeUrl(`${hostForNews(row)}${trimmed}`)
  }

  if (trimmed.startsWith('web/') || trimmed.startsWith('data/')) {
    return canonicalizeUrl(`${hostForNews(row)}/${trimmed}`)
  }

  return undefined
}

function canonicalizeUrl(value: string) {
  try {
    const url = new URL(value)
    url.protocol = 'https:'

    const canonicalHost = CANONICAL_HOST_BY_HOST[url.hostname.toLowerCase()]

    if (canonicalHost) {
      url.hostname = canonicalHost
    }

    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = ''
    }

    return url.href
  } catch {
    return value
  }
}

function hostForNews(row: NewsRow) {
  const sourceDb = row.slug?.match(/^news-([a-z]+)-\d+$/)?.[1]

  return sourceDb ? (HOST_BY_SOURCE_DB[sourceDb] ?? HOST_BY_SOURCE_DB.baewoo) : HOST_BY_SOURCE_DB.baewoo
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

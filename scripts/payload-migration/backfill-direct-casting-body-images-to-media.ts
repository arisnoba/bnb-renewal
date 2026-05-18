import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  BlockquoteFeature,
  convertHTMLToLexical,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
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
  ids: number[]
  inputPath: string
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  write: boolean
}

type DirectCastingRow = {
  body: unknown
  body_html: string | null
  id: number
  slug: string | null
  title: string | null
}

type DownloadReportEntry = {
  localPath?: string
  localUrl?: string
  normalizedUrl?: string
  originalSrc?: string
  slug?: string
  sourceUrl?: string
  title?: string
  workId?: number
}

type ImageSource = DownloadReportEntry & {
  remoteSrc?: string
}

type ImageMatch = {
  localPath?: string
  localUrl?: string
  mediaFileName: string
  mediaId?: number
  remoteSrc?: string
  src: string
}

type RowResult = {
  action: 'dry-run' | 'skipped-empty-html' | 'skipped-existing-body' | 'skipped-unresolved-image' | 'updated'
  directCastingId: number
  imageCount: number
  images: ImageMatch[]
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

const MEDIA_PREFIX = 'media/direct-castings/body-images'

const directCastingBodyEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
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
    const reportEntries = await readDownloadReportEntries(options.inputPath)
    const imageSources = buildImageSourceMap(reportEntries)
    const rows = await readDirectCastingRows(pool, options)
    const results: RowResult[] = []
    const config = await (await import('../../payload.config')).default
    const editorAdapter = await directCastingBodyEditor({
      config,
      parentIsLocalized: false,
    })

    for (const row of rows) {
      results.push(
        await processRow({
          editorConfig: editorAdapter.editorConfig,
          imageSources,
          options,
          payload,
          pool,
          row,
        }),
      )
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      inputPath: options.inputPath,
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
  let dryRun = false
  let ids: number[] = []
  let inputPath = 'tmp/legacy-assets/direct-castings-image-download-report.json'
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/direct-castings-body-media-backfill-report.json'
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
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
      index += 1
      continue
    }

    if (arg === '--input') {
      inputPath = readRequiredValue(args, index, '--input')
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

    if (arg === '--overwrite') {
      overwrite = true
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, ids, inputPath, limit, outputPath, overwrite, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = args[index + 1]

  if (!value) {
    throw new Error(`${name} 값을 입력해야 합니다.`)
  }

  return value
}

async function readDirectCastingRows(pool: Pool, options: Options) {
  const values: unknown[] = []
  const conditions = ["body_html IS NOT NULL", "trim(body_html) <> ''"]

  if (!options.overwrite) {
    conditions.push("(body IS NULL OR body::text = 'null' OR body::text = '\"null\"')")
  }

  if (options.ids.length > 0) {
    values.push(options.ids)
    conditions.push(`id = ANY($${values.length}::int[])`)
  }

  const limitClause = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<DirectCastingRow>(
    `
      SELECT id, slug, title, body, body_html
      FROM direct_castings
      WHERE ${conditions.join(' AND ')}
      ORDER BY id ASC
      ${limitClause}
    `,
    values,
  )

  return result.rows
}

async function readDownloadReportEntries(inputPath: string): Promise<DownloadReportEntry[]> {
  const raw = await fs.readFile(resolveProjectPath(inputPath), 'utf8')
  const parsed = JSON.parse(raw) as { entries?: unknown }

  return Array.isArray(parsed.entries) ? parsed.entries.filter(isRecord) : []
}

function buildImageSourceMap(entries: DownloadReportEntry[]) {
  const map = new Map<string, DownloadReportEntry>()

  for (const entry of entries) {
    if (!entry.localPath || !entry.localUrl) {
      continue
    }

    for (const value of [entry.localUrl, entry.normalizedUrl, entry.originalSrc, entry.sourceUrl]) {
      for (const key of sourceKeys(value)) {
        map.set(key, entry)
      }
    }
  }

  return map
}

function sourceKeys(value: unknown) {
  if (typeof value !== 'string') {
    return []
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  const keys = new Set<string>([trimmed])

  try {
    keys.add(decodeURI(trimmed))
  } catch {
    // ignore malformed percent encodings
  }

  try {
    const url = new URL(trimmed, 'https://www.baewoo.co.kr')
    keys.add(url.href)
    keys.add(url.pathname)
    keys.add(decodeURI(url.pathname))
  } catch {
    // ignore non-URL values
  }

  return [...keys]
}

async function processRow({
  editorConfig,
  imageSources,
  options,
  payload,
  pool,
  row,
}: {
  editorConfig: Parameters<typeof convertHTMLToLexical>[0]['editorConfig']
  imageSources: Map<string, DownloadReportEntry>
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: DirectCastingRow
}): Promise<RowResult> {
  const html = row.body_html?.trim() ?? ''

  if (!html) {
    return baseRowResult(row, 'skipped-empty-html')
  }

  const transformed = await transformHtmlImages({
    html,
    imageSources,
    options,
    payload,
    pool,
    row,
  })

  if (transformed.unresolvedImages.length > 0) {
    return {
      ...baseRowResult(row, 'skipped-unresolved-image'),
      imageCount: transformed.images.length,
      images: transformed.images,
      unresolvedImages: transformed.unresolvedImages,
    }
  }

  const body = convertHTMLToLexical({
    editorConfig,
    html: transformed.html,
    JSDOM,
  })
  normalizeUploadNodes(body)

  if (options.dryRun) {
    return {
      ...baseRowResult(row, 'dry-run'),
      imageCount: transformed.images.length,
      images: transformed.images,
    }
  }

  if (!payload) {
    throw new Error('write 모드에는 Payload 클라이언트가 필요합니다.')
  }

  await pool.query('UPDATE direct_castings SET body = $1::jsonb, updated_at = now() WHERE id = $2', [
    JSON.stringify(body),
    row.id,
  ])

  return {
    ...baseRowResult(row, 'updated'),
    imageCount: transformed.images.length,
    images: transformed.images,
  }
}

async function transformHtmlImages({
  html,
  imageSources,
  options,
  payload,
  pool,
  row,
}: {
  html: string
  imageSources: Map<string, DownloadReportEntry>
  options: Options
  payload?: DynamicPayload
  pool: Pool
  row: DirectCastingRow
}) {
  const dom = new JSDOM(`<body>${html}</body>`)
  const images: ImageMatch[] = []
  const unresolvedImages: string[] = []

  for (const img of Array.from(dom.window.document.querySelectorAll('img'))) {
    const src = img.getAttribute('src')?.trim() ?? ''
    const entry = findImageSource(src, imageSources)

    if (!entry?.localPath) {
      unresolvedImages.push(src)
      continue
    }

    const mediaFileName = buildMediaFileName(entry, src)
    const mediaId = options.write
      ? await ensureMediaForImage({
          entry,
          mediaFileName,
          payload,
          pool,
          row,
        })
      : undefined

    if (mediaId) {
      img.setAttribute('data-lexical-upload-id', String(mediaId))
      img.setAttribute('data-lexical-upload-relation-to', 'media')
    }

    images.push({
      localPath: entry.localPath ? normalizeLocalPath(entry.localPath) : undefined,
      localUrl: entry.localUrl,
      mediaFileName,
      mediaId,
      remoteSrc: entry.remoteSrc,
      src,
    })
  }

  return {
    html: dom.window.document.body.innerHTML,
    images,
    unresolvedImages,
  }
}

function findImageSource(src: string, imageSources: Map<string, DownloadReportEntry>): ImageSource | undefined {
  for (const key of sourceKeys(src)) {
    const entry = imageSources.get(key)

    if (entry) {
      return entry
    }
  }

  return undefined
}

async function ensureMediaForImage({
  entry,
  mediaFileName,
  payload,
  pool,
  row,
}: {
  entry: ImageSource
  mediaFileName: string
  payload?: DynamicPayload
  pool: Pool
  row: DirectCastingRow
}) {
  const existingMediaId = await findExistingMediaId(pool, mediaFileName)

  if (existingMediaId) {
    return existingMediaId
  }

  if (!payload) {
    throw new Error('media 생성에는 Payload 클라이언트가 필요합니다.')
  }

  const tempPath = await copyToTempMediaFile(entry, mediaFileName)

  try {
    const created = await payload.create({
      collection: 'media',
      data: {
        alt: entry.title || row.title || mediaFileName,
        prefix: MEDIA_PREFIX,
      },
      filePath: tempPath,
      overrideAccess: true,
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

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>('SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1', [
    fileName,
  ])

  return result.rows[0]?.id
}

async function copyToTempMediaFile(entry: ImageSource, mediaFileName: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'direct-castings-body-media-'))
  const tempPath = path.join(tempDir, mediaFileName)
  const localPath = entry.localPath

  if (!localPath) {
    throw new Error('로컬 이미지 경로가 없는 항목은 media로 등록할 수 없습니다.')
  }

  const sourcePath = resolveProjectPath(normalizeLocalPath(localPath))
  await fs.copyFile(sourcePath, tempPath)

  return tempPath
}

function buildMediaFileName(entry: ImageSource, fallbackSrc: string) {
  const source = entry.localPath ? normalizeLocalPath(entry.localPath) : entry.remoteSrc || fallbackSrc
  const pathname = pathFromUrlOrText(source)
  const extension = path.extname(pathname).toLowerCase()
  const baseName = sanitizeFileName(path.basename(pathname, extension))
  const hash = crypto.createHash('sha1').update(entry.localUrl ?? entry.remoteSrc ?? source).digest('hex').slice(0, 10)
  const workId = Number.isFinite(entry.workId) ? entry.workId : 'unknown'

  return `direct-castings-body-${workId}-${hash}-${baseName}${extension || '.jpg'}`
}

function pathFromUrlOrText(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
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

function normalizeLocalPath(value: string) {
  if (value.startsWith('public/')) {
    return value
  }

  if (value.startsWith('/')) {
    return `public${value}`
  }

  return value
}

function hasLexicalContent(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const root = (value as { root?: { children?: unknown } }).root

  return Array.isArray(root?.children) && root.children.length > 0
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
    unwrapUploadOnlyParagraphs(value.root)
  }

  if (!('children' in value) || !Array.isArray(value.children)) {
    return
  }

  value.children = value.children.flatMap((child: unknown) => {
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

  if ('children' in value && Array.isArray(value.children)) {
    for (const child of value.children) {
      normalizeUploadNodeValues(child)
    }
  }

  if ('root' in value) {
    normalizeUploadNodeValues(value.root)
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
    const text = String((value as { text?: unknown }).text ?? '').replace(/\u00a0/g, '').trim()

    return !text
  }

  return false
}

function baseRowResult(row: DirectCastingRow, action: RowResult['action']): RowResult {
  return {
    action: hasLexicalContent(row.body) && action === 'skipped-existing-body' ? 'skipped-existing-body' : action,
    directCastingId: row.id,
    imageCount: 0,
    images: [],
    slug: row.slug ?? undefined,
    title: row.title ?? undefined,
    unresolvedImages: [],
  }
}

function buildTotals(results: RowResult[]) {
  return {
    createdOrExistingImages: results.reduce((sum, row) => sum + row.images.length, 0),
    dryRunRows: count(results, 'dry-run'),
    rows: results.length,
    skippedEmptyHtml: count(results, 'skipped-empty-html'),
    skippedExistingBody: count(results, 'skipped-existing-body'),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

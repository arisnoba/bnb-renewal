import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

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

import configPromise from '../../payload.config'

const execFileAsync = promisify(execFile)

type Options = {
  dryRun: boolean
  limit: 'all' | number
  progressEvery: number
  sourceIds: Set<string>
}

type ScreenAppearanceRow = {
  bodyHtml: string
  id: string
  sourceDb: string
  sourceId: string
  title: string
}

type ImageResult = {
  mediaId?: number
  sourceUrl: string
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '../..')

const screenAppearanceBodyEditor = lexicalEditor({
  admin: {
    placeholder: '본문을 입력하세요.',
  },
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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const rows = limitRows(filterRows(await readRowsFromLegacyMariaDB(), options), options.limit)
    const config = await configPromise
    const adapter = await screenAppearanceBodyEditor({
      config,
      parentIsLocalized: false,
    })
    const mediaCache = new Map<string, ImageResult>()
    const summary = {
      dryRun: options.dryRun,
      images: 0,
      rows: rows.length,
      skippedEmptyHtml: 0,
      updatedRows: 0,
      uniqueImages: 0,
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]

      if (!row.bodyHtml.trim()) {
        summary.skippedEmptyHtml += 1
        continue
      }

      const transformed = await transformHtmlImages({
        html: row.bodyHtml,
        mediaCache,
        options,
        pool,
        row,
      })
      const body = convertHTMLToLexical({
        editorConfig: adapter.editorConfig,
        html: transformed.html,
        JSDOM,
      })

      normalizeUploadNodes(body)
      summary.images += transformed.images

      if (!options.dryRun) {
        await pool.query(
          `
            UPDATE screen_appearances
            SET body = $1::jsonb,
                updated_at = now()
            WHERE source_db = $2
              AND source_id = $3::numeric
          `,
          [JSON.stringify(body), row.sourceDb, row.sourceId],
        )
        summary.updatedRows += 1
      }

      if ((index + 1) % options.progressEvery === 0) {
        console.log(
          JSON.stringify({
            processed: index + 1,
            rows: rows.length,
            updatedRows: summary.updatedRows,
            uniqueImages: mediaCache.size,
          }),
        )
      }
    }

    summary.uniqueImages = mediaCache.size
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    dryRun: true,
    limit: 'all',
    progressEvery: 50,
    sourceIds: new Set(),
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--write') {
      options.dryRun = false
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg.startsWith('--limit=')) {
      options.limit = parseLimit(arg.replace('--limit=', ''))
      continue
    }

    if (arg === '--limit') {
      options.limit = parseLimit(readRequiredValue(args, index, '--limit'))
      index += 1
      continue
    }

    if (arg.startsWith('--source-ids=')) {
      addSourceIds(options.sourceIds, arg.replace('--source-ids=', ''))
      continue
    }

    if (arg === '--source-ids') {
      addSourceIds(options.sourceIds, readRequiredValue(args, index, '--source-ids'))
      index += 1
      continue
    }

    if (arg.startsWith('--progress-every=')) {
      options.progressEvery = parsePositiveInt(arg.replace('--progress-every=', ''), '--progress-every')
      continue
    }

    if (arg === '--progress-every') {
      options.progressEvery = parsePositiveInt(readRequiredValue(args, index, '--progress-every'), '--progress-every')
      index += 1
    }
  }

  return options
}

function parseLimit(value: string): Options['limit'] {
  if (value === 'all') {
    return 'all'
  }

  return parsePositiveInt(value, '--limit')
}

function parsePositiveInt(value: string, label: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} 값이 잘못되었습니다: ${value}`)
  }

  return parsed
}

function readRequiredValue(args: string[], index: number, label: string) {
  const value = args[index + 1]

  if (!value) {
    throw new Error(`${label} 값이 필요합니다.`)
  }

  return value
}

function addSourceIds(target: Set<string>, value: string) {
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => target.add(item))
}

function filterRows(rows: ScreenAppearanceRow[], options: Options) {
  if (options.sourceIds.size === 0) {
    return rows
  }

  return rows.filter((row) => options.sourceIds.has(row.sourceId))
}

function limitRows(rows: ScreenAppearanceRow[], limit: Options['limit']) {
  return limit === 'all' ? rows : rows.slice(0, limit)
}

async function readRowsFromLegacyMariaDB(): Promise<ScreenAppearanceRow[]> {
  const query = `
    SELECT
      CAST(id AS CHAR),
      source_db,
      CAST(source_id AS CHAR),
      HEX(COALESCE(title, '')),
      HEX(COALESCE(body_html, ''))
    FROM bnb_legacy_work.screen_appearances
    ORDER BY id ASC
  `
  const stdout = await execDocker([
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
  ])

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, sourceDb, sourceId, titleHex, bodyHtmlHex] = line.split('\t')

      return {
        bodyHtml: fromHex(bodyHtmlHex),
        id,
        sourceDb,
        sourceId,
        title: fromHex(titleHex),
      }
    })
}

async function execDocker(args: string[]) {
  const dockerArgs = dockerHostArgs()
  const { stdout } = await execFileAsync('docker', [...dockerArgs, ...args], {
    cwd: projectRoot,
    maxBuffer: 1024 * 1024 * 512,
  })

  return stdout
}

function dockerHostArgs() {
  const configured = process.env.DOCKER_HOST?.trim()

  if (configured) {
    return ['--host', configured]
  }

  const colimaSocket = path.join(os.homedir(), '.colima/default/docker.sock')

  if (existsSync(colimaSocket)) {
    return ['--host', `unix://${colimaSocket}`]
  }

  return []
}

function fromHex(value: string | undefined) {
  return Buffer.from(value ?? '', 'hex').toString('utf8')
}

async function transformHtmlImages({
  html,
  mediaCache,
  options,
  pool,
  row,
}: {
  html: string
  mediaCache: Map<string, ImageResult>
  options: Options
  pool: Pool
  row: ScreenAppearanceRow
}) {
  const dom = new JSDOM(`<body>${html}</body>`)
  const images = Array.from(dom.window.document.querySelectorAll('img'))

  dom.window.document.querySelectorAll('script, style').forEach((element) => element.remove())

  for (const image of images) {
    const sourceUrl = normalizeSourceUrl(image.getAttribute('src'))

    if (!sourceUrl) {
      continue
    }

    image.setAttribute('src', sourceUrl)

    if (options.dryRun) {
      mediaCache.set(sourceUrl, { sourceUrl })
      continue
    }

    const result = await ensureMediaForImage({
      mediaCache,
      pool,
      row,
      sourceUrl,
    })

    if (result.mediaId) {
      image.setAttribute('data-lexical-upload-id', String(result.mediaId))
      image.setAttribute('data-lexical-upload-relation-to', 'media')
    }
  }

  return {
    html: dom.window.document.body.innerHTML,
    images: images.length,
  }
}

function normalizeSourceUrl(value: string | null) {
  const src = value?.trim()

  if (!src) {
    return undefined
  }

  try {
    const url = new URL(src, 'https://www.baewoo.co.kr')

    if (url.protocol === 'http:') {
      url.protocol = 'https:'
    }

    return url.href
  } catch {
    return undefined
  }
}

async function ensureMediaForImage({
  mediaCache,
  pool,
  row,
  sourceUrl,
}: {
  mediaCache: Map<string, ImageResult>
  pool: Pool
  row: ScreenAppearanceRow
  sourceUrl: string
}) {
  const cached = mediaCache.get(sourceUrl)

  if (cached?.mediaId) {
    return cached
  }

  const mediaFileName = buildMediaFileName(sourceUrl)
  const existingMediaId = await findExistingMediaId(pool, mediaFileName)

  if (existingMediaId) {
    const result = { mediaId: existingMediaId, sourceUrl }
    mediaCache.set(sourceUrl, result)
    return result
  }

  const mediaId = await createExternalMediaRecord({
    alt: row.title || mediaFileName,
    fileName: mediaFileName,
    pool,
    sourceUrl,
  })

  const result = { mediaId, sourceUrl }
  mediaCache.set(sourceUrl, result)

  return result
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>('SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1', [
    fileName,
  ])

  return result.rows[0]?.id
}

async function createExternalMediaRecord({
  alt,
  fileName,
  pool,
  sourceUrl,
}: {
  alt: string
  fileName: string
  pool: Pool
  sourceUrl: string
}) {
  const result = await pool.query<{ id: number }>(
    `
      INSERT INTO media (
        alt,
        external_url,
        url,
        thumbnail_u_r_l,
        filename,
        mime_type,
        prefix,
        updated_at,
        created_at
      )
      VALUES ($1, $2, $2, $2, $3, $4, 'media', now(), now())
      ON CONFLICT (filename) DO UPDATE
      SET external_url = EXCLUDED.external_url,
          url = EXCLUDED.url,
          thumbnail_u_r_l = EXCLUDED.thumbnail_u_r_l,
          mime_type = EXCLUDED.mime_type,
          updated_at = now()
      RETURNING id
    `,
    [alt, sourceUrl, fileName, mimeTypeFromFileName(fileName)],
  )

  return result.rows[0].id
}

function buildMediaFileName(sourceUrl: string) {
  const url = new URL(sourceUrl)
  const extension = path.extname(url.pathname) || '.jpg'
  const baseName = sanitizeFileName(path.basename(url.pathname, extension)) || 'image'
  const hash = createHash('sha1').update(sourceUrl).digest('hex').slice(0, 10)

  return `screen-appearance-body-${hash}-${baseName}${extension.toLowerCase()}`
}

function mimeTypeFromFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === '.png') {
    return 'image/png'
  }

  if (extension === '.gif') {
    return 'image/gif'
  }

  if (extension === '.webp') {
    return 'image/webp'
  }

  return 'image/jpeg'
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
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

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

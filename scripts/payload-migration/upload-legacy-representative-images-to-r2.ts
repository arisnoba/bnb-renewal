import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { uploadR2Object } from '../../src/lib/r2'
import {
  buildCompactR2MediaFilename,
  buildR2MediaObjectKey,
  getR2MediaPrefix,
  isR2MediaRole,
  type R2MediaRole,
} from '../../src/lib/r2ObjectKeys'
import { resolveProjectPath, writeJsonFile } from './runtime'

type Options = {
  concurrency: number
  dryRun: boolean
  outputPath: string
  roles: R2MediaRole[]
  write: boolean
}

type ReportEntry = {
  assetRole?: string
  collection?: string
  localPath?: string
  sourceDb?: string
  sourceId?: number | string
  sourceTable?: string
  status?: string
  title?: string
  workId?: number | string
}

type UploadSource = {
  keyId: number | string
  localPath: string
  role: R2MediaRole
  sourceDb?: string
  sourceId: number | string
  sourceTable?: string
  title?: string
}

type Variant = {
  buffer?: Buffer
  filename: string
  objectKey: string
  sizeName: string
}

type EntryResult = {
  files: Array<{
    bytes?: number
    filename: string
    objectKey: string
    sizeName: string
    status: 'dry-run' | 'failed' | 'uploaded'
    error?: string
  }>
  localPath: string
  mediaRole: R2MediaRole
  sourceId: number | string
  status: 'dry-run' | 'failed' | 'uploaded'
  title?: string
}

const ROLE_CONFIG: Record<
  R2MediaRole,
  | {
      assetRole: string
      inputPath: string
      source: 'download-report'
    }
  | {
      rootPath: string
      source: 'local-tree'
    }
> = {
  'casting-appearances.image': {
    assetRole: 'thumbnail',
    inputPath: 'tmp/legacy-assets/casting-appearances-image-download-report.json',
    source: 'download-report',
  },
  'exam-passed-reviews.image': {
    assetRole: 'student',
    inputPath: 'tmp/legacy-assets/exam-passed-reviews-image-download-report.json',
    source: 'download-report',
  },
  'exam-passed-videos.thumbnail': {
    rootPath: 'public/legacy/exam-passed-videos',
    source: 'local-tree',
  },
  'exam-results.image': {
    assetRole: 'thumbnail',
    inputPath: 'tmp/legacy-assets/exam-results-image-download-report.json',
    source: 'download-report',
  },
} as Partial<Record<R2MediaRole, unknown>> as Record<R2MediaRole, never>

const REPRESENTATIVE_SIZES = [
  { name: 'thumbnail', width: 300 },
  { fit: 'cover' as const, height: 500, name: 'square', width: 500 },
  { name: 'small', width: 600 },
  { name: 'medium', width: 900 },
  { name: 'large', width: 1400 },
  { name: 'xlarge', width: 1920 },
  { fit: 'cover' as const, height: 630, name: 'og', width: 1200 },
]

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const sources = (await Promise.all(options.roles.map((role) => readSources(role)))).flat()
  const entries = await mapWithConcurrency(sources, options.concurrency, async (source, index) => {
    const entry = await processSource(source, options)

    if (options.write && (index + 1) % 25 === 0) {
      console.log(
        JSON.stringify({
          done: index + 1,
          files: entry.files.length,
          role: source.role,
          total: sources.length,
        }),
      )
    }

    return entry
  })

  const output = {
    dryRun: options.dryRun,
    entries,
    generatedAt: new Date().toISOString(),
    objectKeySamples: entries.flatMap((entry) => entry.files.map((file) => file.objectKey)).slice(0, 10),
    roles: options.roles,
    totals: buildTotals(entries),
    write: options.write,
  }

  await writeJsonFile(resolveProjectPath(options.outputPath), output)
  console.log(
    JSON.stringify(
      {
        objectKeySamples: output.objectKeySamples,
        outputPath: options.outputPath,
        roles: options.roles,
        totals: output.totals,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): Options {
  let concurrency = 6
  let dryRun = false
  let outputPath = 'tmp/legacy-assets/legacy-representative-r2-upload-report.json'
  const roles: R2MediaRole[] = []
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--concurrency') {
      const parsed = Number(readRequiredValue(args, index, '--concurrency'))

      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 24) {
        throw new Error('`--concurrency` 값은 1 이상 24 이하 숫자여야 합니다.')
      }

      concurrency = parsed
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--roles') {
      for (const role of readRequiredValue(args, index, '--roles').split(',')) {
        const trimmed = role.trim()

        if (!isR2MediaRole(trimmed)) {
          throw new Error(`알 수 없는 media role 입니다: ${trimmed}`)
        }

        if (!ROLE_CONFIG[trimmed]) {
          throw new Error(`이 스크립트가 지원하지 않는 media role 입니다: ${trimmed}`)
        }

        roles.push(trimmed)
      }

      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }
  }

  if (roles.length === 0) {
    throw new Error('`--roles` 값이 필요합니다.')
  }

  if (write && dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  return {
    concurrency,
    dryRun: !write || dryRun,
    outputPath,
    roles,
    write,
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))

  return results
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readSources(role: R2MediaRole): Promise<UploadSource[]> {
  const config = ROLE_CONFIG[role]

  if (config.source === 'download-report') {
    const raw = await fs.readFile(resolveProjectPath(config.inputPath), 'utf8')
    const report = JSON.parse(raw) as { results?: ReportEntry[] }

    return (report.results ?? [])
      .filter((entry) => entry.status === 'downloaded')
      .filter((entry) => entry.assetRole === config.assetRole)
      .filter((entry) => entry.localPath && entry.sourceId)
      .filter((entry) => entry.workId ?? entry.sourceId)
      .map((entry) => ({
        keyId: (entry.workId ?? entry.sourceId) as number | string,
        localPath: String(entry.localPath),
        role,
        sourceDb: entry.sourceDb,
        sourceId: entry.sourceId as number | string,
        sourceTable: entry.sourceTable,
        title: entry.title,
      }))
  }

  const files = await readFilesRecursively(resolveProjectPath(config.rootPath))

  return files.map((file) => {
    const source = inferLegacySource(file, config.rootPath)

    return {
      keyId: source.sourceId,
      localPath: path.relative(resolveProjectPath(), file),
      role,
      ...source,
    }
  })
}

async function readFilesRecursively(rootPath: string): Promise<string[]> {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const childPath = path.join(rootPath, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await readFilesRecursively(childPath)))
    } else if (entry.isFile() && isImagePath(childPath)) {
      files.push(childPath)
    }
  }

  return files.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

function inferLegacySource(filePath: string, rootPath: string) {
  const relativePath = path.relative(resolveProjectPath(rootPath), filePath)
  const segments = relativePath.split(path.sep)
  const [sourceDb, sourceTable, sourceId, fileName] = segments

  if (!sourceDb || !sourceTable || !sourceId || !fileName) {
    throw new Error(`sourceId를 추론할 수 없습니다: ${filePath}`)
  }

  return {
    sourceDb,
    sourceId,
    sourceTable,
  }
}

function isImagePath(filePath: string) {
  return ['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'].includes(path.extname(filePath).toLowerCase())
}

async function processSource(source: UploadSource, options: Options): Promise<EntryResult> {
  const variants = await buildVariants(source, { generateBuffers: !options.dryRun })
  const result: EntryResult = {
    files: [],
    localPath: source.localPath,
    mediaRole: source.role,
    sourceId: source.sourceId,
    status: options.dryRun ? 'dry-run' : 'uploaded',
    title: source.title,
  }

  for (const variant of variants) {
    const fileResult: EntryResult['files'][number] = {
      bytes: variant.buffer?.byteLength,
      filename: variant.filename,
      objectKey: variant.objectKey,
      sizeName: variant.sizeName,
      status: options.dryRun ? 'dry-run' : 'uploaded',
    }

    if (!options.dryRun) {
      try {
        await uploadR2Object({
          body: requiredBuffer(variant),
          cacheControl: 'public, max-age=31536000, immutable',
          contentType: contentTypeFor(variant.filename),
          key: variant.objectKey,
        })
      } catch (error) {
        fileResult.status = 'failed'
        fileResult.error = error instanceof Error ? error.message : String(error)
        result.status = 'failed'
      }
    }

    result.files.push(fileResult)
  }

  return result
}

async function buildVariants(
  source: UploadSource,
  { generateBuffers }: { generateBuffers: boolean },
): Promise<Variant[]> {
  const localPath = resolveProjectPath(source.localPath)
  const sourceFileName = path.basename(source.localPath)
  const prefix = getR2MediaPrefix(source.role)
  const originalBuffer = generateBuffers ? await fs.readFile(localPath) : undefined
  const variants: Variant[] = [
    {
      buffer: originalBuffer,
      filename: buildCompactR2MediaFilename({
        filename: sourceFileName,
        role: source.role,
        sourceId: source.keyId,
      }),
      objectKey: '',
      sizeName: 'original',
    },
  ]

  if (!generateBuffers) {
    for (const size of REPRESENTATIVE_SIZES) {
      variants.push({
        filename: buildCompactR2MediaFilename({
          filename: sourceFileName,
          role: source.role,
          sizeName: size.name,
          sourceId: source.keyId,
        }),
        objectKey: '',
        sizeName: size.name,
      })
    }

    return withObjectKeys(variants, source, prefix)
  }

  const metadata = await sharp(localPath, { failOn: 'none' }).metadata()

  if (!metadata.width || !metadata.height) {
    return withObjectKeys(variants, source, prefix)
  }

  for (const size of REPRESENTATIVE_SIZES) {
    const filename = buildCompactR2MediaFilename({
      filename: sourceFileName,
      role: source.role,
      sizeName: size.name,
      sourceId: source.keyId,
    })
    const buffer = await sharp(localPath, { failOn: 'none' })
      .rotate()
      .resize({
        fit: size.fit ?? 'inside',
        height: size.height,
        position: 'center',
        width: size.width,
        withoutEnlargement: true,
      })
      .toFormat(formatFor(filename), { quality: 88 })
      .toBuffer()

    variants.push({
      buffer,
      filename,
      objectKey: '',
      sizeName: size.name,
    })
  }

  return withObjectKeys(variants, source, prefix)
}

function requiredBuffer(variant: Variant) {
  if (!variant.buffer) {
    throw new Error(`업로드할 이미지 버퍼가 없습니다: ${variant.objectKey}`)
  }

  return variant.buffer
}

function withObjectKeys(variants: Variant[], source: UploadSource, prefix: string) {
  return variants.map((variant) => ({
    ...variant,
    objectKey: buildR2MediaObjectKey({
      filename: variant.filename,
      prefix,
      sourceId: source.keyId,
    }),
  }))
}

function formatFor(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  if (extension === '.png') return 'png'
  if (extension === '.webp') return 'webp'
  if (extension === '.avif') return 'avif'

  return 'jpeg'
}

function contentTypeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  if (extension === '.avif') return 'image/avif'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'

  return 'application/octet-stream'
}

function buildTotals(entries: EntryResult[]) {
  const files = entries.flatMap((entry) => entry.files)

  return {
    failedEntries: entries.filter((entry) => entry.status === 'failed').length,
    failedFiles: files.filter((file) => file.status === 'failed').length,
    files: files.length,
    rows: entries.length,
    uploadedFiles: files.filter((file) => file.status === 'uploaded').length,
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

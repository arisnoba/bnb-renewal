import fs from 'node:fs/promises'
import path from 'node:path'

import { uploadR2Object } from '../../src/lib/r2'
import { resolveProjectPath, writeJsonFile } from './runtime'

type Options = {
  dryRun: boolean
  inputPath: string
  limit: 'all' | number
  outputPath: string
  prefix: string
}

type ScanFile = {
  entries?: Array<{
    bytes?: number
    localPath?: string
    normalizedUrl?: string
    sourcePath?: string
    status?: string
    title?: string
  }>
  results?: Array<{
    bytes?: number
    localPath?: string
    normalizedUrl?: string
    sourcePath?: string
    status?: string
    title?: string
  }>
  uniqueUrls: Array<{
    normalizedUrl: string
    samples?: Array<{
      id?: number | string
      table?: string
      title?: string
    }>
    url: string
  }>
}

type UploadSource = {
  localPath?: string
  normalizedUrl: string
  pathnameSource: string
  sourceUrl: string
  title?: string
}

type UploadedEntry = {
  bytes?: number
  contentType?: string
  error?: string
  normalizedUrl: string
  objectKey?: string
  pathname: string
  publicUrl?: string
  sourceUrl: string
  status: 'dry-run' | 'failed' | 'uploaded'
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  const scanFile = await readScanFile(options.inputPath)
  const uploadSources = toUploadSources(scanFile)
  const urls = options.limit === 'all' ? uploadSources : uploadSources.slice(0, options.limit)
  const entries: UploadedEntry[] = []

  for (const item of urls) {
    const pathname = buildObjectKey(options.prefix, item.pathnameSource)

    if (options.dryRun) {
      entries.push({
        normalizedUrl: item.normalizedUrl,
        pathname,
        sourceUrl: item.sourceUrl,
        status: 'dry-run',
        title: item.title,
      })
      continue
    }

    try {
      const image = item.localPath
        ? await readLocalImage(item.localPath)
        : await fetchImage(item.sourceUrl, item.normalizedUrl)
      const uploaded = await uploadR2Object({
        body: image.buffer,
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: image.contentType,
        key: pathname,
      })

      entries.push({
        bytes: image.bytes,
        contentType: image.contentType,
        normalizedUrl: item.normalizedUrl,
        objectKey: uploaded.objectKey,
        pathname,
        publicUrl: uploaded.publicUrl,
        sourceUrl: item.sourceUrl,
        status: 'uploaded',
        title: item.title,
      })
    } catch (error) {
      entries.push({
        error: error instanceof Error ? error.message : String(error),
        normalizedUrl: item.normalizedUrl,
        pathname,
        sourceUrl: item.sourceUrl,
        status: 'failed',
        title: item.title,
      })
    }
  }

  const uploaded = entries.filter((entry) => entry.status === 'uploaded').length
  const failed = entries.filter((entry) => entry.status === 'failed').length

  await writeJsonFile(resolveProjectPath(options.outputPath), {
    entries,
    generatedAt: new Date().toISOString(),
    inputPath: options.inputPath,
    prefix: options.prefix,
    totals: {
      failed,
      uploaded,
      urls: entries.length,
    },
  })

  console.log(
    JSON.stringify(
      {
        failed,
        outputPath: options.outputPath,
        uploaded,
        urls: entries.length,
      },
      null,
      2,
    ),
  )
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let inputPath = ''
  let limit: Options['limit'] = 'all'
  let outputPath = ''
  let prefix = 'directings/sample'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--input') {
      inputPath = readRequiredValue(args, index, '--input')
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--prefix') {
      prefix = readRequiredValue(args, index, '--prefix').replace(/^\/+|\/+$/g, '')
      index += 1
      continue
    }

    if (arg === '--limit') {
      const nextArg = readRequiredValue(args, index, '--limit')

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
    }
  }

  if (!inputPath) {
    throw new Error('`--input` 값이 필요합니다.')
  }

  if (!outputPath) {
    throw new Error('`--output` 값이 필요합니다.')
  }

  return { dryRun, inputPath, limit, outputPath, prefix }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readScanFile(inputPath: string): Promise<ScanFile> {
  const raw = await fs.readFile(resolveProjectPath(inputPath), 'utf8')
  const parsed = JSON.parse(raw) as ScanFile

  if (!Array.isArray(parsed.uniqueUrls) && !Array.isArray(parsed.entries) && !Array.isArray(parsed.results)) {
    throw new Error(`legacy URL 스캔 파일 형식이 올바르지 않습니다: ${inputPath}`)
  }

  return parsed
}

function toUploadSources(input: ScanFile): UploadSource[] {
  if (Array.isArray(input.uniqueUrls)) {
    return input.uniqueUrls.map((item) => ({
      normalizedUrl: item.normalizedUrl,
      pathnameSource: item.normalizedUrl,
      sourceUrl: item.url,
      title: item.samples?.[0]?.title,
    }))
  }

  return (input.entries ?? input.results ?? [])
    .filter((entry) => entry.status === 'downloaded' && entry.localPath && entry.normalizedUrl)
    .map((entry) => ({
      localPath: entry.localPath,
      normalizedUrl: String(entry.normalizedUrl),
      pathnameSource: String(entry.sourcePath ?? entry.normalizedUrl),
      sourceUrl: String(entry.sourcePath ?? entry.normalizedUrl),
      title: entry.title,
    }))
}

function buildObjectKey(prefix: string, source: string) {
  const sourcePath = /^https?:\/\//i.test(source)
    ? new URL(source).pathname.replace(/^\/+/, '')
    : source.replace(/^\/+/, '')

  return path.posix.join(prefix, sourcePath)
}

async function fetchImage(sourceUrl: string, normalizedUrl: string) {
  const response = await fetchWithFallback(sourceUrl, normalizedUrl)
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream'

  if (!contentType.startsWith('image/')) {
    throw new Error(`이미지 content-type 이 아닙니다: ${contentType}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    buffer,
    bytes: buffer.byteLength,
    contentType,
  }
}

async function readLocalImage(localPath: string) {
  const absolutePath = resolveProjectPath(localPath)
  const buffer = await fs.readFile(absolutePath)
  const contentType = contentTypeFromPath(absolutePath)

  return {
    buffer,
    bytes: buffer.byteLength,
    contentType,
  }
}

function contentTypeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.avif') return 'image/avif'
  if (extension === '.bmp') return 'image/bmp'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.webp') return 'image/webp'

  return 'application/octet-stream'
}

async function fetchWithFallback(sourceUrl: string, normalizedUrl: string) {
  const firstResponse = await fetch(sourceUrl)

  if (firstResponse.ok) {
    return firstResponse
  }

  if (sourceUrl !== normalizedUrl) {
    const fallbackResponse = await fetch(normalizedUrl)

    if (fallbackResponse.ok) {
      return fallbackResponse
    }
  }

  throw new Error(`이미지 다운로드 실패: ${sourceUrl} (${firstResponse.status})`)
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

import fs from 'node:fs/promises'
import path from 'node:path'

import { uploadR2Object } from '../../src/lib/r2'
import {
  buildR2MediaObjectKey,
  buildCompactR2MediaFilename,
  getR2MediaPrefix,
  isR2MediaRole,
  listR2MediaRoles,
  type R2MediaRole,
} from '../../src/lib/r2ObjectKeys'
import { resolveProjectPath, writeJsonFile } from './runtime'

type Options = {
  dryRun: boolean
  inputPath: string
  limit: 'all' | number
  listMediaRoles: boolean
  mediaRole?: R2MediaRole
  outputPath: string
  prefix?: string
  sourceId?: string
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
  sourceId?: number | string
  sourceUrl: string
  title?: string
}

type UploadedEntry = {
  bytes?: number
  contentType?: string
  error?: string
  mediaRole?: R2MediaRole
  normalizedUrl: string
  objectKey?: string
  pathname: string
  prefix: string
  publicUrl?: string
  sourceUrl: string
  status: 'dry-run' | 'failed' | 'uploaded'
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.listMediaRoles) {
    console.log(JSON.stringify({ roles: listR2MediaRoles() }, null, 2))
    return
  }

  const prefix = resolveUploadPrefix(options)
  const scanFile = await readScanFile(options.inputPath)
  const uploadSources = toUploadSources(scanFile)
  const urls = options.limit === 'all' ? uploadSources : uploadSources.slice(0, options.limit)
  const entries: UploadedEntry[] = []

  for (const item of urls) {
    const pathname = buildR2MediaObjectKey({
      filename:
        options.mediaRole && (options.sourceId ?? item.sourceId)
          ? buildCompactR2MediaFilename({
              filename: item.pathnameSource,
              role: options.mediaRole,
              sourceId: options.sourceId ?? item.sourceId ?? 'unknown',
            })
          : undefined,
      prefix,
      sourceId: options.sourceId ?? item.sourceId,
      sourcePath: item.pathnameSource,
    })

    if (options.dryRun) {
      entries.push({
        mediaRole: options.mediaRole,
        normalizedUrl: item.normalizedUrl,
        pathname,
        prefix,
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
        mediaRole: options.mediaRole,
        normalizedUrl: item.normalizedUrl,
        objectKey: uploaded.objectKey,
        pathname,
        prefix,
        publicUrl: uploaded.publicUrl,
        sourceUrl: item.sourceUrl,
        status: 'uploaded',
        title: item.title,
      })
    } catch (error) {
      entries.push({
        error: error instanceof Error ? error.message : String(error),
        mediaRole: options.mediaRole,
        normalizedUrl: item.normalizedUrl,
        pathname,
        prefix,
        sourceUrl: item.sourceUrl,
        status: 'failed',
        title: item.title,
      })
    }
  }

  const uploaded = entries.filter((entry) => entry.status === 'uploaded').length
  const failed = entries.filter((entry) => entry.status === 'failed').length

  await writeJsonFile(resolvePathArg(options.outputPath), {
    entries,
    generatedAt: new Date().toISOString(),
    inputPath: options.inputPath,
    mediaRole: options.mediaRole,
    objectKeySamples: entries
      .map((entry) => entry.objectKey ?? entry.pathname)
      .filter(Boolean)
      .slice(0, 5),
    prefix,
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
        mediaRole: options.mediaRole,
        objectKeySamples: entries
          .map((entry) => entry.objectKey ?? entry.pathname)
          .filter(Boolean)
          .slice(0, 5),
        outputPath: options.outputPath,
        prefix,
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
  let listMediaRoles = false
  let mediaRole: R2MediaRole | undefined
  let outputPath = ''
  let prefix: string | undefined
  let sourceId: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--list-media-roles') {
      listMediaRoles = true
      continue
    }

    if (arg === '--input') {
      inputPath = readRequiredValue(args, index, '--input')
      index += 1
      continue
    }

    if (arg === '--media-role') {
      const value = readRequiredValue(args, index, '--media-role')

      if (!isR2MediaRole(value)) {
        throw new Error(
          `알 수 없는 --media-role 값입니다: ${value}\n허용 값: ${listR2MediaRoles()
            .map((item) => item.role)
            .join(', ')}`,
        )
      }

      mediaRole = value
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

    if (arg === '--source-id') {
      sourceId = readRequiredValue(args, index, '--source-id')
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

  if (listMediaRoles) {
    return {
      dryRun,
      inputPath,
      limit,
      listMediaRoles,
      mediaRole,
      outputPath,
      prefix,
      sourceId,
    }
  }

  if (!inputPath) {
    throw new Error('`--input` 값이 필요합니다.')
  }

  if (!outputPath) {
    throw new Error('`--output` 값이 필요합니다.')
  }

  if (mediaRole && prefix) {
    throw new Error('`--media-role` 과 `--prefix` 는 함께 사용할 수 없습니다.')
  }

  if (!mediaRole && !prefix) {
    throw new Error('`--media-role` 또는 `--prefix` 값이 필요합니다.')
  }

  return {
    dryRun,
    inputPath,
    limit,
    listMediaRoles,
    mediaRole,
    outputPath,
    prefix,
    sourceId,
  }
}

function resolveUploadPrefix(options: Options) {
  if (options.mediaRole) {
    return getR2MediaPrefix(options.mediaRole)
  }

  if (options.prefix) {
    return options.prefix
  }

  throw new Error('`--media-role` 또는 `--prefix` 값이 필요합니다.')
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readScanFile(inputPath: string): Promise<ScanFile> {
  const raw = await fs.readFile(resolvePathArg(inputPath), 'utf8')
  const parsed = JSON.parse(raw) as ScanFile

  if (!Array.isArray(parsed.uniqueUrls) && !Array.isArray(parsed.entries) && !Array.isArray(parsed.results)) {
    throw new Error(`legacy URL 스캔 파일 형식이 올바르지 않습니다: ${inputPath}`)
  }

  return parsed
}

function resolvePathArg(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : resolveProjectPath(filePath)
}

function toUploadSources(input: ScanFile): UploadSource[] {
  if (Array.isArray(input.uniqueUrls)) {
    return input.uniqueUrls.map((item) => ({
      normalizedUrl: item.normalizedUrl,
      pathnameSource: item.normalizedUrl,
      sourceId: item.samples?.[0]?.id,
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

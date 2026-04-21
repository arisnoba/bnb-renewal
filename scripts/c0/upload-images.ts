import fs from 'node:fs/promises'
import path from 'node:path'

import { put } from '@vercel/blob'

import { resolveProjectPath, writeJsonFile } from './runtime'

type Options = {
  dryRun: boolean
  inputPath: string
  limit: 'all' | number
  outputPath: string
  prefix: string
}

type ScanFile = {
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

type UploadedEntry = {
  blobUrl?: string
  bytes?: number
  contentType?: string
  error?: string
  normalizedUrl: string
  pathname: string
  sourceUrl: string
  status: 'dry-run' | 'failed' | 'uploaded'
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!options.dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN 이 필요합니다.')
  }

  const scanFile = await readScanFile(options.inputPath)
  const urls = options.limit === 'all' ? scanFile.uniqueUrls : scanFile.uniqueUrls.slice(0, options.limit)
  const entries: UploadedEntry[] = []

  for (const item of urls) {
    const pathname = buildBlobPathname(options.prefix, item.normalizedUrl)

    if (options.dryRun) {
      entries.push({
        normalizedUrl: item.normalizedUrl,
        pathname,
        sourceUrl: item.url,
        status: 'dry-run',
        title: item.samples?.[0]?.title,
      })
      continue
    }

    try {
      const image = await fetchImage(item.url, item.normalizedUrl)
      const blob = await put(pathname, image.blob, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: image.contentType,
      })

      entries.push({
        blobUrl: blob.url,
        bytes: image.bytes,
        contentType: image.contentType,
        normalizedUrl: item.normalizedUrl,
        pathname,
        sourceUrl: item.url,
        status: 'uploaded',
        title: item.samples?.[0]?.title,
      })
    } catch (error) {
      entries.push({
        error: error instanceof Error ? error.message : String(error),
        normalizedUrl: item.normalizedUrl,
        pathname,
        sourceUrl: item.url,
        status: 'failed',
        title: item.samples?.[0]?.title,
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
  let prefix = 'c0/directings/sample'

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

  if (!Array.isArray(parsed.uniqueUrls)) {
    throw new Error(`legacy URL 스캔 파일 형식이 올바르지 않습니다: ${inputPath}`)
  }

  return parsed
}

function buildBlobPathname(prefix: string, sourceUrl: string) {
  const url = new URL(sourceUrl)
  const sourcePath = url.pathname.replace(/^\/+/, '')
  return path.posix.join(prefix, sourcePath)
}

async function fetchImage(sourceUrl: string, normalizedUrl: string) {
  const response = await fetchWithFallback(sourceUrl, normalizedUrl)
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream'

  if (!contentType.startsWith('image/')) {
    throw new Error(`이미지 content-type 이 아닙니다: ${contentType}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const blob = new Blob([arrayBuffer], { type: contentType })

  return {
    blob,
    bytes: arrayBuffer.byteLength,
    contentType,
  }
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

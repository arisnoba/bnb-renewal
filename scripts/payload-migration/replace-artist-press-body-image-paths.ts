import fs from 'node:fs/promises'

import { Pool } from 'pg'

import {
  assertDestructiveC0Allowed,
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type Options = {
  dryRun: boolean
  manifestPath: string
  outputPath?: string
  write: boolean
}

type ManifestEntry = {
  localUrl?: string
  normalizedUrl?: string
  originalSrc?: string
  sourceUrl?: string
  status?: string
  workId?: number | string
}

type Replacement = {
  localUrl: string
  urls: string[]
  workId: number
}

type ArtistPressRow = {
  body: unknown
  body_html: string | null
  id: number
  title: string | null
}

type RowResult = {
  bodyHtmlReplacements: number
  bodyJsonReplacements: number
  id: number
  title?: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  const replacements = await readReplacements(options.manifestPath)
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  if (options.write) {
    assertDestructiveC0Allowed()
  } else {
    logDbTargetInfo(target, { destructive: false })
  }

  const pool = new Pool({ connectionString })

  try {
    const rows = await readRows(pool, Array.from(replacements.keys()))
    const rowResults: RowResult[] = []

    for (const row of rows) {
      const rowReplacements = replacements.get(row.id) ?? []
      const bodyHtmlResult = replaceInString(row.body_html ?? '', rowReplacements)
      const bodyJsonResult = replaceInJson(row.body, rowReplacements)
      const rowResult: RowResult = {
        bodyHtmlReplacements: bodyHtmlResult.count,
        bodyJsonReplacements: bodyJsonResult.count,
        id: row.id,
        title: row.title ?? undefined,
      }

      rowResults.push(rowResult)

      if (options.write && (bodyHtmlResult.changed || bodyJsonResult.changed)) {
        await pool.query(
          `
            UPDATE artist_press
            SET body_html = $1,
                body = $2::jsonb,
                updated_at = NOW()
            WHERE id = $3
          `,
          [bodyHtmlResult.value, JSON.stringify(bodyJsonResult.value), row.id],
        )
      }
    }

    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      manifestPath: options.manifestPath,
      rows: rowResults,
      totals: {
        bodyHtmlReplacements: rowResults.reduce((sum, row) => sum + row.bodyHtmlReplacements, 0),
        bodyJsonReplacements: rowResults.reduce((sum, row) => sum + row.bodyJsonReplacements, 0),
        manifestRows: replacements.size,
        rowsChanged: rowResults.filter((row) => row.bodyHtmlReplacements > 0 || row.bodyJsonReplacements > 0).length,
        rowsRead: rows.length,
      },
      write: options.write,
    }

    if (options.outputPath) {
      await writeJsonFile(resolveProjectPath(options.outputPath), output)
    }

    console.log(JSON.stringify(output, null, 2))
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let manifestPath = 'tmp/legacy-assets/artist-press-body-image-download-report.json'
  let outputPath: string | undefined
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--write') {
      write = true
      continue
    }

    if (arg === '--manifest') {
      manifestPath = readRequiredValue(args, index, '--manifest')
      index += 1
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
    }
  }

  return { dryRun, manifestPath, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readReplacements(manifestPath: string): Promise<Map<number, Replacement[]>> {
  const raw = await fs.readFile(resolveProjectPath(manifestPath), 'utf8')
  const manifest = JSON.parse(raw) as { results?: ManifestEntry[] }

  if (!Array.isArray(manifest.results)) {
    throw new Error(`다운로드 리포트 형식이 올바르지 않습니다: ${manifestPath}`)
  }

  const replacements = new Map<number, Replacement[]>()

  for (const entry of manifest.results) {
    if (entry.status !== 'downloaded' && entry.status !== 'skipped') {
      continue
    }

    const workId = Number(entry.workId)
    const localUrl = text(entry.localUrl)

    if (!Number.isFinite(workId) || !localUrl) {
      continue
    }

    const urls = Array.from(
      new Set([entry.originalSrc, entry.sourceUrl, entry.normalizedUrl].map(text).filter(isString)),
    )

    if (urls.length === 0) {
      continue
    }

    const next = replacements.get(workId) ?? []
    next.push({ localUrl, urls, workId })
    replacements.set(workId, next)
  }

  return replacements
}

async function readRows(pool: Pool, ids: number[]) {
  if (ids.length === 0) {
    return []
  }

  const result = await pool.query<ArtistPressRow>(
    `
      SELECT id, title, body_html, body
      FROM artist_press
      WHERE id = ANY($1::int[])
      ORDER BY id ASC
    `,
    [ids],
  )

  return result.rows
}

function replaceInString(value: string, replacements: Replacement[]) {
  let nextValue = value
  let count = 0

  for (const replacement of replacements) {
    for (const url of replacement.urls) {
      const occurrences = countOccurrences(nextValue, url)

      if (occurrences === 0) {
        continue
      }

      count += occurrences
      nextValue = nextValue.split(url).join(replacement.localUrl)
    }
  }

  return {
    changed: nextValue !== value,
    count,
    value: nextValue,
  }
}

function replaceInJson(value: unknown, replacements: Replacement[]) {
  if (value == null) {
    return {
      changed: false,
      count: 0,
      value,
    }
  }

  const original = JSON.stringify(value)
  const replaced = replaceInString(original, replacements)

  return {
    changed: replaced.changed,
    count: replaced.count,
    value: replaced.changed ? JSON.parse(replaced.value) : value,
  }
}

function countOccurrences(value: string, needle: string) {
  if (!needle) {
    return 0
  }

  return value.split(needle).length - 1
}

function text(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed ? trimmed : undefined
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string'
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

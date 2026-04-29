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
  collection: string
  dryRun: boolean
  ids: string[]
  manifestPath: string
  outputPath?: string
  write: boolean
}

type ManifestFile = {
  entries: Array<{
    blobUrl?: string
    normalizedUrl: string
    publicUrl?: string
    sourceUrl: string
    status: string
  }>
}

type Replacement = {
  legacyUrls: string[]
  publicUrl: string
}

type RowResult = {
  id: string
  replacements: number
  title?: string
}

const COLLECTIONS: Record<string, { bodyColumn: string; idColumn: string; table: string; titleColumn: string }> = {
  directings: {
    bodyColumn: 'body_html',
    idColumn: 'id',
    table: 'directings',
    titleColumn: 'title',
  },
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  if (options.write && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('DB 치환 실행은 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다. 먼저 dry-run으로 검증하세요.')
  }

  const target = COLLECTIONS[options.collection]

  if (!target) {
    throw new Error(`지원하지 않는 collection 입니다: ${options.collection}`)
  }

  const replacements = await readReplacements(options.manifestPath)
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const dbTarget = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(dbTarget, { destructive: options.write })

  try {
    const rows = await readRows(pool, target, options.ids)
    const rowResults: RowResult[] = []
    const usedLegacyUrls = new Set<string>()

    for (const row of rows) {
      const original = String(row[target.bodyColumn] ?? '')
      const replaced = applyReplacements(original, replacements)
      const result: RowResult = {
        id: String(row[target.idColumn] ?? ''),
        replacements: replaced.count,
        title: String(row[target.titleColumn] ?? ''),
      }

      for (const legacyUrl of replaced.usedLegacyUrls) {
        usedLegacyUrls.add(legacyUrl)
      }

      rowResults.push(result)

      if (options.write && replaced.count > 0) {
        await pool.query(
          `UPDATE "${target.table}" SET "${target.bodyColumn}" = $1, updated_at = NOW() WHERE "${target.idColumn}" = $2`,
          [replaced.value, row[target.idColumn]],
        )
      }
    }

    const output = {
      collection: options.collection,
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      ids: options.ids,
      rows: rowResults,
      totals: {
        unusedManifestUrls: countUnusedManifestUrls(replacements, usedLegacyUrls),
        replacements: rowResults.reduce((sum, row) => sum + row.replacements, 0),
        rows: rowResults.length,
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
  let collection = ''
  let dryRun = false
  let ids: string[] = []
  let manifestPath = ''
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

    if (arg === '--collection') {
      collection = readRequiredValue(args, index, '--collection').replaceAll('-', '_')
      index += 1
      continue
    }

    if (arg === '--ids') {
      ids = readRequiredValue(args, index, '--ids')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
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

  if (!collection) {
    throw new Error('`--collection` 값이 필요합니다.')
  }

  if (ids.length === 0) {
    throw new Error('`--ids` 값이 필요합니다.')
  }

  if (!manifestPath) {
    throw new Error('`--manifest` 값이 필요합니다.')
  }

  return { collection, dryRun, ids, manifestPath, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readReplacements(manifestPath: string): Promise<Replacement[]> {
  const raw = await fs.readFile(resolveProjectPath(manifestPath), 'utf8')
  const manifest = JSON.parse(raw) as ManifestFile

  if (!Array.isArray(manifest.entries)) {
    throw new Error(`업로드 매니페스트 형식이 올바르지 않습니다: ${manifestPath}`)
  }

  return manifest.entries
    .filter((entry) => entry.status === 'uploaded' && (entry.publicUrl || entry.blobUrl))
    .map((entry) => ({
      legacyUrls: Array.from(new Set([entry.sourceUrl, entry.normalizedUrl])),
      publicUrl: String(entry.publicUrl ?? entry.blobUrl),
    }))
}

async function readRows(
  pool: Pool,
  target: (typeof COLLECTIONS)[string],
  ids: string[],
): Promise<Array<Record<string, unknown>>> {
  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT "${target.idColumn}", "${target.titleColumn}", "${target.bodyColumn}"
      FROM "${target.table}"
      WHERE "${target.idColumn}"::text = ANY($1::text[])
      ORDER BY "${target.idColumn}" ASC
    `,
    [ids],
  )

  return result.rows
}

function applyReplacements(value: string, replacements: Replacement[]) {
  let nextValue = value
  let count = 0
  const usedLegacyUrls = new Set<string>()

  for (const replacement of replacements) {
    for (const legacyUrl of replacement.legacyUrls) {
      const occurrences = countOccurrences(nextValue, legacyUrl)

      if (occurrences === 0) {
        continue
      }

      usedLegacyUrls.add(legacyUrl)
      count += occurrences
      nextValue = nextValue.split(legacyUrl).join(replacement.publicUrl)
    }
  }

  return {
    count,
    usedLegacyUrls,
    value: nextValue,
  }
}

function countUnusedManifestUrls(replacements: Replacement[], usedLegacyUrls: Set<string>) {
  return replacements.filter((replacement) =>
    replacement.legacyUrls.every((legacyUrl) => !usedLegacyUrls.has(legacyUrl)),
  ).length
}

function countOccurrences(value: string, needle: string) {
  if (!needle) {
    return 0
  }

  return value.split(needle).length - 1
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

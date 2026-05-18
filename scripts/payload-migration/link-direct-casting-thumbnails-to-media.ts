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
  dryRun: boolean
  ids: string[]
  limit: 'all' | number
  outputPath: string
  overwrite: boolean
  write: boolean
}

type DirectCastingRow = {
  id: number
  source_db: string | null
  source_id: number | null
  source_table: string | null
  thumbnail_media_id: number | null
  thumbnail_path: string | null
  title: string | null
}

type MatchedThumbnail = {
  fileName: string
  legacyPath: string
  localPath: string
}

type RowResult = {
  action:
    | 'created-media-and-linked'
    | 'created-media-from-repaired-file-and-linked'
    | 'dry-run'
    | 'linked-existing-media'
    | 'skipped-existing'
    | 'skipped-no-thumbnail'
    | 'unresolved-local-file'
    | 'write-error'
  directCastingId: number
  errorMessage?: string
  existingThumbnailMediaId?: number | null
  legacyPath?: string
  localPath?: string
  mediaId?: number
  title?: string
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

const MEDIA_PREFIX = 'media/direct-castings'

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  const payload = options.write ? await getPayloadForWrite() : undefined
  const results: RowResult[] = []

  try {
    const rows = await readRows(pool, options)

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
  let dryRun = false
  let ids: string[] = []
  let limit: Options['limit'] = 'all'
  let outputPath = 'tmp/legacy-assets/direct-casting-thumbnail-media-link-report.json'
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
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--limit') {
      const value = readRequiredValue(args, index, '--limit')

      if (value === 'all') {
        limit = 'all'
      } else {
        const parsed = Number(value)

        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`잘못된 --limit 값입니다: ${value}`)
        }

        limit = parsed
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

  return { dryRun, ids, limit, outputPath, overwrite, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readRows(pool: Pool, options: Options) {
  const params: unknown[] = []
  const where = ['thumbnail_path IS NOT NULL']

  if (options.ids.length > 0) {
    params.push(options.ids)
    where.push(`id::text = ANY($${params.length}::text[])`)
  }

  const limitSql = options.limit === 'all' ? '' : ` LIMIT ${options.limit}`
  const result = await pool.query<DirectCastingRow>(
    `
      SELECT
        id,
        title,
        source_db,
        source_table,
        source_id,
        thumbnail_path,
        thumbnail_media_id
      FROM direct_castings
      WHERE ${where.join(' AND ')}
      ORDER BY id ASC
      ${limitSql}
    `,
    params,
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
  row: DirectCastingRow
}): Promise<RowResult> {
  const base = {
    directCastingId: row.id,
    existingThumbnailMediaId: row.thumbnail_media_id,
    title: text(row.title),
  }

  if (!options.overwrite && row.thumbnail_media_id) {
    return {
      ...base,
      action: 'skipped-existing',
      mediaId: row.thumbnail_media_id,
    }
  }

  const matched = matchThumbnail(row)

  if (!matched) {
    return {
      ...base,
      action: 'skipped-no-thumbnail',
    }
  }

  const exists = await localFileExists(matched.localPath)

  if (!exists) {
    return {
      ...base,
      action: 'unresolved-local-file',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
    }
  }

  const existingMediaId = await findExistingMediaId(pool, matched.fileName)

  if (options.dryRun) {
    return {
      ...base,
      action: 'dry-run',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaId: existingMediaId,
    }
  }

  if (!payload) {
    throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
  }

  try {
    let repairedFilePath: string | undefined
    let repaired = false

    const mediaId =
      existingMediaId ??
      (await createMediaFromLocalFile({
        matched,
        payload,
        title: text(row.title),
      }).catch(async (error: unknown) => {
        repairedFilePath = await repairImageForUpload(matched.localPath)
        repaired = true

        try {
          return await createMediaFromLocalFile({
            filePath: repairedFilePath,
            matched,
            payload,
            title: text(row.title),
          })
        } catch (repairError) {
          throw repairError instanceof Error ? repairError : error
        } finally {
          if (repairedFilePath) {
            await fs.unlink(repairedFilePath).catch(() => undefined)
          }
        }
      }))

    await pool.query(
      `
        UPDATE direct_castings
        SET
          thumbnail_media_id = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [mediaId, row.id],
    )

    return {
      ...base,
      action: existingMediaId
        ? 'linked-existing-media'
        : repaired
          ? 'created-media-from-repaired-file-and-linked'
          : 'created-media-and-linked',
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
      mediaId,
    }
  } catch (error) {
    return {
      ...base,
      action: 'write-error',
      errorMessage: error instanceof Error ? error.message : String(error),
      legacyPath: matched.legacyPath,
      localPath: matched.localPath,
    }
  }
}

function matchThumbnail(row: DirectCastingRow): MatchedThumbnail | undefined {
  const legacyPath = normalizeLegacyPath(row.thumbnail_path)

  if (!legacyPath) {
    return undefined
  }

  const fileName = path.basename(legacyPath)

  if (!fileName) {
    return undefined
  }

  return {
    fileName,
    legacyPath,
    localPath: legacyPath.startsWith('/legacy/') ? `public${legacyPath}` : legacyPath.replace(/^\/+/, ''),
  }
}

async function findExistingMediaId(pool: Pool, fileName: string) {
  const result = await pool.query<{ id: number }>(
    'SELECT id FROM media WHERE filename = $1 ORDER BY id ASC LIMIT 1',
    [fileName],
  )

  return result.rows[0]?.id
}

async function createMediaFromLocalFile({
  filePath,
  matched,
  payload,
  title,
}: {
  filePath?: string
  matched: MatchedThumbnail
  payload: DynamicPayload
  title?: string
}) {
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: title ?? matched.fileName,
      prefix: MEDIA_PREFIX,
    },
    filePath: filePath ?? resolveProjectPath(matched.localPath),
    overrideAccess: true,
  })
  const id = Number(created.id)

  if (!Number.isFinite(id)) {
    throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
  }

  return id
}

async function repairImageForUpload(localPath: string) {
  const { default: sharp } = await import('sharp')
  const repairedDir = path.join(os.tmpdir(), 'bnb-direct-casting-thumbnail-repair')
  const repairedPath = path.join(repairedDir, `${Date.now()}-${path.basename(localPath)}`)

  await fs.mkdir(repairedDir, { recursive: true })
  await sharp(resolveProjectPath(localPath), { failOn: 'none' }).jpeg({ quality: 90 }).toFile(repairedPath)

  return repairedPath
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

async function localFileExists(localPath: string) {
  try {
    const stat = await fs.stat(resolveProjectPath(localPath))
    return stat.isFile()
  } catch {
    return false
  }
}

function normalizeLegacyPath(value: string | undefined | null) {
  const current = text(value)

  if (!current) {
    return undefined
  }

  try {
    return new URL(current).pathname
  } catch {
    return current.startsWith('/') ? current : `/${current}`
  }
}

function text(value: unknown) {
  const trimmed = String(value ?? '').trim()

  return trimmed || undefined
}

function buildTotals(results: RowResult[]) {
  return results.reduce<Record<string, number>>((totals, row) => {
    totals[row.action] = (totals[row.action] ?? 0) + 1
    return totals
  }, {})
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })

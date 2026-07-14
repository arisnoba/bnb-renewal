import fs from 'node:fs/promises'
import path from 'node:path'

import { Pool } from 'pg'

import { destroyR2Client, uploadR2Object } from '@/lib/r2'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

const COMPANY = 'cna-agency'
const DEFAULT_OUTPUT_PATH = 'tmp/casting/cna-direct-casting-r2-upload-report.json'

type Options = {
  outputPath: string
  write: boolean
}

type MediaRow = {
  directCastingId: number
  filename: string
  id: number
  prefix: string
}

type UploadResult = {
  action: 'dry-run' | 'uploaded'
  directCastingId: number
  mediaId: number
  objectKey: string
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  if (!target.isLocal) {
    throw new Error('이 스크립트는 로컬 DB의 CNA 미디어만 업로드할 수 있습니다.')
  }

  logDbTargetInfo(target, { destructive: options.write })

  const pool = new Pool({ connectionString })

  try {
    const rows = await readCnaMedia(pool)
    const results = options.write ? await uploadRows(rows) : dryRunRows(rows)
    const output = {
      dryRun: !options.write,
      generatedAt: new Date().toISOString(),
      results,
      totals: countByAction(results),
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(JSON.stringify({ outputPath: options.outputPath, totals: output.totals }, null, 2))
  } finally {
    await pool.end()
    destroyR2Client()
  }
}

async function readCnaMedia(pool: Pool): Promise<MediaRow[]> {
  const result = await pool.query<{
    direct_casting_id: number
    filename: string | null
    id: number
    prefix: string | null
  }>(
    `
      SELECT
        direct_castings.id AS direct_casting_id,
        media.filename,
        media.id,
        media.prefix
      FROM direct_castings
      INNER JOIN direct_castings_company
        ON direct_castings_company.parent_id = direct_castings.id
       AND direct_castings_company.value = $1
      INNER JOIN media
        ON media.id = direct_castings.thumbnail_media_id
      ORDER BY direct_castings.id
    `,
    [COMPANY],
  )

  if (result.rows.length !== 88) {
    throw new Error(`CNA 대표 이미지 수가 88건이 아닙니다: ${result.rows.length}`)
  }

  return result.rows.map((row) => {
    if (!row.filename || !row.prefix) {
      throw new Error(`미디어 경로가 비어 있습니다: media=${row.id}`)
    }

    return {
      directCastingId: row.direct_casting_id,
      filename: row.filename,
      id: row.id,
      prefix: row.prefix,
    }
  })
}

function dryRunRows(rows: MediaRow[]): UploadResult[] {
  return rows.map((row) => resultFor(row, 'dry-run'))
}

async function uploadRows(rows: MediaRow[]): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (const row of rows) {
    const objectKey = path.posix.join(row.prefix, row.filename)
    const body = await fs.readFile(resolveProjectPath('public/media', row.filename))

    await uploadR2Object({
      body,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: 'image/jpeg',
      key: objectKey,
    })
    results.push(resultFor(row, 'uploaded'))
  }

  return results
}

function resultFor(row: MediaRow, action: UploadResult['action']): UploadResult {
  return {
    action,
    directCastingId: row.directCastingId,
    mediaId: row.id,
    objectKey: path.posix.join(row.prefix, row.filename),
  }
}

function countByAction(results: UploadResult[]) {
  return results.reduce<Record<string, number>>((totals, result) => {
    totals[result.action] = (totals[result.action] ?? 0) + 1
    return totals
  }, {})
}

function parseArgs(args: string[]): Options {
  let outputPath = DEFAULT_OUTPUT_PATH
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--write') {
      write = true
      continue
    }

    if (arg === '--output') {
      const value = args[index + 1]

      if (!value) {
        throw new Error('--output 값이 필요합니다.')
      }

      outputPath = value
      index += 1
      continue
    }

    throw new Error(`지원하지 않는 옵션입니다: ${arg}`)
  }

  return { outputPath, write }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})

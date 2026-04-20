import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type CastingBaselineRecord = {
  publishedAt: null | string
  slug: string
  sourceId: number
  sourceTable: string
  title: string
}

async function main() {
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const outputPath = resolveProjectPath('tmp', 'c0', 'castings-pre-c0.json')
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const records = await readCastings(pool)

    await writeJsonFile(outputPath, {
      generatedAt: new Date().toISOString(),
      records,
      target: {
        database: target.database,
        host: target.host,
        isLocal: target.isLocal,
        nodeEnv: target.nodeEnv,
      },
    })

    console.log(
      JSON.stringify(
        {
          outputPath,
          records: records.length,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

async function readCastings(pool: Pool): Promise<CastingBaselineRecord[]> {
  const existsResult = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'castings'
      ) AS exists
    `,
  )

  if (!existsResult.rows[0]?.exists) {
    return []
  }

  const result = await pool.query<{
    published_at: null | string
    slug: string
    source_id: string
    source_table: string
    title: string
  }>(`
    SELECT
      source_table,
      source_id::text,
      slug,
      title,
      published_at
    FROM castings
    ORDER BY source_table ASC, source_id ASC, slug ASC
  `)

  return result.rows.map((row) => ({
    publishedAt: row.published_at,
    slug: row.slug,
    sourceId: Number(row.source_id),
    sourceTable: row.source_table,
    title: row.title,
  }))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

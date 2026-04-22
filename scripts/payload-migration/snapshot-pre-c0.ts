import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

const TABLES = [
  'users',
  'teachers',
  'teachers_gallery',
  'news',
  'profiles',
  'castings',
  'agencies',
  'agencies_actors',
  'payload_kv',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'payload_preferences',
  'payload_preferences_rels',
  'payload_migrations',
] as const

async function main() {
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const outputPath = resolveProjectPath('tmp', 'c0', 'snapshot-pre-c0.json')
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const counts = await collectCounts(pool)

    await writeJsonFile(outputPath, {
      counts,
      generatedAt: new Date().toISOString(),
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
          tableCount: Object.keys(counts).length,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

async function collectCounts(pool: Pool) {
  const counts: Record<string, null | number> = {}

  for (const tableName of TABLES) {
    counts[tableName] = await countTable(pool, tableName)
  }

  return counts
}

async function countTable(pool: Pool, tableName: string): Promise<null | number> {
  const existsResult = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  )

  if (!existsResult.rows[0]?.exists) {
    return null
  }

  const result = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "${tableName}"`)
  return Number(result.rows[0]?.count ?? 0)
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

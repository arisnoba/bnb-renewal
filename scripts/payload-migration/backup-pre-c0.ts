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
  const outputPath = resolveProjectPath('tmp', 'c0', 'backup', 'pre-c0.json')
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const tables = await dumpTables(pool)

    await writeJsonFile(outputPath, {
      generatedAt: new Date().toISOString(),
      tables,
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
          tableCount: Object.keys(tables).length,
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

async function dumpTables(pool: Pool) {
  const dumped: Record<string, unknown[]> = {}

  for (const tableName of TABLES) {
    dumped[tableName] = await dumpTable(pool, tableName)
  }

  return dumped
}

async function dumpTable(pool: Pool, tableName: string): Promise<unknown[]> {
  const columns = await getTableColumns(pool, tableName)

  if (columns.length === 0) {
    return []
  }

  const orderBy = buildOrderBy(columns)
  const result = await pool.query(`SELECT * FROM "${tableName}"${orderBy}`)
  return result.rows
}

async function getTableColumns(pool: Pool, tableName: string): Promise<string[]> {
  const result = await pool.query<{ column_name: string }>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position ASC
    `,
    [tableName],
  )

  return result.rows.map((row) => row.column_name)
}

function buildOrderBy(columns: string[]) {
  const orderColumns = ['id', '_parent_id', '_order'].filter((column) => columns.includes(column))

  if (orderColumns.length === 0) {
    return ''
  }

  return ` ORDER BY ${orderColumns.map((column) => `"${column}" ASC`).join(', ')}`
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

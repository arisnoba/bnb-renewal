import fs from 'node:fs/promises'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
} from './runtime'

type Options = {
  dryRun: boolean
  overwrite: boolean
}

type LegacyTeacherPhotos = {
  photo_image1?: string
  photo_image2?: string
  photo_image3?: string
  photo_image4?: string
  photo_image5?: string
  photo_image6?: string
}

type TeacherRow = {
  id: number
  name: string | null
  photo_image1: string | null
  photo_image2: string | null
  photo_image3: string | null
  photo_image4: string | null
  photo_image5: string | null
  photo_image6: string | null
  source_db: string | null
  source_id: number | null
  source_table: string | null
}

const sourceDbs = ['baewoo', 'bnbuniv', 'kidscenter', 'bnbhighteen'] as const
const photoColumns = [
  'photo_image1',
  'photo_image2',
  'photo_image3',
  'photo_image4',
  'photo_image5',
  'photo_image6',
] as const

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })

  logDbTargetInfo(target)

  try {
    const legacyPhotos = await readLegacyTeacherPhotos()
    const teachers = await readTeachers(pool)
    const updates = buildUpdates(teachers, legacyPhotos, options)

    if (!options.dryRun) {
      await applyUpdates(pool, updates)
    }

    console.log(
      JSON.stringify(
        {
          dryRun: options.dryRun,
          matchedTeachers: updates.length,
          updatedColumns: updates.reduce((total, update) => total + Object.keys(update.values).length, 0),
          examples: updates.slice(0, 5).map((update) => ({
            id: update.id,
            name: update.name,
            values: update.values,
          })),
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

function parseArgs(args: string[]): Options {
  return {
    dryRun: args.includes('--dry-run'),
    overwrite: args.includes('--overwrite'),
  }
}

async function readLegacyTeacherPhotos() {
  const entries = new Map<string, LegacyTeacherPhotos>()

  for (const sourceDb of sourceDbs) {
    const filePath = resolveProjectPath('data', 'legacy_dumps', `${sourceDb}.sql`)
    const content = await fs.readFile(filePath, 'utf8')

    for (const line of content.split('\n')) {
      if (!line.startsWith('INSERT INTO `g5_teacher2`')) {
        continue
      }

      const row = parseTeacherInsert(line)
      const sourceId = toInteger(row.bn_id)

      if (!sourceId) {
        continue
      }

      const photos = Object.fromEntries(
        photoColumns
          .map((column) => [column, normalizeText(row[column.replace('photo_image', 'photo_img')])])
          .filter(([, value]) => value),
      ) as LegacyTeacherPhotos

      if (Object.keys(photos).length > 0) {
        entries.set(sourceKey(sourceDb, 'g5_teacher2', sourceId), photos)
      }
    }
  }

  return entries
}

function parseTeacherInsert(line: string) {
  const columnsStart = line.indexOf('(')
  const columnsEnd = line.indexOf(') VALUES', columnsStart)
  const valuesStart = line.indexOf(' VALUES(', columnsEnd) + ' VALUES('.length
  const valuesEnd = line.lastIndexOf(');')

  if (columnsStart < 0 || columnsEnd < 0 || valuesStart < 0 || valuesEnd < 0) {
    throw new Error(`g5_teacher2 INSERT 구문을 해석할 수 없습니다: ${line.slice(0, 120)}`)
  }

  const columns = Array.from(line.slice(columnsStart, columnsEnd).matchAll(/`([^`]+)`/g)).map(
    (match) => match[1],
  )
  const values = splitSqlValues(line.slice(valuesStart, valuesEnd))

  return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']))
}

function splitSqlValues(input: string) {
  const values: string[] = []
  let current = ''
  let inQuote = false
  let escaped = false

  for (const char of input) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\' && inQuote) {
      escaped = true
      continue
    }

    if (char === "'") {
      inQuote = !inQuote
      continue
    }

    if (char === ',' && !inQuote) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())

  return values.map((value) => (value.toUpperCase() === 'NULL' ? '' : value))
}

async function readTeachers(pool: Pool) {
  const result = await pool.query<TeacherRow>(`
    SELECT
      id,
      name,
      source_db,
      source_table,
      source_id,
      photo_image1,
      photo_image2,
      photo_image3,
      photo_image4,
      photo_image5,
      photo_image6
    FROM teachers
    WHERE source_table = 'g5_teacher2'
    ORDER BY id ASC
  `)

  return result.rows
}

function buildUpdates(
  teachers: TeacherRow[],
  legacyPhotos: Map<string, LegacyTeacherPhotos>,
  options: Options,
) {
  const updates: Array<{ id: number; name: string | null; values: Record<string, string> }> = []

  for (const teacher of teachers) {
    if (!teacher.source_db || !teacher.source_table || !teacher.source_id) {
      continue
    }

    const photos = legacyPhotos.get(sourceKey(teacher.source_db, teacher.source_table, teacher.source_id))

    if (!photos) {
      continue
    }

    const values: Record<string, string> = {}

    for (const column of photoColumns) {
      const nextValue = normalizeText(photos[column])
      const currentValue = normalizeText(teacher[column])

      if (nextValue && (options.overwrite || !currentValue)) {
        values[column] = nextValue
      }
    }

    if (Object.keys(values).length > 0) {
      updates.push({ id: teacher.id, name: teacher.name, values })
    }
  }

  return updates
}

async function applyUpdates(
  pool: Pool,
  updates: Array<{ id: number; name: string | null; values: Record<string, string> }>,
) {
  for (const update of updates) {
    const entries = Object.entries(update.values)
    const setSql = entries.map(([column], index) => `"${column}" = $${index + 1}`).join(', ')
    const params = entries.map(([, value]) => value)

    params.push(String(update.id))

    await pool.query(`UPDATE teachers SET ${setSql} WHERE id = $${params.length}`, params)
  }
}

function sourceKey(sourceDb: string, sourceTable: string, sourceId: number) {
  return `${sourceDb}:${sourceTable}:${sourceId}`
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function toInteger(value: unknown) {
  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : undefined
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

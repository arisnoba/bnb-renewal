import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'

import { Pool } from 'pg'

import {
  getDatabaseConnectionString,
  logDbTargetInfo,
  resolveDbTargetInfo,
  resolveProjectPath,
  writeJsonFile,
} from './runtime'

type LegacyFileRow = {
  bfFile: string
  bfNo: number
  boTable: string
  name: string
  sourceDb: string
  sourceId: string
  workId: string
}

type GalleryUpdate = {
  galleryPaths: string[]
  missingPaths: string[]
  name: string
  primaryPath: string
  workId: string
}

const execFileAsync = promisify(execFile)
const galleryColumns = [
  'photo_image1',
  'photo_image2',
  'photo_image3',
  'photo_image4',
  'photo_image5',
  'photo_image6',
] as const

async function main() {
  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)

  logDbTargetInfo(target, { destructive: true })

  if (!target.isLocal) {
    throw new Error('프로필 갤러리 backfill은 로컬 Postgres에서만 실행합니다.')
  }

  const rows = await readLegacyFileRows()
  const updates = buildGalleryUpdates(rows)
  const pool = new Pool({ connectionString })

  try {
    let updated = 0
    let withGallery = 0
    let missingFileCount = 0

    for (const update of updates) {
      missingFileCount += update.missingPaths.length

      if (update.galleryPaths.length === 0) {
        continue
      }

      const values = galleryColumns.map((_, index) => update.galleryPaths[index] ?? null)
      const result = await pool.query(
        `
          UPDATE profiles
          SET
            photo_image1 = $1,
            photo_image2 = $2,
            photo_image3 = $3,
            photo_image4 = $4,
            photo_image5 = $5,
            photo_image6 = $6
          WHERE profile_image_path = $7
        `,
        [...values, update.primaryPath],
      )

      if ((result.rowCount ?? 0) > 0) {
        updated += result.rowCount ?? 0
        withGallery += 1
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      legacyFileRows: rows.length,
      missingFileCount,
      profileGroups: updates.length,
      updatedRows: updated,
      withGallery,
    }

    await writeJsonFile(
      resolveProjectPath('tmp/legacy-assets/profile-gallery-backfill-report.json'),
      {
        ...summary,
        samples: updates
          .filter((update) => update.galleryPaths.length > 0)
          .slice(0, 10),
      },
    )

    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await pool.end()
  }
}

async function readLegacyFileRows() {
  const sql = `
    SELECT
      p.id,
      p.source_db,
      REPLACE(p.source_table, 'g5_write_', '') AS bo_table,
      p.source_id,
      REPLACE(REPLACE(REPLACE(COALESCE(p.name, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS name,
      f.bf_no,
      REPLACE(REPLACE(REPLACE(COALESCE(f.bf_file, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS bf_file
    FROM bnb_legacy_work.profiles p
    JOIN (
      SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_file FROM baewoo.g5_board_file
      UNION ALL
      SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_file FROM bnbuniv.g5_board_file
      UNION ALL
      SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_file FROM kidscenter.g5_board_file
      UNION ALL
      SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_file FROM bnbhighteen.g5_board_file
    ) f
      ON f.source_db = p.source_db
      AND f.bo_table = REPLACE(p.source_table, 'g5_write_', '')
      AND f.wr_id = p.source_id
    WHERE NULLIF(TRIM(f.bf_file), '') IS NOT NULL
    ORDER BY p.id ASC, f.bf_no ASC
  `.trim()
  const { stdout } = await execFileAsync('mysql', [
    '-h127.0.0.1',
    '-P3307',
    '-uroot',
    '-proot',
    '--batch',
    '--raw',
    '--skip-column-names',
    '-e',
    sql,
  ])

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): LegacyFileRow | undefined => {
      const [workId, sourceDb, boTable, sourceId, name, bfNo, bfFile] = line.split('\t')

      if (!workId || !sourceDb || !boTable || !sourceId || !bfFile) {
        return undefined
      }

      return {
        bfFile,
        bfNo: Number(bfNo) || 0,
        boTable,
        name: name ?? '',
        sourceDb,
        sourceId,
        workId,
      }
    })
    .filter((row): row is LegacyFileRow => Boolean(row))
}

function buildGalleryUpdates(rows: LegacyFileRow[]) {
  const grouped = new Map<string, LegacyFileRow[]>()

  for (const row of rows) {
    const key = `${row.sourceDb}:${row.boTable}:${row.sourceId}`
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }

  return Array.from(grouped.values()).map((items): GalleryUpdate => {
    const sortedItems = [...items].sort((left, right) => left.bfNo - right.bfNo)
    const [primary, ...galleryItems] = sortedItems

    if (!primary) {
      throw new Error('프로필 파일 그룹이 비어 있습니다.')
    }

    const primaryPath = profilePath(primary)
    const existingGalleryPaths: string[] = []
    const missingPaths: string[] = []

    for (const item of galleryItems.slice(0, galleryColumns.length)) {
      const path = profilePath(item)

      if (existsSync(resolveProjectPath('public', path.replace(/^\/?legacy\//, 'legacy/')))) {
        existingGalleryPaths.push(path)
      } else {
        missingPaths.push(path)
      }
    }

    return {
      galleryPaths: existingGalleryPaths,
      missingPaths,
      name: primary.name,
      primaryPath,
      workId: primary.workId,
    }
  })
}

function profilePath(row: LegacyFileRow) {
  return `/legacy/profiles/${row.sourceDb}/${row.boTable}/${row.sourceId}/${row.bfFile}`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

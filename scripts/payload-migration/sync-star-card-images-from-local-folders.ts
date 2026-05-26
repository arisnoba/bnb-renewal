import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

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
  outputPath: string
  write: boolean
}

type StarCardFolderConfig = {
  folder: string
  order: number
  slug: string
  title: string
  titleAliases?: string[]
}

type StarCardRow = {
  display_order: string | null
  display_status: string | null
  id: number
  slug: string
  title: string
}

type ImageFile = {
  filename: string
  localPath: string
}

type SyncResult = {
  action: 'dry-run' | 'order-updated' | 'synced' | 'skipped-missing-folder' | 'write-error'
  errorMessage?: string
  imageCount: number
  mediaIds?: number[]
  order: number
  slug: string
  starCardId?: number
  title: string
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

const SOURCE_DIR = 'public/star-card'
const OUTPUT_PATH = 'tmp/legacy-assets/star-card-local-folder-sync-report.json'
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

const STAR_CARD_FOLDERS: StarCardFolderConfig[] = [
  {
    folder: '1. 휴메이크 휘트니스',
    order: 1,
    slug: 'humake-fitness-nonhyeon',
    title: '휴메이크 휘트니스 논현점',
  },
  {
    folder: '2. 배우화 스튜디오',
    order: 2,
    slug: 'baewoohwa',
    title: 'BAEWOOHWA',
    titleAliases: ['배우화 스튜디오'],
  },
  {
    folder: '3. CK성모안과',
    order: 3,
    slug: 'ck-st-mary-eye-clinic',
    title: 'CK성모안과',
  },
  {
    folder: '4. 강남미라인치과',
    order: 4,
    slug: 'gangnam-miline-dental',
    title: '강남미라인치과',
  },
  {
    folder: '5. 강남젠틀치과',
    order: 5,
    slug: 'gangnam-gentle-dental',
    title: '강남젠틀치과',
  },
  {
    folder: '6. 클레어치과의원',
    order: 6,
    slug: 'claire-dental-clinic',
    title: '클레어치과의원',
    titleAliases: ['클레어치과'],
  },
  {
    folder: '7. 제림 성형외과',
    order: 7,
    slug: 'jerim-plastic-surgery',
    title: '제림 성형외과',
  },
  {
    folder: '9. 리쥬엘 의원',
    order: 9,
    slug: 'rejuel-clinic-gangnam',
    title: '리쥬엘의원 강남점',
    titleAliases: ['리쥬엘 의원'],
  },
  {
    folder: '10. 모텐셜 의원',
    order: 10,
    slug: 'motential-clinic',
    title: '모텐셜의원',
    titleAliases: ['모텐셜 의원'],
  },
  {
    folder: '11. THE아름다운의원',
    order: 11,
    slug: 'the-areumdaun-clinic',
    title: '더아름다운의원',
    titleAliases: ['THE아름다운의원'],
  },
  {
    folder: '12. 빌리프 성형외과',
    order: 12,
    slug: 'vlif-plastic-surgery',
    title: '빌리프 성형외과',
  },
  {
    folder: '12. 십장생 한의원',
    order: 13,
    slug: 'sipjangsaeng-korean-medicine',
    title: '십장생 한의원',
  },
  {
    folder: '14. 오다 한의원',
    order: 14,
    slug: 'oda-korean-medicine-gangnam',
    title: '오다한의원 강남',
    titleAliases: ['오다 한의원'],
  },
  {
    folder: '15. 순수',
    order: 15,
    slug: 'soonsoo',
    title: '순수',
  },
  {
    folder: '16. MUAH(도산 무아)',
    order: 16,
    slug: 'muah',
    title: 'MUAH(도산 무아)',
  },
  {
    folder: '17. YONING(요닝)',
    order: 17,
    slug: 'yoning',
    title: 'YONING',
    titleAliases: ['YONING(요닝)'],
  },
  {
    folder: '18. 정샘물 인스피레이션',
    order: 18,
    slug: 'jungsaemmool-inspiration',
    title: '정샘물 인스피레이션',
  },
  {
    folder: '19. 메이븐 바이 범호',
    order: 19,
    slug: 'maven-by-bumho',
    title: '메이븐 바이 범호',
  },
  {
    folder: '20. 드블랙 맨즈헤어',
    order: 20,
    slug: 'de-black-mens-hair',
    title: '드블랙 맨즈헤어',
  },
  {
    folder: '21. 코뿔소안경원',
    order: 21,
    slug: 'rhinoceros-optical',
    title: '코뿔소 안경원',
    titleAliases: ['코뿔소안경원'],
  },
  {
    folder: '23. 디어밀',
    order: 23,
    slug: 'dearmeal',
    title: '디어밀',
  },
  {
    folder: '24. 더벤티 논현역점',
    order: 24,
    slug: 'the-venti',
    title: '더벤티 논현역점',
  },
  {
    folder: '25. 댕크커피',
    order: 25,
    slug: 'dank-coffee',
    title: '댕크커피',
  },
  {
    folder: '26. 어딕티브',
    order: 26,
    slug: 'addictive',
    title: '어딕티브',
  },
  {
    folder: '27. RE&(카페 리엔)',
    order: 27,
    slug: 're-and',
    title: 'RE&',
    titleAliases: ['RE&(카페 리엔)'],
  },
]

const ORDER_ONLY_STAR_CARDS = [
  {
    displayStatus: 'published',
    order: 8,
    slug: 'chloen-plastic-surgery',
    title: '클로엔 성형외과',
  },
  {
    displayStatus: 'archived',
    order: 22,
    slug: 'glow-beauty',
    title: '글로우 뷰티',
  },
]

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!options.write && !options.dryRun) {
    options.dryRun = true
  }

  if (options.write && options.dryRun) {
    throw new Error('`--write` 와 `--dry-run` 은 함께 사용할 수 없습니다.')
  }

  const connectionString = getDatabaseConnectionString({ preferUnpooled: true })
  const target = resolveDbTargetInfo(connectionString)
  const pool = new Pool({ connectionString })
  const payload = options.write ? await getPayloadForWrite() : undefined

  logDbTargetInfo(target, { destructive: options.write })

  if (options.write && !target.isLocal && process.env.ALLOW_DESTRUCTIVE_C0 !== '1') {
    throw new Error('비로컬 DB 쓰기는 ALLOW_DESTRUCTIVE_C0=1 을 명시해야 합니다.')
  }

  try {
    const folderByConfig = await readFolders()
    const missingFolderConfigs = STAR_CARD_FOLDERS.filter((config) => !folderByConfig.has(config.folder))
    const unexpectedFolders = [...folderByConfig.keys()].filter(
      (folder) => !STAR_CARD_FOLDERS.some((config) => config.folder === folder),
    )
    const results: SyncResult[] = []

    for (const config of STAR_CARD_FOLDERS) {
      const folderPath = folderByConfig.get(config.folder)

      if (!folderPath) {
        results.push({
          action: 'skipped-missing-folder',
          imageCount: 0,
          order: config.order,
          slug: config.slug,
          title: config.title,
        })
        continue
      }

      const imageFiles = await readImageFiles(folderPath)
      results.push(await syncStarCard({ config, imageFiles, options, payload, pool }))
    }

    for (const config of ORDER_ONLY_STAR_CARDS) {
      results.push(await syncOrderOnlyStarCard({ config, options, pool }))
    }

    const untouchedStarCards = await readUntouchedStarCards(pool)
    const output = {
      dryRun: options.dryRun,
      generatedAt: new Date().toISOString(),
      missingFolderConfigs,
      options,
      results,
      totals: buildTotals(results),
      untouchedStarCards,
      unexpectedFolders,
      write: options.write,
    }

    await writeJsonFile(resolveProjectPath(options.outputPath), output)
    console.log(
      JSON.stringify(
        {
          outputPath: options.outputPath,
          totals: output.totals,
          untouchedStarCards,
          unexpectedFolders,
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

async function syncOrderOnlyStarCard({
  config,
  options,
  pool,
}: {
  config: (typeof ORDER_ONLY_STAR_CARDS)[number]
  options: Options
  pool: Pool
}): Promise<SyncResult> {
  const result = await pool.query<StarCardRow>(
    `
      SELECT id, title, slug, display_order, display_status
      FROM star_cards
      WHERE slug = $1
      ORDER BY id ASC
      LIMIT 1
    `,
    [config.slug],
  )
  const starCard = result.rows[0]

  if (!starCard) {
    return {
      action: 'skipped-missing-folder',
      imageCount: 0,
      order: config.order,
      slug: config.slug,
      title: config.title,
    }
  }

  if (options.dryRun) {
    return {
      action: 'dry-run',
      imageCount: 0,
      order: config.order,
      slug: config.slug,
      starCardId: starCard.id,
      title: config.title,
    }
  }

  await pool.query(
    `
      UPDATE star_cards
      SET display_order = $1, display_status = $2, updated_at = NOW()
      WHERE id = $3
    `,
    [config.order, config.displayStatus, starCard.id],
  )
  await normalizeBodyImageOrder(pool, starCard.id)

  return {
    action: 'order-updated',
    imageCount: 0,
    order: config.order,
    slug: config.slug,
    starCardId: starCard.id,
    title: config.title,
  }
}

async function normalizeBodyImageOrder(pool: Pool, starCardId: number) {
  await pool.query(
    `
      WITH ordered AS (
        SELECT
          id,
          row_number() OVER (ORDER BY _order ASC, id ASC) - 1 AS next_order
        FROM star_cards_body_images
        WHERE _parent_id = $1
      )
      UPDATE star_cards_body_images AS body_images
      SET _order = ordered.next_order
      FROM ordered
      WHERE body_images.id = ordered.id
    `,
    [starCardId],
  )
}

function parseArgs(args: string[]): Options {
  let dryRun = false
  let outputPath = OUTPUT_PATH
  let write = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--output') {
      outputPath = readRequiredValue(args, index, '--output')
      index += 1
      continue
    }

    if (arg === '--write') {
      write = true
    }
  }

  return { dryRun, outputPath, write }
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

async function readFolders() {
  const sourceDir = resolveProjectPath(SOURCE_DIR)
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const folders = new Map<string, string>()

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue
    }

    folders.set(normalizeText(entry.name), path.join(sourceDir, entry.name))
  }

  return folders
}

async function readImageFiles(folderPath: string) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({
      filename: entry.name,
      localPath: path.join(folderPath, entry.name),
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename, 'ko', { numeric: true }))
}

async function syncStarCard({
  config,
  imageFiles,
  options,
  payload,
  pool,
}: {
  config: StarCardFolderConfig
  imageFiles: ImageFile[]
  options: Options
  payload?: DynamicPayload
  pool: Pool
}): Promise<SyncResult> {
  try {
    const existing = await findStarCard(pool, config)

    if (options.dryRun) {
      return {
        action: 'dry-run',
        imageCount: imageFiles.length,
        order: config.order,
        slug: config.slug,
        starCardId: existing?.id,
        title: config.title,
      }
    }

    if (!payload) {
      throw new Error('쓰기 모드에는 Payload client 가 필요합니다.')
    }

    const starCard = existing ?? (await createStarCard(pool, config))
    const mediaIds = []

    for (const imageFile of imageFiles) {
      mediaIds.push(
        await createOrReuseMedia({
          imageFile,
          payload,
          pool,
          starCard,
          title: config.title,
        }),
      )
    }

    await replaceBodyImages(pool, starCard.id, mediaIds)
    await pool.query(
      `
        UPDATE star_cards
        SET display_order = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [config.order, starCard.id],
    )

    return {
      action: 'synced',
      imageCount: imageFiles.length,
      mediaIds,
      order: config.order,
      slug: config.slug,
      starCardId: starCard.id,
      title: config.title,
    }
  } catch (error) {
    return {
      action: 'write-error',
      errorMessage: error instanceof Error ? error.message : String(error),
      imageCount: imageFiles.length,
      order: config.order,
      slug: config.slug,
      title: config.title,
    }
  }
}

async function findStarCard(pool: Pool, config: StarCardFolderConfig) {
  const titles = [config.title, ...(config.titleAliases ?? [])]
  const result = await pool.query<StarCardRow>(
    `
      SELECT id, title, slug, display_order, display_status
      FROM star_cards
      WHERE slug = $1 OR title = ANY($2)
      ORDER BY id ASC
      LIMIT 1
    `,
    [config.slug, titles],
  )

  return result.rows[0]
}

async function createStarCard(pool: Pool, config: StarCardFolderConfig) {
  const result = await pool.query<StarCardRow>(
    `
      INSERT INTO star_cards (
        title,
        display_status,
        display_order,
        published_at,
        author_name,
        generate_slug,
        slug,
        created_at,
        updated_at
      )
      VALUES ($1, 'published', $2, NOW(), '배우앤배움 전체 센터', false, $3, NOW(), NOW())
      RETURNING id, title, slug, display_order, display_status
    `,
    [config.title, config.order, config.slug],
  )
  const starCard = result.rows[0]

  await pool.query(
    `
      INSERT INTO star_cards_centers ("order", parent_id, value)
      VALUES (1, $1, 'all')
    `,
    [starCard.id],
  )

  return starCard
}

async function createOrReuseMedia({
  imageFile,
  payload,
  pool,
  starCard,
  title,
}: {
  imageFile: ImageFile
  payload: DynamicPayload
  pool: Pool
  starCard: StarCardRow
  title: string
}) {
  const prefix = path.posix.join('media/star-cards/images', String(starCard.id))
  const existing = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM media
      WHERE prefix = $1 AND filename = $2
      ORDER BY id ASC
      LIMIT 1
    `,
    [prefix, imageFile.filename],
  )

  if (existing.rows[0]) {
    return existing.rows[0].id
  }

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: `${title} ${imageFile.filename}`,
      prefix,
    },
    filePath: imageFile.localPath,
    overrideAccess: true,
  })
  const id = Number(created.id)

  if (!Number.isFinite(id)) {
    throw new Error(`media 생성 후 id를 확인할 수 없습니다: ${String(created.id)}`)
  }

  return id
}

async function replaceBodyImages(pool: Pool, starCardId: number, mediaIds: number[]) {
  await pool.query('BEGIN')

  try {
    await pool.query('DELETE FROM star_cards_body_images WHERE _parent_id = $1', [starCardId])

    for (let index = 0; index < mediaIds.length; index += 1) {
      await pool.query(
        `
          INSERT INTO star_cards_body_images (_order, _parent_id, id, image_media_id)
          VALUES ($1, $2, $3, $4)
        `,
        [index, starCardId, randomUUID().replace(/-/g, ''), mediaIds[index]],
      )
    }

    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }
}

async function readUntouchedStarCards(pool: Pool) {
  const slugs = [
    ...STAR_CARD_FOLDERS.map((config) => config.slug),
    ...ORDER_ONLY_STAR_CARDS.map((config) => config.slug),
  ]
  const result = await pool.query<{
    display_order: string | null
    display_status: string | null
    slug: string
    title: string
  }>(
    `
      SELECT title, slug, display_order, display_status
      FROM star_cards
      WHERE slug <> ALL($1)
      ORDER BY display_order NULLS LAST, id
    `,
    [slugs],
  )

  return result.rows
}

async function getPayloadForWrite(): Promise<DynamicPayload> {
  const { getPayloadClient } = await import('../../src/lib/payload')
  return (await getPayloadClient()) as unknown as DynamicPayload
}

function buildTotals(results: SyncResult[]) {
  return results.reduce<Record<string, number>>(
    (totals, result) => ({
      ...totals,
      [result.action]: (totals[result.action] ?? 0) + 1,
      images: (totals.images ?? 0) + result.imageCount,
    }),
    {},
  )
}

function normalizeText(value: string) {
  return value.normalize('NFC').trim()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })

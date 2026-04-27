import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { Payload } from 'payload'

import { authorNameFromCenters } from '../../src/collections/shared'
import { getPayloadClient } from '../../src/lib/payload'
import { parseProfileCareerItems } from '../../src/lib/profileBodyHtml'

const execFileAsync = promisify(execFile)

type Options = {
  collections: string[]
  dryRun: boolean
  limit: 'all' | number
}

type WorkRow = Record<string, unknown>
type PayloadDoc = Record<string, unknown>
type DynamicPayload = {
  create: (args: {
    collection: string
    data: PayloadDoc
    overrideAccess: boolean
  }) => Promise<unknown>
  find: (args: {
    collection: string
    depth: number
    limit: number
    overrideAccess: boolean
    where: Record<string, { equals: unknown }>
  }) => Promise<{ docs: { id: number | string }[] }>
  update: (args: {
    collection: string
    data: PayloadDoc
    id: number | string
    overrideAccess: boolean
  }) => Promise<unknown>
}

type TableConfig = {
  collection: string
  columns: string[]
  table: string
  transform: (row: WorkRow, context: SeedContext) => PayloadDoc
  uniqueField?: string
}

type SeedContext = {
  teacherCentersBySlug: Map<string, string[]>
  teacherFilesByTeacherSlug: Map<string, WorkRow[]>
  teacherIdsBySlug: Map<string, number | string>
}

type RepresentativeWork = {
  description: string | undefined
  displayOrder: number
  posterPath: string | undefined
  rawSourceDb: string | undefined
  title: string
}

const defaultUniqueField = 'slug'

const configs: TableConfig[] = [
  {
    collection: 'agencies',
    table: 'agencies',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'name',
      'subject',
      'summary',
      'body_html',
      'profile_image_path',
      'actors',
      'display_order',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      actors: parseJsonArray(row.actors),
      bodyHtml: text(row.body_html),
      centers: ['art'],
      displayOrder: number(row.display_order),
      legacyMeta: parseJsonValue(row.legacy_meta),
      name: text(row.name),
      profileImagePath: text(row.profile_image_path),
      subject: requiredText(row.subject, 'agencies.subject'),
      summary: text(row.summary),
    }),
  },
  {
    collection: 'artist-press',
    table: 'artist_press',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'title',
      'body_html',
      'actor_name',
      'generation',
      'agency_logo_path',
      'thumbnail_path',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      actorName: requiredText(row.actor_name, 'artist_press.actor_name'),
      agencyLogoPath: text(row.agency_logo_path),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.center),
      generation: requiredText(row.generation, 'artist_press.generation'),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      publishedAt: dateText(row.published_at),
      thumbnailPath: text(row.thumbnail_path),
      title: requiredText(row.title, 'artist_press.title'),
    }),
  },
  {
    collection: 'audition-schedules',
    table: 'audition_schedules',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'dedupe_key',
      'centers',
      'event_type',
      'title',
      'body_html',
      'schedule_start_date',
      'schedule_end_date',
      'schedule_start_raw',
      'schedule_end_raw',
      'author_name',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      authorName: text(row.author_name),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.centers),
      dedupeKey: requiredText(row.dedupe_key, 'audition_schedules.dedupe_key'),
      eventType: text(row.event_type),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      publishedAt: dateText(row.published_at),
      scheduleEndDate: dateText(row.schedule_end_date),
      scheduleEndRaw: requiredText(row.schedule_end_raw, 'audition_schedules.schedule_end_raw'),
      scheduleStartDate: dateText(row.schedule_start_date),
      scheduleStartRaw: requiredText(row.schedule_start_raw, 'audition_schedules.schedule_start_raw'),
      title: requiredText(row.title, 'audition_schedules.title'),
    }),
  },
  {
    collection: 'casting-directors',
    table: 'castings',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'person_name',
      'company',
      'centers',
      'body_html',
      'category',
      'author_name',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      authorName: text(row.author_name),
      bodyHtml: text(row.body_html),
      category: text(row.category),
      centers: centersFrom(row.centers),
      company: requiredText(row.company, 'castings.company'),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      personName: requiredText(row.person_name, 'castings.person_name'),
      publishedAt: dateText(row.published_at),
    }),
  },
  {
    collection: 'casting-appearances',
    table: 'casting_appearances',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'title',
      'body_html',
      'broadcaster',
      'production_company',
      'directors',
      'writers',
      'casting_status',
      'casting_company',
      'thumbnail_path',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => {
      const legacyMeta = parseJsonValue(row.legacy_meta)

      return {
        ...sourceDoc(row),
        bodyHtml: text(row.body_html),
        broadcaster: text(row.broadcaster),
        castingCompany: text(row.casting_company),
        castingStatus: text(row.casting_status),
        castMembers: buildCastingAppearanceCastMembers(legacyMeta),
        centers: centersFrom(row.center),
        directors: text(row.directors),
        displayStatus: displayStatusFromPublic(row.is_public),
        legacyMeta,
        productionCompany: text(row.production_company),
        publishedAt: dateText(row.published_at),
        thumbnailPath: text(row.thumbnail_path),
        title: requiredText(row.title, 'casting_appearances.title'),
        writers: text(row.writers),
      }
    },
  },
  {
    collection: 'exam-passed-reviews',
    table: 'exam_passed_reviews',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'school_name',
      'school_logo_slug',
      'title',
      'body_html',
      'school_logo_path',
      'student_image_path',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.center),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      publishedAt: dateText(row.published_at),
      schoolLogoPath: text(row.school_logo_path),
      schoolLogoSlug: text(row.school_logo_slug),
      schoolName: requiredText(row.school_name, 'exam_passed_reviews.school_name'),
      studentImagePath: text(row.student_image_path),
      title: requiredText(row.title, 'exam_passed_reviews.title'),
    }),
  },
  {
    collection: 'exam-passed-videos',
    table: 'exam_passed_videos',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'title',
      'body_html',
      'youtube_code',
      'youtube_url',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      bodyHtml: text(row.body_html),
      centers: ['exam'],
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      publishedAt: dateText(row.published_at),
      title: requiredText(row.title, 'exam_passed_videos.title'),
      youtubeCode: requiredText(row.youtube_code, 'exam_passed_videos.youtube_code'),
      youtubeUrl: requiredText(row.youtube_url, 'exam_passed_videos.youtube_url'),
    }),
  },
  {
    collection: 'exam-results',
    table: 'exam_results',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'result_type',
      'title',
      'body_html',
      'thumbnail_path',
      'thumbnail_source',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.center),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      publishedAt: dateText(row.published_at),
      resultType: text(row.result_type),
      thumbnailPath: text(row.thumbnail_path),
      thumbnailSource: text(row.thumbnail_source),
      title: requiredText(row.title, 'exam_results.title'),
    }),
  },
  {
    collection: 'exam-school-logos',
    table: 'exam_school_logos',
    columns: [
      'school_name',
      'school_slug',
      'logo_path',
      'logo_original_name',
      'logo_file',
      'logo_width',
      'logo_height',
      'review_count',
      'legacy_meta',
    ],
    transform: (row) => ({
      centers: ['exam'],
      authorName: authorNameFromCenters(['exam']),
      legacyMeta: parseJsonValue(row.legacy_meta),
      logoFile: text(row.logo_file),
      logoHeight: number(row.logo_height),
      logoOriginalName: text(row.logo_original_name),
      logoPath: text(row.logo_path),
      logoWidth: number(row.logo_width),
      reviewCount: number(row.review_count),
      schoolName: requiredText(row.school_name, 'exam_school_logos.school_name'),
      schoolSlug: requiredText(row.school_slug, 'exam_school_logos.school_slug'),
    }),
    uniqueField: 'schoolSlug',
  },
  {
    collection: 'news',
    table: 'news',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'category',
      'title',
      'body_html',
      'thumbnail_path',
      'attachments_json',
      'author_name',
      'view_count',
      'is_public',
      'published_at',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      authorName: text(row.author_name),
      bodyHtml: requiredText(row.body_html, 'news.body_html'),
      category: text(row.category),
      centers: centersFrom(row.center),
      thumbnailPath: text(row.thumbnail_path),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: {
        attachments: parseJsonValue(row.attachments_json),
        ...(objectValue(parseJsonValue(row.legacy_meta)) ?? {}),
      },
      publishedAt: dateText(row.published_at),
      title: requiredText(row.title, 'news.title'),
      viewCount: number(row.view_count),
    }),
  },
  {
    collection: 'profiles',
    table: 'profiles',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'filter',
      'name',
      'height',
      'weight',
      'english_name',
      'profile_image_path',
      'body_html',
      'author_name',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => {
      return {
        ...sourceDoc(row),
        authorName: text(row.author_name),
        careerItems: parseProfileCareerItems(row.body_html),
        centers: centersFrom(row.center),
        englishName: text(row.english_name),
        filter: text(row.filter),
        height: text(row.height),
        displayStatus: displayStatusFromPublic(row.is_public),
        legacyMeta: parseJsonValue(row.legacy_meta),
        name: requiredText(row.name, 'profiles.name'),
        publishedAt: dateText(row.published_at),
        profileImagePath: text(row.profile_image_path),
        weight: text(row.weight),
      }
    },
  },
  {
    collection: 'screen-appearances',
    table: 'screen_appearances',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'center',
      'appearance_type',
      'title',
      'body_html',
      'performer_name',
      'class_name',
      'project_title',
      'role_name',
      'air_date_label',
      'profile_image_path',
      'thumbnail_path',
      'published_at',
      'is_public',
      'legacy_meta',
    ],
    transform: (row) => ({
      ...sourceDoc(row),
      airDateLabel: text(row.air_date_label),
      appearanceType: text(row.appearance_type),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.center),
      className: text(row.class_name),
      displayStatus: displayStatusFromPublic(row.is_public),
      legacyMeta: parseJsonValue(row.legacy_meta),
      performerName: text(row.performer_name),
      profileImagePath: text(row.profile_image_path),
      projectTitle: text(row.project_title),
      publishedAt: dateText(row.published_at),
      roleName: text(row.role_name),
      thumbnailPath: text(row.thumbnail_path),
      title: requiredText(row.title, 'screen_appearances.title'),
    }),
  },
  {
    collection: 'teachers',
    table: 'teachers',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'slug',
      'name',
      'normalized_name',
      'role',
      'centers',
      'summary',
      'body_html',
      'profile_image_path',
      'photo_image1',
      'photo_image2',
      'photo_image3',
      'photo_image4',
      'photo_image5',
      'photo_image6',
      'gallery',
      'display_order',
      'status',
      'legacy_meta',
    ],
    transform: (row, context) => ({
      ...sourceDoc(row),
      bioHtml: requiredText(row.body_html, 'teachers.body_html'),
      centers: centersFrom(row.centers),
      displayOrder: number(row.display_order),
      gallery: normalizeGallery(row.gallery),
      legacyMeta: {
        normalizedName: text(row.normalized_name),
        ...(objectValue(parseJsonValue(row.legacy_meta)) ?? {}),
      },
      name: requiredText(row.name, 'teachers.name'),
      photoImage1: text(row.photo_image1),
      photoImage2: text(row.photo_image2),
      photoImage3: text(row.photo_image3),
      photoImage4: text(row.photo_image4),
      photoImage5: text(row.photo_image5),
      photoImage6: text(row.photo_image6),
      profileImagePath: text(row.profile_image_path),
      representativeWorks: buildRepresentativeWorks(
        context.teacherFilesByTeacherSlug.get(requiredText(row.slug, 'teachers.slug')) ?? [],
        requiredText(row.source_db, 'teachers.source_db'),
      ),
      role: text(row.role),
      status: status(row.status),
      summary: text(row.summary),
    }),
  },
  {
    collection: 'curriculums',
    table: 'teacher_lessons',
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'category',
      'teacher_name',
      'resolved_teacher_id',
      'resolved_teacher_slug',
      'subject',
      'title_raw',
      'content_raw',
      'legacy_meta',
    ],
    transform: (row, context) => ({
      ...sourceDoc({
        ...row,
        slug: `curriculum-${row.source_db}-${row.source_table}-${row.source_id}`,
      }),
      centers: teacherCentersFromSlug(row.resolved_teacher_slug, row.source_db, context),
      category: text(row.category),
      contentRaw: text(row.content_raw),
      legacyMeta: parseJsonValue(row.legacy_meta),
      resolvedTeacherId: number(row.resolved_teacher_id),
      resolvedTeacherSlug: text(row.resolved_teacher_slug),
      subject: text(row.subject),
      teacher: teacherIdFromSlug(row.resolved_teacher_slug, context),
      teacherName: text(row.teacher_name),
      titleRaw: text(row.title_raw),
      weeklyLessons: buildCurriculumWeeklyLessons(row.title_raw, row.content_raw),
    }),
  },
]

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const selected = selectConfigs(options.collections)
  const payload = options.dryRun ? null : await getPayloadClient()
  const context = await buildSeedContext()
  const summary: Record<string, { created: number; dryRun: number; updated: number }> = {}

  for (const config of selected) {
    if (config.collection === 'curriculums' && payload) {
      context.teacherIdsBySlug = await readPayloadTeacherIdsBySlug(payload)
    }

    const rows = normalizeRowsForSeed(config, await readWorkTable(config))
    const limitedRows = options.limit === 'all' ? rows : rows.slice(0, options.limit)
    const collectionSummary = { created: 0, dryRun: 0, updated: 0 }

    for (const row of limitedRows) {
      const doc = config.transform(row, context)
      applyAuthorName(doc)

      if (options.dryRun) {
        collectionSummary.dryRun += 1
        continue
      }

      const result = await upsertDoc(payload!, config, doc)

      collectionSummary[result] += 1
    }

    summary[config.collection] = collectionSummary
  }

  console.log(JSON.stringify({ dryRun: options.dryRun, summary }, null, 2))
}

function normalizeRowsForSeed(config: TableConfig, rows: WorkRow[]) {
  if (config.collection !== 'curriculums') {
    return rows
  }

  return dedupeCurriculumRows(rows)
}

function dedupeCurriculumRows(rows: WorkRow[]) {
  const bestRows = new Map<string, WorkRow>()

  for (const row of rows) {
    const key = curriculumDedupeKey(row)
    const current = bestRows.get(key)

    if (!current || number(row.source_id, Number.MAX_SAFE_INTEGER) < number(current.source_id, Number.MAX_SAFE_INTEGER)) {
      bestRows.set(key, row)
    }
  }

  return Array.from(bestRows.values()).sort(
    (left, right) =>
      number(left.source_id, Number.MAX_SAFE_INTEGER) -
      number(right.source_id, Number.MAX_SAFE_INTEGER),
  )
}

function curriculumDedupeKey(row: WorkRow) {
  return JSON.stringify({
    lessons: normalizeCurriculumDedupeValue(
      JSON.stringify(buildCurriculumWeeklyLessons(row.title_raw, row.content_raw)),
    ),
    subject: normalizeCurriculumDedupeValue(text(row.subject)),
    teacherName: normalizeCurriculumDedupeValue(text(row.teacher_name)),
  })
}

function normalizeCurriculumDedupeValue(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+/g, '')
}

function parseArgs(args: string[]): Options {
  let collections: string[] = []
  let dryRun = false
  let limit: Options['limit'] = 'all'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg.startsWith('--collections=')) {
      collections = arg
        .replace('--collections=', '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      continue
    }

    if (arg === '--collections') {
      collections = readRequiredValue(args, index, '--collections')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (arg.startsWith('--limit=')) {
      limit = parseLimit(arg.replace('--limit=', ''))
      continue
    }

    if (arg === '--limit') {
      limit = parseLimit(readRequiredValue(args, index, '--limit'))
      index += 1
    }
  }

  return { collections, dryRun, limit }
}

function parseLimit(value: string): Options['limit'] {
  if (value === 'all') {
    return 'all'
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`잘못된 --limit 값입니다: ${value}`)
  }

  return parsed
}

function selectConfigs(collections: string[]) {
  if (collections.length === 0) {
    return configs
  }

  const selected = configs.filter((config) => collections.includes(config.collection))
  const selectedNames = new Set(selected.map((config) => config.collection))
  const missing = collections.filter((collection) => !selectedNames.has(collection))

  if (missing.length > 0) {
    throw new Error(`알 수 없는 컬렉션입니다: ${missing.join(', ')}`)
  }

  return selected
}

async function buildSeedContext(): Promise<SeedContext> {
  const teachers = await readRows('teachers', ['slug', 'centers'])
  const teacherFiles = await readRows('teacher_files', [
    'source_db',
    'source_table',
    'source_id',
    'teacher_source_id',
    'resolved_teacher_slug',
    'title',
    'file_path',
    'description',
    'display_order',
    'legacy_meta',
  ])

  const teacherFilesByTeacherSlug = new Map<string, WorkRow[]>()
  const teacherCentersBySlug = new Map<string, string[]>()

  for (const row of teachers) {
    const slug = text(row.slug)

    if (!slug) {
      continue
    }

    teacherCentersBySlug.set(slug, centersFrom(row.centers))
  }

  for (const row of teacherFiles) {
    const slug = text(row.resolved_teacher_slug)

    if (!slug) {
      continue
    }

    const current = teacherFilesByTeacherSlug.get(slug) ?? []
    current.push(row)
    teacherFilesByTeacherSlug.set(slug, current)
  }

  return {
    teacherCentersBySlug,
    teacherFilesByTeacherSlug,
    teacherIdsBySlug: new Map(),
  }
}

async function readPayloadTeacherIdsBySlug(payload: Payload) {
  const result = await (payload as unknown as {
    find: (args: {
      collection: string
      depth: number
      limit: number
      overrideAccess: boolean
      pagination: boolean
    }) => Promise<{ docs: { id: number | string; slug?: unknown }[] }>
  }).find({
    collection: 'teachers',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
  })

  return new Map(
    result.docs
      .map((doc) => [text(doc.slug), doc.id] as const)
      .filter((entry): entry is readonly [string, number | string] => Boolean(entry[0])),
  )
}

async function readWorkTable(config: TableConfig): Promise<WorkRow[]> {
  return readRows(config.table, config.columns)
}

async function readRows(table: string, columns: string[]): Promise<WorkRow[]> {
  const jsonPairs = columns
    .flatMap((column) => [`'${column}'`, `\`${column}\``])
    .join(', ')
  const query = `SELECT JSON_OBJECT(${jsonPairs}) FROM \`bnb_legacy_work\`.\`${table}\` ORDER BY 1`
  const { stdout } = await execFileAsync('docker', [
    'compose',
    'exec',
    '-T',
    'legacy-mariadb',
    'mariadb',
    '-uroot',
    '-proot',
    '--batch',
    '--raw',
    '--skip-column-names',
    '--execute',
    query,
  ], { maxBuffer: 1024 * 1024 * 128 })

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WorkRow)
}

async function upsertDoc(payload: Payload, config: TableConfig, doc: PayloadDoc) {
  const uniqueField = config.uniqueField ?? defaultUniqueField
  const uniqueValue = doc[uniqueField]
  const dynamicPayload = payload as unknown as DynamicPayload

  if (!uniqueValue) {
    throw new Error(`${config.collection}.${uniqueField} 값이 비어 있습니다.`)
  }

  const existing = await dynamicPayload.find({
    collection: config.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      [uniqueField]: {
        equals: uniqueValue,
      },
    },
  })

  if (existing.docs[0]) {
    await dynamicPayload.update({
      collection: config.collection,
      data: doc,
      id: existing.docs[0].id,
      overrideAccess: true,
    })

    return 'updated' as const
  }

  await dynamicPayload.create({
    collection: config.collection,
    data: doc,
    overrideAccess: true,
  })

  return 'created' as const
}

function sourceDoc(row: WorkRow) {
  return {
    slug: requiredText(row.slug, 'slug'),
    sourceDb: requiredText(row.source_db, 'source_db'),
    sourceId: number(row.source_id),
    sourceTable: requiredText(row.source_table, 'source_table'),
  }
}

function applyAuthorName(doc: PayloadDoc) {
  if ('centers' in doc) {
    doc.authorName = authorNameFromCenters(doc.centers)
  }
}

function centersFrom(value: unknown) {
  const parsed = parseJsonValue(value)
  const values = Array.isArray(parsed) ? parsed : [parsed]
  const centers = values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

  if (centers.length === 0) {
    throw new Error('센터 값이 비어 있습니다.')
  }

  return centers
}

function parseJsonArray(value: unknown): unknown[] {
  const parsed = parseJsonValue(value)

  return Array.isArray(parsed) ? parsed : []
}

function normalizeGallery(value: unknown) {
  return parseJsonArray(value)
    .map((item) => objectValue(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      description: text(item.description),
      path: text(item.path),
      title: text(item.title),
    }))
    .filter((item) => Boolean(item.path))
}

function buildRepresentativeWorks(rows: WorkRow[], teacherSourceDb: string) {
  const sameSourceRows = rows.filter((row) => text(row.source_db) === teacherSourceDb)
  const candidateRows = sameSourceRows.length > 0 ? sameSourceRows : rows
  const bestByKey = new Map<string, RepresentativeWork>()

  for (const row of candidateRows) {
    const item = {
      description: text(row.description),
      displayOrder: number(row.display_order),
      rawSourceDb: text(row.source_db),
      posterPath: teacherFilePosterPath(row),
      title: text(row.title) ?? text(row.description) ?? fileBasename(row.file_path) ?? '제목 없음',
    }

    if (!item.posterPath && !normalizedTitle(item.title) && !item.description) {
      continue
    }

    const key = representativeWorkDedupKey(item)
    const current = bestByKey.get(key)

    if (!current || compareRepresentativeWork(item, current, teacherSourceDb) > 0) {
      bestByKey.set(key, item)
    }
  }

  return Array.from(bestByKey.values())
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((item) => ({
      description: item.description,
      displayOrder: item.displayOrder,
      posterPath: item.posterPath,
      title: item.title,
    }))
}

function buildCastingAppearanceCastMembers(legacyMeta: unknown) {
  const rawFields = objectValue(objectValue(legacyMeta)?.rawFields)

  if (!rawFields) {
    return []
  }

  const actorNames = splitLegacyRows(rawFields.wr8)
  const roleNames = splitLegacyRows(rawFields.wr9)
  const episodeNumbers = splitLegacyRows(rawFields.wr10)
  const rowCount = Math.max(actorNames.length, roleNames.length, episodeNumbers.length)
  const castMembers = []

  for (let index = 0; index < rowCount; index += 1) {
    const actorName = actorNames[index]
    const roleName = roleNames[index]
    const episodes = episodeNumbers[index]

    if (!actorName && !roleName && !episodes) {
      continue
    }

    castMembers.push({
      actorName,
      roleName,
      episodeNumbers: episodes,
    })
  }

  return castMembers
}

function buildCurriculumWeeklyLessons(titleRaw: unknown, contentRaw: unknown) {
  const lessonSubjects = splitLegacyRows(titleRaw)
  const lessonContents = splitLegacyRows(contentRaw)
  const rowCount = Math.max(lessonSubjects.length, lessonContents.length)
  const weeklyLessons = []

  for (let index = 0; index < rowCount; index += 1) {
    const lessonSubject = lessonSubjects[index]
    const lessonContent = lessonContents[index]

    if (!lessonSubject && !lessonContent) {
      continue
    }

    weeklyLessons.push({
      lessonContent,
      lessonSubject,
    })
  }

  return weeklyLessons
}

function teacherIdFromSlug(value: unknown, context: SeedContext) {
  const slug = text(value)

  return slug ? context.teacherIdsBySlug.get(slug) : undefined
}

function teacherCentersFromSlug(value: unknown, sourceDb: unknown, context: SeedContext) {
  const slug = text(value)

  const centers = slug ? context.teacherCentersBySlug.get(slug) : undefined

  if (!centers || centers.length === 0) {
    const fallbackCenter = centerFromSourceDb(sourceDb)

    if (fallbackCenter) {
      return [fallbackCenter]
    }

    throw new Error(`강사 센터를 찾을 수 없습니다: ${slug || text(sourceDb)}`)
  }

  return centers
}

function centerFromSourceDb(value: unknown) {
  switch (text(value)) {
    case 'baewoo':
      return 'art'
    case 'kidscenter':
      return 'kids'
    case 'bnbhighteen':
      return 'highteen'
    default:
      return undefined
  }
}

function splitLegacyRows(value: unknown) {
  const current = text(value)

  if (!current) {
    return []
  }

  if (current.includes('|')) {
    const parts = current.split('|').map((item) => item.trim())

    while (parts[0] === '') {
      parts.shift()
    }

    while (parts[parts.length - 1] === '') {
      parts.pop()
    }

    return parts.map((item) => item || undefined)
  }

  return current
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function teacherFilePosterPath(row: WorkRow) {
  const value = text(row.file_path)

  if (!value) {
    return undefined
  }

  return `/legacy/teacher-files/${requiredText(row.source_db, 'teacher_files.source_db')}/${requiredText(row.source_table, 'teacher_files.source_table')}/${value.replace(/^\/+/, '')}`
}

function fileBasename(value: unknown) {
  const path = text(value)

  if (!path) {
    return undefined
  }

  return path.split('/').filter(Boolean).pop()
}

function normalizedTitle(value: string | undefined) {
  const current = text(value)

  return current === '제목 없음' ? '' : current
}

function normalizeRichText(value: string | undefined) {
  return text(value)?.replace(/\s+/g, ' ').trim() ?? ''
}

function normalizeLooseTitle(value: string | undefined) {
  return (normalizedTitle(value) ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim()
}

function representativeWorkDedupKey(item: RepresentativeWork) {
  const posterKey = fileBasename(item.posterPath)
  const descKey = normalizeRichText(item.description)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const titleKey = normalizeLooseTitle(item.title)

  if (posterKey && descKey) {
    return `poster:${posterKey}::desc:${descKey}`
  }

  if (posterKey) {
    return `poster:${posterKey}::title:${titleKey}`
  }

  return `title:${titleKey}::desc:${descKey}`
}

function compareRepresentativeWork(
  left: {
    description: string | undefined
    posterPath: string | undefined
    rawSourceDb: string | undefined
    title: string
  },
  right: {
    description: string | undefined
    posterPath: string | undefined
    rawSourceDb: string | undefined
    title: string
  },
  teacherSourceDb: string,
) {
  const leftScore = representativeWorkScore(left, teacherSourceDb)
  const rightScore = representativeWorkScore(right, teacherSourceDb)

  return leftScore - rightScore
}

function representativeWorkScore(
  item: {
    description: string | undefined
    posterPath: string | undefined
    rawSourceDb: string | undefined
    title: string
  },
  teacherSourceDb: string,
) {
  let score = 0

  if (item.rawSourceDb === teacherSourceDb) {
    score += 100
  }

  if (item.posterPath) {
    score += 10
  }

  if (normalizedTitle(item.title)) {
    score += 5
  }

  if (item.description) {
    score += 3
  }

  return score
}

function parseJsonValue(value: unknown): unknown {
  if (value == null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return undefined
  }

  return value as Record<string, unknown>
}

function text(value: unknown) {
  const trimmed = String(value ?? '').trim()

  return trimmed || undefined
}

function requiredText(value: unknown, fieldName: string) {
  const trimmed = text(value)

  if (!trimmed) {
    throw new Error(`${fieldName} 값이 비어 있습니다.`)
  }

  return trimmed
}

function dateText(value: unknown) {
  return text(value)
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)

  return Number.isFinite(parsed) ? parsed : fallback
}

function displayStatusFromPublic(value: unknown) {
  return value === false || value === 0 || value === '0' || value === 'false'
    ? 'archived'
    : 'published'
}

function status(value: unknown) {
  const current = text(value)

  return current === 'draft' || current === 'archived' ? current : 'published'
}

function readRequiredValue(args: string[], index: number, name: string) {
  const value = String(args[index + 1] ?? '').trim()

  if (!value) {
    throw new Error(`${name} 값이 비어 있습니다.`)
  }

  return value
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

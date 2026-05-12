import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'

import { authorNameFromCenters } from '../../src/collections/shared'
import { getPayloadClient } from '../../src/lib/payload'
import {
  parseCastingDirectorCareerItems,
  parseProfileCareerItems,
  parseTeacherCareerItems,
} from '../../src/lib/profileBodyHtml'

const execFileAsync = promisify(execFile)

type Options = {
  collections: string[]
  dryRun: boolean
  limit: 'all' | number
}

type WorkRow = Record<string, unknown>
type PayloadDoc = Record<string, unknown>
type PayloadWhere = Record<string, unknown>
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
    where: PayloadWhere
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
  lookupWhere?: (doc: PayloadDoc) => PayloadWhere
  table: string
  transform: (row: WorkRow, context: SeedContext) => PayloadDoc
  uniqueField?: string
}

type SeedContext = {
  examSchoolLogoIdsBySlug: Map<string, number | string>
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
    uniqueField: 'subject',
    columns: [
      'name',
      'subject',
      'summary',
      'actors',
      'display_order',
    ],
    transform: (row) => ({
      actors: parseAgencyActors(row.actors),
      centers: ['art'],
      displayOrder: number(row.display_order),
      name: text(row.name),
      subject: requiredText(row.subject, 'agencies.subject'),
      summary: text(row.summary),
    }),
  },
  {
    collection: 'artist-press',
    table: 'artist_press',
    columns: [
      'slug',
      'center',
      'title',
      'body_html',
      'actor_name',
      'generation',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row) => ({
      actorName: requiredText(row.actor_name, 'artist_press.actor_name'),
      body: lexicalPlainTextFromHtml(row.body_html),
      centers: centersFrom(row.center),
      generation: requiredText(row.generation, 'artist_press.generation'),
      displayStatus: displayStatusFromPublic(row.is_public),
      ...legacyPublishedTimestamps(row),
      slug: requiredText(row.slug, 'artist_press.slug'),
      title: requiredText(row.title, 'artist_press.title'),
    }),
  },
  {
    collection: 'audition-schedules',
    table: 'audition_schedules',
    lookupWhere: auditionScheduleLookupWhere,
    uniqueField: 'title',
    columns: [
      'centers',
      'event_type',
      'title',
      'body_html',
      'schedule_start_date',
      'schedule_end_date',
      'author_name',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row) => ({
      authorName: text(row.author_name),
      bodyHtml: text(row.body_html),
      centers: centersFrom(row.centers),
      eventType: text(row.event_type),
      displayStatus: displayStatusFromPublic(row.is_public),
      ...legacyPublishedTimestamps(row),
      scheduleEndDate: dateText(row.schedule_end_date),
      scheduleStartDate: dateText(row.schedule_start_date),
      title: requiredText(row.title, 'audition_schedules.title'),
    }),
  },
  {
    collection: 'casting-directors',
    table: 'castings',
    uniqueField: 'personName',
    columns: [
      'person_name',
      'company',
      'centers',
      'body_html',
      'category',
      'author_name',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row) => ({
      authorName: text(row.author_name),
      category: text(row.category),
      centers: centersFrom(row.centers),
      company: requiredText(row.company, 'castings.company'),
      careerItems: parseCastingDirectorCareerItems(row.body_html),
      displayStatus: displayStatusFromPublic(row.is_public),
      personName: requiredText(row.person_name, 'castings.person_name'),
      ...legacyPublishedTimestamps(row),
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
      'created_at',
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
        ...legacyPublishedTimestamps(row),
        thumbnailPath: text(row.thumbnail_path),
        title: requiredText(row.title, 'casting_appearances.title'),
        writers: text(row.writers),
      }
    },
  },
  {
    collection: 'exam-passed-reviews',
    table: 'exam_passed_reviews',
    uniqueField: 'title',
    lookupWhere: (doc) => ({
      and: [
        { title: { equals: requiredText(doc.title, 'exam-passed-reviews.title') } },
        { studentName: { equals: requiredText(doc.studentName, 'exam-passed-reviews.studentName') } },
        { school: { equals: doc.school ?? null } },
      ],
    }),
    columns: [
      'source_db',
      'source_table',
      'source_id',
      'school_logo_slug',
      'title',
      'body_html',
      'student_image_path',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row, context) => {
      const title = requiredText(row.title, 'exam_passed_reviews.title')
      const legacyContent = parseExamPassedReviewLegacyContent(row.body_html)

      return {
        centers: ['exam'],
        cohort: legacyContent.cohort,
        displayStatus: displayStatusFromPublic(row.is_public),
        interviews: legacyContent.interviews,
        ...legacyPublishedTimestamps(row),
        resultSummary: legacyContent.resultSummary || title,
        school: examSchoolLogoIdFromSlug(row.school_logo_slug, context),
        studentImagePath: examPassedReviewLocalStudentImagePath(row),
        studentName: requiredText(legacyContent.studentName, 'exam_passed_reviews.student_name'),
        title,
      }
    },
  },
  {
    collection: 'exam-passed-videos',
    table: 'exam_passed_videos',
    uniqueField: 'youtubeCode',
    columns: [
      'title',
      'youtube_code',
      'youtube_url',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row) => ({
      centers: ['exam'],
      displayStatus: displayStatusFromPublic(row.is_public),
      ...legacyPublishedTimestamps(row),
      title: requiredText(row.title, 'exam_passed_videos.title'),
      youtubeCode: requiredText(row.youtube_code, 'exam_passed_videos.youtube_code'),
      youtubeUrl: requiredText(row.youtube_url, 'exam_passed_videos.youtube_url'),
    }),
  },
  {
    collection: 'exam-school-logos',
    table: 'exam_school_logos',
    columns: [
      'school_name',
      'school_slug',
    ],
    transform: (row) => ({
      centers: ['exam'],
      authorName: authorNameFromCenters(['exam']),
      schoolName: requiredText(row.school_name, 'exam_school_logos.school_name'),
      schoolSlug: requiredText(row.school_slug, 'exam_school_logos.school_slug'),
    }),
    uniqueField: 'schoolSlug',
  },
  {
    collection: 'exam-results',
    table: 'exam_results',
    uniqueField: 'slug',
    columns: [
      'id',
      'source_db',
      'source_table',
      'source_id',
      'center',
      'result_type',
      'title',
      'thumbnail_path',
      'published_at',
      'created_at',
      'is_public',
    ],
    transform: (row) => ({
      centers: centersFrom(row.center),
      displayStatus: displayStatusFromPublic(row.is_public),
      ...legacyPublishedTimestamps(row),
      resultType: requiredText(row.result_type, 'exam_results.result_type'),
      slug: requiredText(row.generated_slug, 'exam_results.generated_slug'),
      thumbnailPath: text(row.local_thumbnail_path),
      title: requiredText(row.title, 'exam_results.title'),
    }),
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
      'created_at',
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
      ...legacyPublishedTimestamps(row),
      title: requiredText(row.title, 'news.title'),
      viewCount: number(row.view_count),
    }),
  },
  {
    collection: 'profiles',
    table: 'profiles',
    lookupWhere: sourceLookupWhere,
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
      'photo_image1',
      'photo_image2',
      'photo_image3',
      'photo_image4',
      'photo_image5',
      'photo_image6',
      'body_html',
      'author_name',
      'published_at',
      'created_at',
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
        legacyMeta: legacyMetaWithPreviousSlug(row.legacy_meta, row.previous_slug),
        name: requiredText(row.name, 'profiles.name'),
        photoImage1: text(row.photo_image1),
        photoImage2: text(row.photo_image2),
        photoImage3: text(row.photo_image3),
        photoImage4: text(row.photo_image4),
        photoImage5: text(row.photo_image5),
        photoImage6: text(row.photo_image6),
        profileImagePath: text(row.profile_image_path),
        ...legacyPublishedTimestamps(row),
        weight: text(row.weight),
      }
    },
  },
  {
    collection: 'screen-appearances',
    table: 'screen_appearances',
    uniqueField: 'title',
    lookupWhere: screenAppearanceLookupWhere,
    columns: [
      'source_db',
      'source_id',
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
      'created_at',
      'is_public',
    ],
    transform: (row) => {
      const structuredBody = screenAppearanceStructuredBodyFromHtml(row.body_html)

      return {
        airDateLabel: legacyScreenAppearanceAirDate(row.air_date_label) ?? dateText(row.published_at),
        appearanceType: text(row.appearance_type),
        actorInputMode: 'manual',
        careerItems: structuredBody.careerItems,
        centers: centersFrom(row.center),
        className: text(row.class_name),
        displayStatus: displayStatusFromPublic(row.is_public),
        introText: structuredBody.introText,
        performerName: text(row.performer_name),
        profileImagePath: screenAppearanceLocalImagePath(row, 'profile_image_path', 'profile'),
        projectTitle: text(row.project_title),
        roleName: text(row.role_name),
        thumbnailPath: screenAppearanceLocalImagePath(row, 'thumbnail_path', 'thumbnail'),
        ...legacyPublishedTimestamps(row),
        title: requiredText(row.title, 'screen_appearances.title'),
      }
    },
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
      'display_order',
      'status',
      'legacy_meta',
    ],
    transform: (row, context) => ({
      ...sourceDoc(row),
      bioHtml: requiredText(row.body_html, 'teachers.body_html'),
      careerItems: parseTeacherCareerItems(row.body_html),
      centers: centersFrom(row.centers),
      displayOrder: number(row.display_order),
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
    uniqueField: 'title',
    lookupWhere: (doc) => ({
      and: [
        { title: { equals: requiredText(doc.title, 'curriculums.title') } },
        { className: { equals: requiredText(doc.className, 'curriculums.className') } },
        { teacher: { equals: doc.teacher ?? null } },
      ],
    }),
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
    ],
    transform: (row, context) => ({
      centers: teacherCentersFromSlug(row.resolved_teacher_slug, row.source_db, context),
      className: curriculumClassName(row.category),
      curriculumLessons: buildCurriculumLessons(row.title_raw, row.content_raw),
      teacher: teacherIdFromSlug(row.resolved_teacher_slug, context),
      title: text(row.subject) ?? text(row.category) ?? '커리큘럼',
    }),
  },
]

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const selected = selectConfigs(options.collections)
  const payload = options.dryRun ? null : await getPayloadClient()
  try {
    const context = await buildSeedContext()
    const summary: Record<string, { created: number; dryRun: number; updated: number }> = {}

    for (const config of selected) {
      if (config.collection === 'curriculums' && payload) {
        context.teacherIdsBySlug = await readPayloadTeacherIdsBySlug(payload)
      }

      if (config.collection === 'exam-passed-reviews' && payload) {
        context.examSchoolLogoIdsBySlug = await readPayloadExamSchoolLogoIdsBySlug(payload)
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
  } finally {
    await payload?.destroy()
  }
}

function normalizeRowsForSeed(config: TableConfig, rows: WorkRow[]) {
  if (config.collection === 'exam-results') {
    return normalizeExamResultRowsForSeed(rows)
  }

  if (config.collection === 'profiles') {
    return normalizeProfileRowsForSlug(rows)
  }

  if (config.collection !== 'curriculums') {
    return rows
  }

  return dedupeCurriculumRows(rows)
}

function normalizeProfileRowsForSlug(rows: WorkRow[]) {
  const entries = rows.map((row) => ({
    baseSlug: profileSlugFromEnglishName(row.english_name) ?? requiredText(row.slug, 'profiles.slug'),
    row,
  }))
  const sorted = [...entries].sort((left, right) => {
    return (
      compareText(left.baseSlug, right.baseSlug) ||
      compareText(text(left.row.source_db), text(right.row.source_db)) ||
      compareText(text(left.row.source_table), text(right.row.source_table)) ||
      number(left.row.source_id, Number.MAX_SAFE_INTEGER) -
        number(right.row.source_id, Number.MAX_SAFE_INTEGER) ||
      compareText(requiredText(left.row.slug, 'profiles.slug'), requiredText(right.row.slug, 'profiles.slug'))
    )
  })
  const usedSlugs = new Set<string>()
  const slugByRow = new Map<WorkRow, string>()

  for (const entry of sorted) {
    let slug = entry.baseSlug
    let suffix = 2

    while (usedSlugs.has(slug)) {
      slug = `${entry.baseSlug}-${suffix}`
      suffix += 1
    }

    usedSlugs.add(slug)
    slugByRow.set(entry.row, slug)
  }

  return rows.map((row) => {
    const originalSlug = requiredText(row.slug, 'profiles.slug')
    const refinedSlug = slugByRow.get(row) ?? originalSlug

    if (refinedSlug === originalSlug) {
      return row
    }

    return {
      ...row,
      previous_slug: originalSlug,
      slug: refinedSlug,
    }
  })
}

function normalizeExamResultRowsForSeed(rows: WorkRow[]) {
  const sorted = [...rows].sort(
    (left, right) =>
      compareText(dateText(left.published_at), dateText(right.published_at)) ||
      number(left.id, Number.MAX_SAFE_INTEGER) - number(right.id, Number.MAX_SAFE_INTEGER),
  )
  const slugByRow = new Map<WorkRow, string>()

  sorted.forEach((row, index) => {
    slugByRow.set(row, `result-${index + 1}`)
  })

  return rows.map((row) => ({
    ...row,
    generated_slug: slugByRow.get(row),
    local_thumbnail_path: examResultLocalThumbnailPath(row),
  }))
}

function examResultLocalThumbnailPath(row: WorkRow) {
  const value = text(row.thumbnail_path)

  if (!value || value.startsWith('/legacy/exam-results/')) {
    return value
  }

  const fileName = fileBasename(value)

  if (!fileName) {
    return value
  }

  return `/legacy/exam-results/${text(row.source_db) || 'bnbuniv'}/${examResultBoTable(row.source_table)}/${number(row.source_id)}/thumbnail/${fileName}`
}

function screenAppearanceLocalImagePath(row: WorkRow, fieldName: string, role: 'profile' | 'thumbnail') {
  const value = text(row[fieldName])

  if (!value) {
    return undefined
  }

  if (value.startsWith('/legacy/screen-appearances/')) {
    return value
  }

  if (
    value.startsWith('/api/') ||
    value.startsWith('/media/') ||
    value.startsWith('/uploads/') ||
    value.startsWith('/_next/')
  ) {
    return value
  }

  if (/^https?:\/\//.test(value) && !value.includes('/web/data/file/new_drama/')) {
    return value
  }

  const fileName = fileBasename(value)

  if (!fileName) {
    return value
  }

  return `/legacy/screen-appearances/${text(row.source_db) || 'baewoo'}/new_drama/${number(row.source_id)}/${role}/${fileName}`
}

function legacyScreenAppearanceAirDate(value: unknown) {
  const trimmed = text(value)

  if (!trimmed) {
    return undefined
  }

  const normalized = trimmed.replace(/^2202(?=[.-])/, '2022').replace(/\.\.+/g, '.')
  const fullYearMatch = normalized.match(/^(\d{4})\s*[.-]\s*(\d{1,2})\s*[.-]\s*(\d{1,2})/)
  const shortYearMatch = normalized.match(/^(\d{2})\s*[.]\s*(\d{1,2})\s*[.]\s*(\d{1,2})/)
  const match = fullYearMatch ?? shortYearMatch

  if (!match) {
    return undefined
  }

  const year = fullYearMatch ? Number(match[1]) : 2000 + Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined
  }

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined
  }

  return date.toISOString()
}

function examResultBoTable(value: unknown) {
  const sourceTable = text(value)

  if (sourceTable === 'g5_write_victory10') {
    return 'victory10'
  }

  if (sourceTable === 'g5_write_victory30') {
    return 'victory30'
  }

  return sourceTable?.replace(/^g5_write_/, '') || 'exam-results'
}

function examPassedReviewBoTable(value: unknown) {
  const sourceTable = text(value)

  if (sourceTable === 'g5_write_new_hoogi' || sourceTable === 'exam_passed_reviews') {
    return 'new_hoogi'
  }

  return sourceTable?.replace(/^g5_write_/, '') || 'new_hoogi'
}

function examPassedReviewLocalStudentImagePath(row: WorkRow) {
  const value = text(row.student_image_path)

  if (!value || value.startsWith('/legacy/exam-passed-reviews/')) {
    return value
  }

  const fileName = fileBasename(value.split('?')[0])

  if (!fileName) {
    return value
  }

  return `/legacy/exam-passed-reviews/${text(row.source_db) || 'bnbuniv'}/${examPassedReviewBoTable(row.source_table)}/${number(row.source_id)}/student/${fileName}`
}

function cleanLegacyText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function lexicalPlainTextFromHtml(value: unknown) {
  const html = text(value)

  if (!html) {
    return undefined
  }

  const { document } = new JSDOM(html).window
  document.querySelectorAll('script, style').forEach((element) => element.remove())
  const paragraphs = cleanLegacyText(document.body.textContent ?? html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return undefined
  }

  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph,
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function lexicalScreenAppearanceBodyFromHtml(value: unknown) {
  const html = text(value)

  if (!html) {
    return undefined
  }

  const { document } = new JSDOM(html).window
  document.querySelectorAll('script, style').forEach((element) => element.remove())
  const imageSources = Array.from(document.querySelectorAll('img'))
    .map((image) => normalizeLegacyScreenAppearanceBodyImageSrc(image.getAttribute('src')))
    .filter((src): src is string => Boolean(src))
  const paragraphs = cleanLegacyText(document.body.textContent ?? html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (paragraphs.length === 0 && imageSources.length === 0) {
    return undefined
  }

  let uploadIndex = 0
  const children = [
    ...paragraphs.map((paragraph) => ({
      children: [
        {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: paragraph,
          type: 'text',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1,
    })),
    ...imageSources.map((src) => {
      uploadIndex += 1

      return {
        children: [
          {
            format: '',
            id: `screen-appearance-body-image-${uploadIndex}`,
            pending: {
              formID: `screen-appearance-body-image-${uploadIndex}`,
              src,
            },
            type: 'upload',
            version: 3,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      }
    }),
  ]

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

const screenAppearanceCareerCategoryValues = new Set([
  '드라마',
  '영화',
  '독립영화',
  '상업영화',
  '단편영화',
  '웹드라마',
  'CF',
  '광고',
  '방송',
  '예능',
  '연극',
  '뮤지컬',
  '뮤직비디오',
  'MV',
  '기타',
])

function screenAppearanceStructuredBodyFromHtml(value: unknown) {
  const html = text(value)
  const body = lexicalScreenAppearanceBodyFromHtml(html)

  if (!html) {
    return {
      body,
      careerItems: undefined,
      introText: undefined,
    }
  }

  const { document } = new JSDOM(html).window
  document.querySelectorAll('script, style').forEach((element) => element.remove())
  const lines = cleanLegacyText(document.body.textContent ?? html)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    body,
    careerItems: screenAppearanceCareerItemsFromLines(lines),
    introText: screenAppearanceIntroTextFromLines(lines),
  }
}

function screenAppearanceIntroTextFromLines(lines: string[]) {
  return lines.find((line) => /캐스팅\s*되어?\s*출연/.test(line) || /캐스팅되어\s*출연/.test(line))
}

function screenAppearanceCareerItemsFromLines(lines: string[]) {
  const startIndex = lines.findIndex((line) => line === '경력' || line.startsWith('경력'))

  if (startIndex === -1) {
    return undefined
  }

  const careerItems: Array<{ content?: string; title: string }> = []
  let currentTitle: string | undefined
  let currentLines: string[] = []

  function flushCurrentItem() {
    if (!currentTitle || currentLines.length === 0) {
      return
    }

    careerItems.push({
      title: currentTitle,
      content: currentLines.join('\n'),
    })
  }

  for (const line of lines.slice(startIndex + 1)) {
    if (/캐스팅\s*되어?\s*출연/.test(line) || /캐스팅되어\s*출연/.test(line)) {
      break
    }

    if (/^방영(기간|일자)?\s*:/.test(line) || /^외\s*다수$/.test(line)) {
      continue
    }

    if (screenAppearanceCareerCategoryValues.has(line)) {
      flushCurrentItem()
      currentTitle = line
      currentLines = []
      continue
    }

    if (!currentTitle) {
      currentTitle = '기타'
      currentLines = []
    }

    currentLines.push(line)
  }

  flushCurrentItem()

  return careerItems.length > 0 ? careerItems : undefined
}

function normalizeLegacyScreenAppearanceBodyImageSrc(value: string | null) {
  const src = value?.trim()

  if (!src) {
    return undefined
  }

  if (/^https?:\/\//i.test(src)) {
    try {
      const url = new URL(src)

      if (url.protocol === 'http:') {
        url.protocol = 'https:'
      }

      return url.href
    } catch {
      return src
    }
  }

  if (src.startsWith('//')) {
    return `https:${src}`
  }

  if (src.startsWith('/')) {
    return `https://www.baewoo.co.kr${src}`
  }

  return `https://www.baewoo.co.kr/${src.replace(/^\.?\//, '')}`
}

function legacySummaryLabel(value: string) {
  return cleanLegacyText(value).replace(/\s/g, '')
}

function parseExamPassedReviewLegacyContent(value: unknown) {
  const html = text(value)
  const summary = {
    cohort: undefined as string | undefined,
    resultSummary: undefined as string | undefined,
    studentName: undefined as string | undefined,
  }

  if (!html) {
    return {
      ...summary,
      interviews: [] as { answer: string; question: string }[],
    }
  }

  const { document } = new JSDOM(html).window
  const root = document.querySelector('.scene_wrap') ?? document

  root.querySelectorAll('.scene > ul li, .scene ul li').forEach((item) => {
    const labelElement = item.querySelector('.scene_title, span')
    const label = legacySummaryLabel(labelElement?.textContent ?? '')

    if (!labelElement || !label) {
      return
    }

    const clone = item.cloneNode(true) as Element
    clone.querySelector('.scene_title, span')?.remove()
    const itemValue = cleanLegacyText(clone.textContent ?? '')

    if (!itemValue) {
      return
    }

    if (label === '이름') {
      summary.studentName = itemValue
      return
    }

    if (label === '기수') {
      summary.cohort = itemValue
      return
    }

    if (label === '합격현황') {
      summary.resultSummary = itemValue
    }
  })

  const interviews = Array.from(root.querySelectorAll('.scene_career'))
    .map((item) => {
      const question = cleanLegacyText(item.querySelector('span')?.textContent ?? '')
      const answer = cleanLegacyText(item.querySelector('p')?.textContent ?? '')

      return question && answer ? { question, answer } : undefined
    })
    .filter((item): item is { answer: string; question: string } => Boolean(item))

  return {
    ...summary,
    interviews,
  }
}

function profileSlugFromEnglishName(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const tokens = normalized.match(/[a-z0-9]+/g) ?? []

  if (tokens.length === 0) {
    return undefined
  }

  if (tokens.length === 1) {
    return tokens[0]
  }

  return `${tokens[0]}-${tokens.slice(1).join('')}`
}

function legacyMetaWithPreviousSlug(value: unknown, previousSlugValue: unknown) {
  const legacyMeta = parseJsonValue(value)
  const previousSlug = text(previousSlugValue)

  if (!previousSlug) {
    return legacyMeta
  }

  const legacyMetaObject = objectValue(legacyMeta)

  if (legacyMetaObject) {
    return {
      ...legacyMetaObject,
      previousSlug,
    }
  }

  if (legacyMeta === undefined) {
    return { previousSlug }
  }

  return {
    legacyMeta,
    previousSlug,
  }
}

function compareText(left: unknown, right: unknown) {
  return String(left ?? '').localeCompare(String(right ?? ''))
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
      JSON.stringify(buildCurriculumLessons(row.title_raw, row.content_raw)),
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
    examSchoolLogoIdsBySlug: new Map(),
    teacherCentersBySlug,
    teacherFilesByTeacherSlug,
    teacherIdsBySlug: new Map(),
  }
}

async function readPayloadExamSchoolLogoIdsBySlug(payload: Payload) {
  const result = await (payload as unknown as {
    find: (args: {
      collection: string
      depth: number
      limit: number
      overrideAccess: boolean
      pagination: boolean
    }) => Promise<{ docs: { id: number | string; schoolSlug?: unknown }[] }>
  }).find({
    collection: 'exam-school-logos',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
  })

  return new Map(
    result.docs
      .map((doc) => [text(doc.schoolSlug), doc.id] as const)
      .filter((entry): entry is readonly [string, number | string] => Boolean(entry[0])),
  )
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

  const where = config.lookupWhere?.(doc) ?? {
    [uniqueField]: {
      equals: uniqueValue,
    },
  }

  const existing = await dynamicPayload.find({
    collection: config.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where,
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

function sourceLookupWhere(doc: PayloadDoc): PayloadWhere {
  return {
    and: [
      { sourceDb: { equals: requiredText(doc.sourceDb, 'sourceDb') } },
      { sourceTable: { equals: requiredText(doc.sourceTable, 'sourceTable') } },
      { sourceId: { equals: number(doc.sourceId) } },
    ],
  }
}

function screenAppearanceLookupWhere(doc: PayloadDoc): PayloadWhere {
  return {
    and: [
      { title: { equals: requiredText(doc.title, 'screen_appearances.title') } },
      { performerName: { equals: text(doc.performerName) || null } },
      { projectTitle: { equals: text(doc.projectTitle) || null } },
      { roleName: { equals: text(doc.roleName) || null } },
    ],
  }
}

function auditionScheduleLookupWhere(doc: PayloadDoc): PayloadWhere {
  return {
    and: [
      { title: { equals: requiredText(doc.title, 'audition_schedules.title') } },
      {
        scheduleStartDate: {
          equals: requiredText(doc.scheduleStartDate, 'audition_schedules.scheduleStartDate'),
        },
      },
      {
        scheduleEndDate: {
          equals: requiredText(doc.scheduleEndDate, 'audition_schedules.scheduleEndDate'),
        },
      },
    ],
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

function parseAgencyActors(value: unknown) {
  return parseJsonArray(value)
    .map((item) => {
      const actor = objectValue(item)
      const name = text(actor?.name)

      if (!name) {
        return undefined
      }

      return {
        name,
        generation: text(actor?.generation),
      }
    })
    .filter(Boolean)
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

function buildCurriculumLessons(titleRaw: unknown, contentRaw: unknown) {
  const topics = splitLegacyRows(titleRaw)
  const contents = splitLegacyRows(contentRaw)
  const rowCount = Math.max(topics.length, contents.length)
  const lessons = []

  for (let index = 0; index < rowCount; index += 1) {
    const topic = topics[index]
    const content = contents[index]

    if (!topic && !content) {
      continue
    }

    lessons.push({
      content,
      topic,
    })
  }

  return lessons
}

function curriculumClassName(value: unknown) {
  const className = text(value)

  switch (className) {
    case '1':
      return '초급 I Class'
    case '2':
      return '중급 R Class'
    case '3':
      return '고급 U Class'
    case '4':
      return '전문 D Class'
    case '5':
      return '배우 A Class'
    case '6':
      return '애비뉴 S Class'
    case '7':
      return '특강반'
    default:
      return className
  }
}

function teacherIdFromSlug(value: unknown, context: SeedContext) {
  const slug = text(value)

  return slug ? context.teacherIdsBySlug.get(slug) : undefined
}

function examSchoolLogoIdFromSlug(value: unknown, context: SeedContext) {
  const slug = requiredText(value, 'exam_passed_reviews.school_logo_slug')

  if (context.examSchoolLogoIdsBySlug.size === 0) {
    return undefined
  }

  const id = context.examSchoolLogoIdsBySlug.get(slug)

  if (!id) {
    throw new Error(`학교 로고를 찾을 수 없습니다: ${slug}`)
  }

  return id
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

function legacyPublishedTimestamps(row: WorkRow) {
  const publishedAt = dateText(row.published_at)

  return {
    createdAt: dateText(row.created_at) ?? publishedAt,
    publishedAt,
  }
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

void main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

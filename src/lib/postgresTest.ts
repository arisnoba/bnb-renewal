import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'

export type PostgresTestCollection = {
  description: string
  href: string
  label: string
  slug: string
  table: string
}

export type PostgresTestRow = {
  id: number | string
  imagePath: string
  meta1: string
  meta2: string
  meta3: string
  relatedFiles: PostgresRelatedFile[]
  slug: string
  sourceDb: string
  sourceId: string
  sourceTable: string
  title: string
}

export type PostgresRelatedFile = {
  displayOrder: string
  imagePath: string
  sourceDb: string
  sourceId: string
  sourceTable: string
  title: string
}

export type PostgresRowsOptions = {
  center?: 'all' | 'art' | 'exam' | 'highteen' | 'kids'
}

type TestDoc = Record<string, unknown>

export const postgresTestCollections: PostgresTestCollection[] = [
  {
    description: 'Payload teachers 컬렉션 검수',
    href: '/test/postgres/teachers',
    label: 'Teachers',
    slug: 'teachers',
    table: 'teachers',
  },
  {
    description: 'Payload curriculums 컬렉션 검수',
    href: '/test/postgres/curriculums',
    label: 'Curriculums',
    slug: 'curriculums',
    table: 'curriculums',
  },
  {
    description: 'Payload agencies 컬렉션 검수',
    href: '/test/postgres/agencies',
    label: 'Agencies',
    slug: 'agencies',
    table: 'agencies',
  },
  {
    description: 'Payload artist-press 컬렉션 검수',
    href: '/test/postgres/artist-press',
    label: 'Artist Press',
    slug: 'artist-press',
    table: 'artist_press',
  },
  {
    description: 'Payload profiles 컬렉션 검수',
    href: '/test/postgres/profiles',
    label: 'Profiles',
    slug: 'profiles',
    table: 'profiles',
  },
  {
    description: 'Payload audition-schedules 컬렉션 검수',
    href: '/test/postgres/audition-schedules',
    label: 'Audition Schedules',
    slug: 'audition-schedules',
    table: 'audition_schedules',
  },
  {
    description: 'Payload screen-appearances 컬렉션 검수',
    href: '/test/postgres/screen-appearances',
    label: 'Screen Appearances',
    slug: 'screen-appearances',
    table: 'screen_appearances',
  },
  {
    description: 'Payload casting-appearances 컬렉션 검수',
    href: '/test/postgres/casting-appearances',
    label: 'Casting Appearances',
    slug: 'casting-appearances',
    table: 'casting_appearances',
  },
  {
    description: 'Payload casting-directors 컬렉션 검수',
    href: '/test/postgres/casting-directors',
    label: 'Casting Directors',
    slug: 'casting-directors',
    table: 'casting_directors',
  },
  {
    description: 'Payload exam-passed-reviews 컬렉션 검수',
    href: '/test/postgres/exam-passed-reviews',
    label: 'Exam Passed Reviews',
    slug: 'exam-passed-reviews',
    table: 'exam_passed_reviews',
  },
  {
    description: 'Payload exam-passed-videos 컬렉션 검수',
    href: '/test/postgres/exam-passed-videos',
    label: 'Exam Passed Videos',
    slug: 'exam-passed-videos',
    table: 'exam_passed_videos',
  },
  {
    description: 'Payload exam-results 컬렉션 검수',
    href: '/test/postgres/exam-results',
    label: 'Exam Results',
    slug: 'exam-results',
    table: 'exam_results',
  },
  {
    description: 'Payload exam-school-logos 컬렉션 검수',
    href: '/test/postgres/exam-school-logos',
    label: 'Exam School Logos',
    slug: 'exam-school-logos',
    table: 'exam_school_logos',
  },
  {
    description: 'Payload news 컬렉션 검수',
    href: '/test/postgres/news',
    label: 'News',
    slug: 'news',
    table: 'news',
  },
]

const sortMap: Record<string, string> = {
  agencies: 'displayOrder',
  'artist-press': '-publishedAt',
  'audition-schedules': '-scheduleStartDate',
  'casting-appearances': '-publishedAt',
  'casting-directors': 'personName',
  curriculums: 'title',
  'exam-passed-reviews': '-publishedAt',
  'exam-passed-videos': '-publishedAt',
  'exam-results': '-publishedAt',
  'exam-school-logos': 'schoolName',
  news: '-publishedAt',
  profiles: '-publishedAt',
  'screen-appearances': '-publishedAt',
  teachers: 'displayOrder',
}

export function getPostgresTestCollection(slug: string) {
  return postgresTestCollections.find((collection) => collection.slug === slug)
}

export async function getPostgresCounts() {
  const payload = await getPayloadClient()

  const entries = await Promise.all(
    postgresTestCollections.map(async (collection) => {
      const result = await payload.find({
        collection: collection.slug as never,
        depth: 0,
        limit: 1,
        where: buildPublishedWhere(collection.slug),
      })

      return [collection.slug, result.totalDocs] as const
    }),
  )

  return Object.fromEntries(entries)
}

export async function getPostgresRows(
  collection: PostgresTestCollection,
  options?: PostgresRowsOptions,
) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: collection.slug as never,
    depth: 1,
    limit: 100,
    sort: sortMap[collection.slug],
    where: buildPublishedWhere(collection.slug),
  })

  const docs = (result.docs as TestDoc[]).filter((doc) => matchesCenter(doc, options?.center))
  return docs.map((doc) => mapDocToRow(collection.slug, doc))
}

function buildPublishedWhere(collectionSlug: string): Where | undefined {
  if (collectionSlug === 'teachers') {
    return {
      status: {
        equals: 'published',
      },
    }
  }

  if (
    [
      'artist-press',
      'audition-schedules',
      'casting-directors',
      'casting-appearances',
      'exam-passed-reviews',
      'exam-passed-videos',
      'exam-results',
      'news',
      'profiles',
      'screen-appearances',
    ].includes(collectionSlug)
  ) {
    return {
      displayStatus: {
        equals: 'published',
      },
    }
  }

  return undefined
}

function matchesCenter(doc: TestDoc, center: PostgresRowsOptions['center']) {
  if (!center || center === 'all') {
    return true
  }

  const values = Array.isArray(doc.centers)
    ? doc.centers
    : doc.center
      ? [doc.center]
      : []

  return values.includes(center)
}

function mapDocToRow(
  collectionSlug: string,
  doc: TestDoc,
): PostgresTestRow {
  switch (collectionSlug) {
    case 'teachers':
      return {
        id: rowId(doc.id),
        imagePath: teacherImagePath(doc),
        meta1: stringify(doc.centers),
        meta2: stringify(doc.status),
        meta3: stringify(doc.displayOrder),
        relatedFiles: (Array.isArray(doc.representativeWorks) ? doc.representativeWorks : [])
          .slice(0, 12)
          .map((item) => {
            const work = objectDoc(item)

            return {
              displayOrder: stringify(work.displayOrder),
              imagePath: teacherRepresentativeWorkPath(work),
              sourceDb: stringify(doc.sourceDb),
              sourceId: stringify(doc.sourceId),
              sourceTable: stringify(doc.sourceTable),
              title: stringify(work.title),
            }
          }),
        slug: stringify(doc.slug),
        sourceDb: stringify(doc.sourceDb),
        sourceId: stringify(doc.sourceId),
        sourceTable: stringify(doc.sourceTable),
        title: stringify(doc.name),
      }
    case 'curriculums':
      return {
        ...baseRow(doc, {
        imagePath: '',
        meta1: stringify(doc.className),
        meta2: stringify(doc.educationStartDate),
        meta3: stringify(doc.capacity),
        title: stringify(doc.title),
        }),
        slug: '',
        sourceDb: '',
        sourceId: '',
        sourceTable: '',
      }
    case 'agencies':
      return baseRow(doc, {
        imagePath: agencyImagePath(doc),
        meta1: stringify(doc.name),
        meta2: stringify(doc.displayOrder),
        meta3: stringify(doc.centers),
        title: stringify(doc.subject) || stringify(doc.name),
      })
    case 'artist-press':
      return baseRow(doc, {
        imagePath: artistPressImagePath(doc),
        meta1: stringify(doc.actorName),
        meta2: stringify(doc.generation),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'profiles':
      return baseRow(doc, {
        imagePath: profileImagePath(doc),
        meta1: stringify(doc.centers),
        meta2: stringify(doc.filter),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.name),
      })
    case 'audition-schedules':
      return baseRow(doc, {
        imagePath: '',
        meta1: stringify(doc.centers),
        meta2: stringify(doc.eventType),
        meta3: `${stringify(doc.scheduleStartDate)} ~ ${stringify(doc.scheduleEndDate)}`.trim(),
        title: stringify(doc.title),
      })
    case 'screen-appearances':
      return baseRow(doc, {
        imagePath: screenAppearanceImagePath(doc),
        meta1: stringify(doc.performerName),
        meta2: `${stringify(doc.projectTitle)} / ${stringify(doc.roleName)}`.trim(),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'casting-appearances':
      return baseRow(doc, {
        imagePath: castingAppearanceImagePath(doc),
        meta1: stringify(doc.centers),
        meta2: stringify(doc.castingStatus),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'casting-directors':
      return baseRow(doc, {
        imagePath: '',
        meta1: stringify(doc.company),
        meta2: stringify(doc.centers),
        meta3: stringify(doc.category),
        title: stringify(doc.personName),
      })
    case 'exam-passed-reviews':
      return baseRow(doc, {
        imagePath: examPassedReviewImagePath(doc),
        meta1: relationshipSchoolName(doc.school) || stringify(doc.schoolName),
        meta2: stringify(doc.centers),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'exam-passed-videos':
      return baseRow(doc, {
        imagePath: '',
        meta1: stringify(doc.youtubeUrl),
        meta2: stringify(doc.centers),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'exam-results':
      return baseRow(doc, {
        imagePath: examResultImagePath(doc),
        meta1: stringify(doc.resultType),
        meta2: stringify(doc.centers),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    case 'exam-school-logos':
      return {
        id: rowId(doc.id),
        imagePath: examSchoolLogoImagePath(doc),
        meta1: stringify(doc.schoolSlug),
        meta2: '',
        meta3: '',
        relatedFiles: [],
        slug: stringify(doc.schoolSlug),
        sourceDb: '',
        sourceId: '',
        sourceTable: '',
        title: stringify(doc.schoolName),
      }
    case 'news':
      return baseRow(doc, {
        imagePath: newsImagePath(doc),
        meta1: stringify(doc.centers),
        meta2: stringify(doc.category),
        meta3: stringify(doc.publishedAt),
        title: stringify(doc.title),
      })
    default:
      return baseRow(doc, {
        imagePath: '',
        meta1: '',
        meta2: '',
        meta3: '',
        title: stringify(doc.title) || stringify(doc.name),
      })
  }
}

function baseRow(
  doc: TestDoc,
  input: {
    imagePath: string
    meta1: string
    meta2: string
    meta3: string
    title: string
  },
): PostgresTestRow {
  return {
    id: rowId(doc.id),
    imagePath: input.imagePath,
    meta1: input.meta1,
    meta2: input.meta2,
    meta3: input.meta3,
    relatedFiles: [],
    slug: stringify(doc.slug),
    sourceDb: stringify(doc.sourceDb),
    sourceId: stringify(doc.sourceId),
    sourceTable: stringify(doc.sourceTable),
    title: input.title,
  }
}

function stringify(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return String(value ?? '').trim()
}

function objectDoc(value: unknown): TestDoc {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as TestDoc : {}
}

function rowId(value: unknown): number | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return stringify(value)
}

function normalizeImagePath(path: unknown) {
  const value = stringify(path)

  if (!value) {
    return ''
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
    return value
  }

  return `/${value.replace(/^\/+/, '')}`
}

function basename(path: unknown) {
  const value = stringify(path)

  if (!value) {
    return ''
  }

  return value.split('/').filter(Boolean).pop() ?? ''
}

function boTableFromSourceTable(value: unknown) {
  return stringify(value).replace(/^g5_write_/, '')
}

function encodePath(value: string) {
  return value
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function legacyAssetPath(input: {
  boTable: string
  collection: string
  path: unknown
  role: string
  sourceDb?: unknown
  sourceId?: unknown
}) {
  const fileName = basename(input.path)

  if (!fileName) {
    return ''
  }

  return `/legacy/${input.collection}/${stringify(input.sourceDb)}/${input.boTable}/${stringify(input.sourceId)}/${input.role}/${encodeURIComponent(fileName)}`
}

function teacherImagePath(doc: TestDoc) {
  return teacherLegacyImagePath(doc, doc.profileImagePath || doc.photoImage1)
}

function teacherLegacyImagePath(doc: TestDoc, path: unknown) {
  const value = stringify(path)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/teachers/')) {
    return normalizeImagePath(value)
  }

  const sourcePath = value
    .replace(/^https?:\/\/[^/]+\/web\/data\/teacher\//, '')
    .replace(/^\/?web\/data\/teacher\//, '')
    .replace(/^\/+/, '')

  return `/legacy/teachers/${stringify(doc.sourceDb)}/${stringify(doc.sourceTable)}/${encodePath(sourcePath)}`
}

function teacherRepresentativeWorkPath(doc: TestDoc) {
  const value = stringify(doc.posterPath)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/teacher-files/')) {
    return value
  }

  return `/legacy/teacher-files/${value.replace(/^\/+/, '')}`
}

function agencyImagePath(doc: TestDoc) {
  return mediaImagePath(doc.logoMedia)
}

function artistPressImagePath(doc: TestDoc) {
  return (
    mediaImagePath(doc.thumbnailMedia) ||
    mediaImagePath(doc.agencyLogoMedia) ||
    legacyAssetPath({
      boTable: 'new_shoot',
      collection: 'artist-press',
      path: doc.thumbnailPath,
      role: 'thumbnail',
      sourceDb: doc.sourceDb,
      sourceId: doc.sourceId,
    }) ||
    legacyAssetPath({
      boTable: 'new_shoot',
      collection: 'artist-press',
      path: doc.agencyLogoPath,
      role: 'agency-logo',
      sourceDb: doc.sourceDb,
      sourceId: doc.sourceId,
    })
  )
}

function profileImagePath(doc: TestDoc) {
  const value = stringify(doc.profileImagePath)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/profiles/')) {
    return normalizeImagePath(value)
  }

  return `/legacy/profiles/${stringify(doc.sourceDb)}/${boTableFromSourceTable(doc.sourceTable)}/${stringify(doc.sourceId)}/${encodeURIComponent(basename(value))}`
}

function screenAppearanceImagePath(doc: TestDoc) {
  return (
    legacyAssetPath({
      boTable: 'new_drama',
      collection: 'screen-appearances',
      path: doc.thumbnailPath,
      role: 'thumbnail',
      sourceDb: doc.sourceDb,
      sourceId: doc.sourceId,
    }) ||
    legacyAssetPath({
      boTable: 'new_drama',
      collection: 'screen-appearances',
      path: doc.profileImagePath,
      role: 'profile',
      sourceDb: doc.sourceDb,
      sourceId: doc.sourceId,
    })
  )
}

function castingAppearanceImagePath(doc: TestDoc) {
  return legacyAssetPath({
    boTable: 'casting_appearances',
    collection: 'casting-appearances',
    path: doc.thumbnailPath,
    role: 'thumbnail',
    sourceDb: doc.sourceDb,
    sourceId: doc.sourceId,
  })
}

function examPassedReviewImagePath(doc: TestDoc) {
  return (
    relationshipLogoPath(doc.school) ||
    examPassedReviewStudentImagePath(doc) ||
    ''
  )
}

function examSchoolLogoImagePath(doc: TestDoc) {
  return mediaImagePath(doc.logoMedia)
}

function examResultImagePath(doc: TestDoc) {
  const value = stringify(doc.thumbnailPath)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/exam-results/')) {
    return normalizeImagePath(value)
  }

  return normalizeImagePath(value)
}

function relationshipLogoPath(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  return examSchoolLogoImagePath(value as TestDoc)
}

function relationshipSchoolName(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  return stringify((value as Record<string, unknown>).schoolName)
}

function mediaImagePath(value: unknown) {
  const media = objectDoc(value)
  const sizes = objectDoc(media.sizes)
  const thumbnail = objectDoc(sizes.thumbnail)

  return normalizeMediaPath(thumbnail.url) || normalizeMediaPath(media.url)
}

function normalizeMediaPath(path: unknown) {
  const value = stringify(path)

  if (!value) {
    return ''
  }

  try {
    const url = new URL(value)

    if (url.pathname.startsWith('/api/media/file/')) {
      return url.pathname
    }
  } catch {
    return normalizeImagePath(value)
  }

  return normalizeImagePath(value)
}

function examPassedReviewStudentImagePath(doc: TestDoc) {
  const value = stringify(doc.studentImagePath)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/exam-passed-reviews/')) {
    return normalizeImagePath(value)
  }

  return legacyAssetPath({
    boTable: 'new_hoogi',
    collection: 'exam-passed-reviews',
    path: value,
    role: 'student',
    sourceDb: doc.sourceDb,
    sourceId: doc.sourceId,
  })
}

function newsImagePath(doc: TestDoc) {
  return (
    mediaImagePath(doc.thumbnailMedia) ||
    newsAttachmentLocalPath(doc) ||
    legacyAssetPath({
      boTable: boTableFromSourceTable(doc.sourceTable),
      collection: 'news',
      path: doc.thumbnailPath,
      role: 'file-0',
      sourceDb: doc.sourceDb,
      sourceId: doc.sourceId,
    })
  )
}

function newsAttachmentLocalPath(doc: TestDoc) {
  const legacyMeta = objectDoc(doc.legacyMeta)
  const attachments = Array.isArray(legacyMeta.attachments)
    ? legacyMeta.attachments
    : []
  const thumbnailName = basename(doc.thumbnailPath)
  const attachment = attachments
    .map(objectDoc)
    .find((item) => basename(item.path) === thumbnailName || basename(item.localPath) === thumbnailName)
    ?? objectDoc(attachments[0])
  const localPath = stringify(attachment.localPath)

  return localPath.startsWith('/legacy/') ? localPath : ''
}

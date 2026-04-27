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
  curriculums: 'category',
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
    limit: 10000,
    pagination: false,
    sort: sortMap[collection.slug],
    where: buildPublishedWhere(collection.slug),
  })

  const docs = (result.docs as TestDoc[]).filter((doc) => matchesCenter(doc, options?.center))
  return docs.slice(0, 100).map((doc) => mapDocToRow(collection.slug, doc))
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
      return baseRow(doc, {
        imagePath: '',
        meta1: stringify(doc.category),
        meta2: stringify(doc.teacherName),
        meta3: stringify(doc.subject),
        title: stringify(doc.titleRaw) || stringify(doc.subject) || stringify(doc.teacherName),
      })
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
        meta1: stringify(doc.youtubeCode),
        meta2: stringify(doc.youtubeUrl),
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
        imagePath: normalizeImagePath(doc.logoPath),
        meta1: stringify(doc.schoolSlug),
        meta2: stringify(doc.reviewCount),
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
        imagePath: normalizeImagePath(doc.thumbnailPath),
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
  const direct = normalizeImagePath(doc.profileImagePath || doc.photoImage1)

  if (direct && !direct.startsWith('//') && !direct.includes('/data/')) {
    return direct
  }

  return legacyAssetPath({
    boTable: stringify(doc.sourceTable),
    collection: 'teachers',
    path: doc.profileImagePath || doc.photoImage1,
    role: 'profile',
    sourceDb: doc.sourceDb,
    sourceId: doc.sourceId,
  })
}

function teacherRepresentativeWorkPath(doc: TestDoc) {
  const value = stringify(doc.posterPath)

  if (!value) {
    return ''
  }

  if (value.startsWith('/legacy/teacher-files/') || value.startsWith('/')) {
    return value
  }

  return `/legacy/teacher-files/${value.replace(/^\/+/, '')}`
}

function agencyImagePath(doc: TestDoc) {
  return legacyAssetPath({
    boTable: 'g5_agency',
    collection: 'agencies',
    path: doc.profileImagePath,
    role: 'profile',
    sourceDb: doc.sourceDb,
    sourceId: doc.sourceId,
  })
}

function artistPressImagePath(doc: TestDoc) {
  return (
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
  return normalizeImagePath(doc.profileImagePath)
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
    normalizeImagePath(doc.schoolLogoPath) ||
    normalizeImagePath(doc.studentImagePath) ||
    ''
  )
}

function examResultImagePath(doc: TestDoc) {
  return normalizeImagePath(doc.thumbnailPath)
}

function relationshipLogoPath(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  return normalizeImagePath((value as Record<string, unknown>).logoPath)
}

function relationshipSchoolName(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ''
  }

  return stringify((value as Record<string, unknown>).schoolName)
}

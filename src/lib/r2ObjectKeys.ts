import path from 'node:path'

export const R2_MEDIA_PREFIX_BY_ROLE = {
  'agencies.logo': 'media/agencies/logos',
  'artist-press.agency-logo': 'media/artist-press/agency-logos',
  'artist-press.body-image': 'media/artist-press/body-images',
  'artist-press.thumbnail': 'media/artist-press/thumbnails',
  'audition-schedules.image': 'media/audition-schedules/images',
  'broadcast-stations.logo': 'media/broadcast-stations/logos',
  'casting-appearances.image': 'media/casting-appearances/images',
  'casting-directors.profile-image': 'media/casting-directors/profile-images',
  'castings.image': 'media/castings/images',
  'classrooms.photo': 'media/classrooms/photos',
  'direct-castings.body-image': 'media/direct-castings/body-images',
  'direct-castings.thumbnail': 'media/direct-castings/thumbnails',
  'exam-passed-reviews.image': 'media/exam-passed-reviews/images',
  'exam-passed-videos.thumbnail': 'media/exam-passed-videos/thumbnails',
  'exam-results.image': 'media/exam-results/images',
  'exam-school-logos.logo': 'media/exam-school-logos/logos',
  'highteen-special-classes.image': 'media/highteen-special-classes/images',
  'main-banners.desktop-image': 'media/main-banners/desktop-images',
  'main-banners.desktop-video': 'media/main-banners/desktop-videos',
  'main-banners.mobile-image': 'media/main-banners/mobile-images',
  'main-banners.mobile-video': 'media/main-banners/mobile-videos',
  'news.body-image': 'media/news/body-images',
  'news.thumbnail': 'media/news/thumbnails',
  'profiles.profile-image': 'media/profiles/profile-images',
  'screen-appearances.body-image': 'media/screen-appearances/body-images',
  'social-links.image': 'media/social-links/images',
  'star-cards.image': 'media/star-cards/images',
  'teacher-files.image': 'media/teacher-files/images',
  'teachers.profile-image': 'media/teachers/profile-images',
  'teachers.representative-work-poster': 'media/teachers/representative-work-posters',
} as const

export type R2MediaRole = keyof typeof R2_MEDIA_PREFIX_BY_ROLE

const R2_MEDIA_FILENAME_BASE_BY_ROLE: Record<R2MediaRole, string> = {
  'agencies.logo': 'agency-logo',
  'artist-press.agency-logo': 'artist-press-agency-logo',
  'artist-press.body-image': 'artist-press-body-image',
  'artist-press.thumbnail': 'artist-press-thumbnail',
  'audition-schedules.image': 'audition-schedule-image',
  'broadcast-stations.logo': 'broadcast-station-logo',
  'casting-appearances.image': 'casting-appearance-image',
  'casting-directors.profile-image': 'casting-director',
  'castings.image': 'casting-image',
  'classrooms.photo': 'classroom-photo',
  'direct-castings.body-image': 'direct-casting-body-image',
  'direct-castings.thumbnail': 'direct-casting-thumbnail',
  'exam-passed-reviews.image': 'exam-passed-review-image',
  'exam-passed-videos.thumbnail': 'exam-passed-video-thumbnail',
  'exam-results.image': 'exam-result-image',
  'exam-school-logos.logo': 'exam-school-logo',
  'highteen-special-classes.image': 'highteen-special-class-image',
  'main-banners.desktop-image': 'main-banner-desktop-image',
  'main-banners.desktop-video': 'main-banner-desktop-video',
  'main-banners.mobile-image': 'main-banner-mobile-image',
  'main-banners.mobile-video': 'main-banner-mobile-video',
  'news.body-image': 'news-body-image',
  'news.thumbnail': 'news-thumbnail',
  'profiles.profile-image': 'profile-image',
  'screen-appearances.body-image': 'screen-appearance-body-image',
  'social-links.image': 'social-link-image',
  'star-cards.image': 'star-card-image',
  'teacher-files.image': 'teacher-file-image',
  'teachers.profile-image': 'teacher-profile-image',
  'teachers.representative-work-poster': 'teacher-representative-work-poster',
}

type BuildR2MediaObjectKeyInput = {
  filename?: string
  index?: number | string
  prefix: string
  sourceId?: number | string
  sourcePath?: string
}

export function isR2MediaRole(value: string): value is R2MediaRole {
  return Object.prototype.hasOwnProperty.call(R2_MEDIA_PREFIX_BY_ROLE, value)
}

export function listR2MediaRoles() {
  return Object.entries(R2_MEDIA_PREFIX_BY_ROLE).map(([role, prefix]) => ({
    prefix,
    role,
  }))
}

export function getR2MediaPrefix(role: R2MediaRole) {
  return R2_MEDIA_PREFIX_BY_ROLE[role]
}

export function buildCompactR2MediaFilename({
  filename,
  role,
  sizeName,
  sourceId,
}: {
  filename: string
  role: R2MediaRole
  sizeName?: string
  sourceId: number | string
}) {
  const extension = path.extname(filename).toLowerCase() || '.bin'
  const base = R2_MEDIA_FILENAME_BASE_BY_ROLE[role]
  const safeSourceId = sanitizeSegment(sourceId) ?? 'unknown'
  const safeSizeName = sanitizeSegment(sizeName)

  return [base, safeSourceId, safeSizeName].filter(Boolean).join('-') + extension
}

export function normalizeR2ObjectKey(value: string) {
  const normalized = value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/')

  if (!normalized) {
    throw new Error('R2 object key 가 비어 있습니다.')
  }

  return normalized
}

export function assertFolderedR2MediaObjectKey(objectKey: string) {
  const normalized = normalizeR2ObjectKey(objectKey)
  const segments = normalized.split('/')

  if (segments[0] !== 'media') {
    throw new Error(`R2 media object key 는 media/ 로 시작해야 합니다: ${objectKey}`)
  }

  if (segments.length < 4) {
    throw new Error(
      `R2 media object key 는 media/{collection}/{role}/{filename...} 형태의 폴더 구조가 필요합니다: ${objectKey}`,
    )
  }

  return normalized
}

export function buildR2MediaObjectKey(input: BuildR2MediaObjectKeyInput) {
  const prefix = assertFolderedR2MediaObjectKey(`${input.prefix}/placeholder`).replace(
    /\/placeholder$/,
    '',
  )
  const fileName = sanitizeFilename(input.filename ?? fileNameFromSourcePath(input.sourcePath))
  const traceSegments = buildTraceSegments(input)
  const objectKey = normalizeR2ObjectKey(path.posix.join(prefix, ...traceSegments, fileName))

  return assertFolderedR2MediaObjectKey(objectKey)
}

function buildTraceSegments(input: BuildR2MediaObjectKeyInput) {
  const sourceId = sanitizeSegment(input.sourceId)

  if (sourceId) {
    return [sourceId]
  }

  return sourcePathSegments(input.sourcePath)
}

function sourcePathSegments(sourcePath?: string) {
  const pathName = sourcePathFromValue(sourcePath)
  const parsed = path.posix.parse(pathName)

  return parsed.dir
    .split('/')
    .map((segment) => sanitizeSegment(segment))
    .filter((segment): segment is string => Boolean(segment))
}

function sourcePathFromValue(value?: string) {
  const rawValue = String(value ?? '').trim()

  if (!rawValue) {
    return ''
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return new URL(rawValue).pathname.replace(/^\/+/, '')
  }

  return rawValue.replace(/^\/+/, '')
}

function fileNameFromSourcePath(sourcePath?: string) {
  const pathName = sourcePathFromValue(sourcePath)
  const fileName = path.posix.basename(pathName)

  return fileName || 'image'
}

function sanitizeFilename(value: string) {
  const fileName = path.posix.basename(value.replace(/\\/g, '/')).trim()

  return fileName || 'image'
}

function sanitizeSegment(value: unknown) {
  const segment = String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')

  return segment || undefined
}

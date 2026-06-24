import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

import path from 'node:path'

import { copyR2Object, hasR2Config } from '@/lib/r2'
import { getR2MediaPrefix, type R2MediaRole } from '@/lib/r2ObjectKeys'

type MediaReferencePath = {
  path: string
  role: R2MediaRole
  type?: 'field' | 'richText'
}

type MediaDoc = {
  createdAt?: string
  filename?: string | null
  id: number | string
  prefix?: string | null
  sizes?: Record<string, { filename?: string | null } | null> | null
}

const freshUploadWindowMs = 24 * 60 * 60 * 1000
const unassignedUploadPrefixes = [
  'media',
  'media/assets',
  'media/uploads',
  'media/screen-appearances/images',
]

export function normalizeUploadedMediaPrefixes(
  references: MediaReferencePath[],
): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    if (!hasR2Config() || req.context?.skipMediaPrefixNormalization) {
      return doc
    }

    const documentId = docId(doc)

    if (!documentId) {
      return doc
    }

    const mediaRoles = collectMediaRoles(doc, references)

    for (const [mediaId, role] of mediaRoles) {
      await normalizeMediaPrefix({
        documentId,
        mediaId,
        req,
        role,
      })
    }

    return doc
  }
}

function collectMediaRoles(doc: unknown, references: MediaReferencePath[]) {
  const mediaRoles = new Map<string, R2MediaRole>()

  for (const reference of references) {
    const value = valueAtPath(doc, reference.path)
    const mediaIds =
      reference.type === 'richText' ? collectRichTextMediaIds(value) : collectMediaIds(value)

    for (const mediaId of mediaIds) {
      if (!mediaRoles.has(mediaId)) {
        mediaRoles.set(mediaId, reference.role)
      }
    }
  }

  return mediaRoles
}

async function normalizeMediaPrefix({
  documentId,
  mediaId,
  req,
  role,
}: {
  documentId: string
  mediaId: string
  req: PayloadRequest
  role: R2MediaRole
}) {
  let media: MediaDoc

  try {
    media = (await req.payload.findByID({
      collection: 'media',
      depth: 0,
      id: mediaId,
      overrideAccess: true,
      req,
    })) as MediaDoc
  } catch (error) {
    req.payload.logger.warn(`media prefix 정규화 대상 조회 실패: media=${mediaId}, ${String(error)}`)
    return
  }

  const rolePrefix = getR2MediaPrefix(role)
  const expectedPrefix = path.posix.join(rolePrefix, documentId)
  const currentPrefix = normalizePrefix(media.prefix)

  if (currentPrefix === expectedPrefix) {
    return
  }

  if (!isNewUploadPrefix({ currentPrefix, mediaId, rolePrefix })) {
    return
  }

  if (!isFreshUpload(media) && !isUnassignedUploadPrefix({ currentPrefix, mediaId })) {
    return
  }

  const filenames = mediaFilenames(media)

  if (filenames.length === 0) {
    return
  }

  try {
    await Promise.all(
      filenames.map((filename) =>
        copyR2Object({
          fromKey: path.posix.join(currentPrefix || 'media', filename),
          toKey: path.posix.join(expectedPrefix, filename),
        }),
      ),
    )
  } catch (error) {
    req.payload.logger.warn(
      `media prefix 정규화 R2 복사 실패: media=${mediaId}, prefix=${expectedPrefix}, ${String(error)}`,
    )
    return
  }

  const previousSkip = req.context?.skipMediaPrefixNormalization
  req.context = {
    ...req.context,
    skipMediaPrefixNormalization: true,
  }

  try {
    await req.payload.update({
      collection: 'media',
      data: {
        prefix: expectedPrefix,
      },
      depth: 0,
      id: mediaId,
      overrideAccess: true,
      req,
    })
  } finally {
    req.context.skipMediaPrefixNormalization = previousSkip
  }
}

function docId(doc: unknown) {
  if (!doc || typeof doc !== 'object' || !('id' in doc)) {
    return ''
  }

  return String((doc as { id?: unknown }).id ?? '').trim()
}

function normalizePrefix(value: unknown) {
  return path.posix.join(String(value || 'media')).replace(/^\/+|\/+$/g, '')
}

function isFreshUpload(media: MediaDoc) {
  const createdAt = Date.parse(String(media.createdAt ?? ''))

  if (!Number.isFinite(createdAt)) {
    return false
  }

  return Date.now() - createdAt <= freshUploadWindowMs
}

export function isNewUploadPrefix({
  currentPrefix,
  mediaId,
  rolePrefix,
}: {
  currentPrefix: string
  mediaId: string
  rolePrefix: string
}) {
  if (currentPrefix === rolePrefix || currentPrefix === path.posix.join(rolePrefix, mediaId)) {
    return true
  }

  return isUnassignedUploadPrefix({ currentPrefix, mediaId })
}

function isUnassignedUploadPrefix({
  currentPrefix,
  mediaId,
}: {
  currentPrefix: string
  mediaId: string
}) {
  return unassignedUploadPrefixes.some(
    (prefix) => currentPrefix === prefix || currentPrefix === path.posix.join(prefix, mediaId),
  )
}

function mediaFilenames(media: MediaDoc) {
  const filenames = new Set<string>()

  addFilename(filenames, media.filename)

  for (const size of Object.values(media.sizes ?? {})) {
    addFilename(filenames, size?.filename)
  }

  return [...filenames]
}

function addFilename(filenames: Set<string>, value: unknown) {
  const filename = typeof value === 'string' ? value.trim() : ''

  if (filename) {
    filenames.add(filename)
  }
}

function valueAtPath(value: unknown, dottedPath: string): unknown[] {
  const segments = dottedPath.split('.').filter(Boolean)

  return valueAtPathSegments([value], segments)
}

function valueAtPathSegments(values: unknown[], segments: string[]): unknown[] {
  if (segments.length === 0) {
    return values
  }

  const [segment, ...rest] = segments
  const nextValues: unknown[] = []

  for (const value of values) {
    if (segment === '*') {
      if (Array.isArray(value)) {
        nextValues.push(...value)
      }

      continue
    }

    if (value && typeof value === 'object' && segment in value) {
      nextValues.push((value as Record<string, unknown>)[segment])
    }
  }

  return valueAtPathSegments(nextValues, rest)
}

function collectMediaIds(values: unknown[]) {
  const mediaIds = new Set<string>()

  for (const value of values) {
    const mediaId = mediaIdFromValue(value)

    if (mediaId) {
      mediaIds.add(mediaId)
    }
  }

  return mediaIds
}

function collectRichTextMediaIds(values: unknown[]) {
  const mediaIds = new Set<string>()

  for (const value of values) {
    collectRichTextMediaIdsFromValue(value, mediaIds)
  }

  return mediaIds
}

function collectRichTextMediaIdsFromValue(value: unknown, mediaIds: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRichTextMediaIdsFromValue(item, mediaIds)
    }

    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  const record = value as Record<string, unknown>

  if (record.relationTo === 'media') {
    const mediaId = mediaIdFromValue(record.value)

    if (mediaId) {
      mediaIds.add(mediaId)
    }
  }

  for (const nextValue of Object.values(record)) {
    collectRichTextMediaIdsFromValue(nextValue, mediaIds)
  }
}

function mediaIdFromValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return mediaIdFromValue((value as { id?: unknown }).id)
  }

  return ''
}

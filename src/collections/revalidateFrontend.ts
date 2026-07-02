import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
  TypeWithID,
} from 'payload'

import { centerOptions, type CenterValue } from './shared'

type RevalidatePath = typeof revalidatePath
type RevalidateTag = typeof revalidateTag

type CenterScopedDoc = TypeWithID & {
  center?: unknown
  centers?: unknown
}

export function selectedFrontendCenters(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const normalized = values.map((item) => String(item ?? '').trim()).filter(Boolean)

  if (normalized.includes('all')) {
    return centerOptions.map((option) => option.value)
  }

  return Array.from(
    new Set(
      normalized.filter((item): item is CenterValue =>
        centerOptions.some((option) => option.value === item),
      ),
    ),
  )
}

function centerValueFromDoc(doc?: CenterScopedDoc | null) {
  return typeof doc?.center !== 'undefined' ? doc.center : doc?.centers
}

function normalizeSuffix(suffix: string) {
  const trimmed = suffix.trim().replace(/^\/+/, '').replace(/\/+$/, '')

  return trimmed ? `/${trimmed}` : ''
}

export function centerFrontendPaths({
  centers,
  previousCenters,
  suffixes,
}: {
  centers: unknown
  previousCenters?: unknown
  suffixes: string[]
}) {
  const centerValues = [
    ...selectedFrontendCenters(centers),
    ...selectedFrontendCenters(previousCenters),
  ]
  const paths = centerValues.flatMap((center) =>
    suffixes.map((suffix) => `/${center}${normalizeSuffix(suffix)}`),
  )

  return Array.from(new Set(paths))
}

export function centerFrontendCacheTags({
  centers,
  prefixes,
  previousCenters,
}: {
  centers: unknown
  prefixes: string[]
  previousCenters?: unknown
}) {
  const centerValues = [
    ...selectedFrontendCenters(centers),
    ...selectedFrontendCenters(previousCenters),
  ]
  const normalizedPrefixes = prefixes.map((prefix) => prefix.trim()).filter(Boolean)
  const tags = centerValues.flatMap((center) =>
    normalizedPrefixes.map((prefix) => `${prefix}_${center}`),
  )

  return Array.from(new Set(tags))
}

export function revalidateFrontendPaths({
  paths,
  reason,
  req,
  revalidate = revalidatePath,
  revalidateCacheTag = revalidateTag,
  tags = [],
}: {
  paths: string[]
  reason: string
  req: PayloadRequest
  revalidate?: RevalidatePath
  revalidateCacheTag?: RevalidateTag
  tags?: string[]
}) {
  if (req.context.disableRevalidate) {
    return
  }

  for (const path of paths) {
    req.payload.logger.info(`Revalidating ${reason} path ${path}`)
    revalidate(path, 'page')
  }

  for (const tag of Array.from(new Set(tags.map((item) => item.trim()).filter(Boolean)))) {
    req.payload.logger.info(`Revalidating ${reason} cache tag ${tag}`)
    revalidateCacheTag(tag, 'max')
  }
}

export function createCenterRevalidationAfterChange({
  cacheTagPrefixes = [],
  cacheTags = [],
  reason,
  suffixes,
}: {
  cacheTagPrefixes?: string[]
  cacheTags?: string[]
  reason: string
  suffixes: string[]
}): CollectionAfterChangeHook<CenterScopedDoc> {
  return ({ doc, previousDoc, req }) => {
    const centers = centerValueFromDoc(doc)
    const previousCenters = centerValueFromDoc(previousDoc)

    revalidateFrontendPaths({
      paths: centerFrontendPaths({
        centers,
        previousCenters,
        suffixes,
      }),
      reason,
      req,
      tags: [
        ...cacheTags,
        ...centerFrontendCacheTags({
          centers,
          prefixes: cacheTagPrefixes,
          previousCenters,
        }),
      ],
    })

    return doc
  }
}

export function createCenterRevalidationAfterDelete({
  cacheTagPrefixes = [],
  cacheTags = [],
  reason,
  suffixes,
}: {
  cacheTagPrefixes?: string[]
  cacheTags?: string[]
  reason: string
  suffixes: string[]
}): CollectionAfterDeleteHook<CenterScopedDoc> {
  return ({ doc, req }) => {
    const centers = centerValueFromDoc(doc)

    revalidateFrontendPaths({
      paths: centerFrontendPaths({
        centers,
        suffixes,
      }),
      reason,
      req,
      tags: [
        ...cacheTags,
        ...centerFrontendCacheTags({
          centers,
          prefixes: cacheTagPrefixes,
        }),
      ],
    })

    return doc
  }
}

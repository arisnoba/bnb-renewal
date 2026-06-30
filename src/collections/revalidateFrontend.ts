import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
  TypeWithID,
} from 'payload'

import { centerOptions, type CenterValue } from './shared'

type RevalidatePath = typeof revalidatePath

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

export function revalidateFrontendPaths({
  paths,
  reason,
  req,
  revalidate = revalidatePath,
}: {
  paths: string[]
  reason: string
  req: PayloadRequest
  revalidate?: RevalidatePath
}) {
  if (req.context.disableRevalidate) {
    return
  }

  for (const path of paths) {
    req.payload.logger.info(`Revalidating ${reason} path ${path}`)
    revalidate(path, 'page')
  }
}

export function createCenterRevalidationAfterChange({
  reason,
  suffixes,
}: {
  reason: string
  suffixes: string[]
}): CollectionAfterChangeHook<CenterScopedDoc> {
  return ({ doc, previousDoc, req }) => {
    revalidateFrontendPaths({
      paths: centerFrontendPaths({
        centers: centerValueFromDoc(doc),
        previousCenters: centerValueFromDoc(previousDoc),
        suffixes,
      }),
      reason,
      req,
    })

    return doc
  }
}

export function createCenterRevalidationAfterDelete({
  reason,
  suffixes,
}: {
  reason: string
  suffixes: string[]
}): CollectionAfterDeleteHook<CenterScopedDoc> {
  return ({ doc, req }) => {
    revalidateFrontendPaths({
      paths: centerFrontendPaths({
        centers: centerValueFromDoc(doc),
        suffixes,
      }),
      reason,
      req,
    })

    return doc
  }
}

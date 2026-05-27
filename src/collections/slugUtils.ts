import type { CollectionBeforeValidateHook } from 'payload'

import { koreanSlugify } from '../utilities/koreanSlugify'

type SlugDoc = {
  id?: unknown
  slug?: unknown
}

type PayloadFind = {
  find: (args: {
    collection: string
    depth: number
    limit: number
    overrideAccess: boolean
    pagination: false
    where: {
      slug: {
        equals: string
      }
    }
  }) => Promise<{ docs: SlugDoc[] }>
}

type SlugHookArgs = {
  collection: string
  getSlugParts: (args: {
    data: Record<string, unknown>
    originalDoc?: Record<string, unknown>
  }) => unknown[]
  fallbackPrefix: string
}

function sameId(left: unknown, right: unknown) {
  return String(left ?? '') === String(right ?? '')
}

export function slugFromParts(parts: unknown[], fallbackPrefix: string) {
  const slug = parts
    .map((part) => koreanSlugify({ valueToSlugify: part }))
    .filter(Boolean)
    .join('-')

  return slug || fallbackPrefix
}

async function slugExists({
  collection,
  originalId,
  payload,
  slug,
}: {
  collection: string
  originalId?: unknown
  payload: PayloadFind
  slug: string
}) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs.some((doc) => !sameId(doc.id, originalId))
}

async function nextUniqueSlug({
  baseSlug,
  collection,
  originalId,
  payload,
}: {
  baseSlug: string
  collection: string
  originalId?: unknown
  payload?: PayloadFind
}) {
  if (!payload || !(await slugExists({ collection, originalId, payload, slug: baseSlug }))) {
    return baseSlug
  }

  let suffix = 2

  while (await slugExists({ collection, originalId, payload, slug: `${baseSlug}-${suffix}` })) {
    suffix += 1
  }

  return `${baseSlug}-${suffix}`
}

export function createUniqueSlugBeforeValidate({
  collection,
  fallbackPrefix,
  getSlugParts,
}: SlugHookArgs): CollectionBeforeValidateHook {
  return async ({ data, originalDoc, req }) => {
    if (!data) {
      return data
    }

    const shouldGenerateSlug = data.generateSlug ?? originalDoc?.generateSlug ?? true

    if (shouldGenerateSlug === false && (data.slug || originalDoc?.slug)) {
      return data
    }

    const baseSlug = slugFromParts(
      getSlugParts({
        data: data as Record<string, unknown>,
        originalDoc: originalDoc as Record<string, unknown> | undefined,
      }),
      fallbackPrefix,
    )

    return {
      ...data,
      slug: await nextUniqueSlug({
        baseSlug,
        collection,
        originalId: data.id ?? originalDoc?.id,
        payload: req.payload as unknown as PayloadFind,
      }),
    }
  }
}

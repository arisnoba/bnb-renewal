import type {
  CollectionConfig,
  Endpoint,
  PayloadRequest,
  PopulateType,
  SelectType,
  Where,
} from 'payload'

import {
  addDataAndFileToRequest,
  addLocalesToRequestFromData,
  headersWithCors,
} from 'payload'

type BulkError = {
  id?: number | string
  isPublic: boolean
  message: string
}

type BulkParams = {
  depth?: number
  draft?: boolean
  overrideLock: boolean
  populate?: PopulateType
  publishAllLocales?: boolean
  publishSpecificLocale?: string
  select?: SelectType
  sort?: string | string[]
  trash: boolean
  unpublishAllLocales?: boolean
  where?: Where
}

type DocumentID = number | string

function firstQueryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function parseBoolean(value: unknown): boolean | undefined {
  const normalized = firstQueryValue(value)

  if (typeof normalized === 'boolean') {
    return normalized
  }

  if (typeof normalized === 'string') {
    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }
  }

  return undefined
}

function parseNumber(value: unknown): number | undefined {
  const normalized = firstQueryValue(value)

  if (typeof normalized === 'number' && Number.isFinite(normalized)) {
    return normalized
  }

  if (typeof normalized === 'string' && normalized.trim()) {
    const number = Number(normalized)

    return Number.isFinite(number) ? number : undefined
  }

  return undefined
}

function parseString(value: unknown): string | undefined {
  const normalized = firstQueryValue(value)

  return typeof normalized === 'string' ? normalized : undefined
}

function getBulkParams(req: PayloadRequest): BulkParams {
  const query = req.query ?? {}

  return {
    depth: parseNumber(query.depth),
    draft: parseBoolean(query.draft),
    overrideLock: parseBoolean(query.overrideLock) ?? false,
    populate: query.populate as PopulateType | undefined,
    publishAllLocales: parseBoolean(query.publishAllLocales),
    publishSpecificLocale: parseString(query.publishSpecificLocale),
    select: query.select as SelectType | undefined,
    sort: query.sort as string | string[] | undefined,
    trash: parseBoolean(query.trash) ?? false,
    unpublishAllLocales: parseBoolean(query.unpublishAllLocales),
    where: query.where as Where | undefined,
  }
}

function jsonResponse(req: PayloadRequest, status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status,
  })
}

function publicError(error: unknown, fallbackMessage: string, id?: DocumentID): BulkError {
  return {
    id,
    isPublic: true,
    message: error instanceof Error ? error.message : fallbackMessage,
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'NotFound' || (error as Error & { status?: number }).status === 404)
  )
}

function collectionLabel(collection: CollectionConfig, count: number): string {
  const labels = collection.labels
  const label = labels?.[count === 1 ? 'singular' : 'plural']

  return typeof label === 'string' ? label : collection.slug
}

async function findTargetIDs(
  req: PayloadRequest,
  collection: CollectionConfig,
  params: BulkParams,
): Promise<DocumentID[]> {
  if (!params.where) {
    throw new Error("Missing 'where' query of documents to process.")
  }

  const result = await req.payload.find({
    collection: collection.slug as never,
    depth: 0,
    draft: params.draft,
    limit: 0,
    overrideAccess: false,
    pagination: false,
    req,
    select: {
      id: true,
    } as never,
    sort: params.sort,
    trash: params.trash,
    where: params.where,
  })

  const ids: DocumentID[] = []

  for (const doc of result.docs as Array<{ id?: unknown }>) {
    if (typeof doc.id === 'number' || typeof doc.id === 'string') {
      ids.push(doc.id)
    }
  }

  return ids
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function expectedEntries(
  value: unknown,
  path: string[] = [],
  entries: Array<{ path: string[]; value: unknown }> = [],
) {
  if (typeof value === 'undefined') {
    return entries
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      expectedEntries(childValue, [...path, key], entries)
    }

    return entries
  }

  entries.push({ path, value })

  return entries
}

function getValueAtPath(doc: unknown, path: string[]) {
  let current = doc

  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, childValue]) => [key, canonicalize(childValue)])

    return Object.fromEntries(entries)
  }

  return value
}

function valuesMatch(expected: unknown, actual: unknown): boolean {
  if (
    (typeof expected === 'number' || typeof expected === 'string') &&
    (typeof actual === 'number' || typeof actual === 'string')
  ) {
    return String(expected) === String(actual)
  }

  return JSON.stringify(canonicalize(expected)) === JSON.stringify(canonicalize(actual))
}

function verifyUpdatedFields(data: Record<string, unknown>, doc: unknown): string[] {
  const mismatches: string[] = []

  for (const { path, value } of expectedEntries(data)) {
    const actual = getValueAtPath(doc, path)

    if (!valuesMatch(value, actual)) {
      mismatches.push(path.join('.'))
    }
  }

  return mismatches
}

async function reliableBulkUpdate(req: PayloadRequest, collection: CollectionConfig) {
  if (collection.disableBulkEdit) {
    return jsonResponse(req, 403, {
      errors: [
        {
          isPublic: true,
          message: `Collection ${collection.slug} has disabled bulk edit`,
        },
      ],
      message: '일괄 수정을 사용할 수 없는 컬렉션입니다.',
    })
  }

  const params = getBulkParams(req)
  const data =
    req.data && typeof req.data === 'object'
      ? (req.data as Record<string, unknown>)
      : undefined

  if (!data) {
    return jsonResponse(req, 400, {
      errors: [
        {
          isPublic: true,
          message: 'Missing update data.',
        },
      ],
      message: '수정할 데이터가 없습니다.',
    })
  }

  let ids: DocumentID[]

  try {
    ids = await findTargetIDs(req, collection, params)
  } catch (error) {
    return jsonResponse(req, 400, {
      errors: [publicError(error, 'Unable to resolve bulk update targets.')],
      message: '일괄 수정 대상을 확인하지 못했습니다.',
    })
  }

  const docs: unknown[] = []
  const errors: BulkError[] = []

  for (const id of ids) {
    try {
      await req.payload.update({
        collection: collection.slug as never,
        data: data as never,
        depth: 0,
        draft: params.draft,
        id,
        overrideAccess: false,
        overrideLock: params.overrideLock,
        publishAllLocales: params.publishAllLocales,
        publishSpecificLocale: params.publishSpecificLocale,
        req,
        trash: params.trash,
        unpublishAllLocales: params.unpublishAllLocales,
      })

      const verifiedDoc = await req.payload.findByID({
        collection: collection.slug as never,
        depth: 0,
        draft: params.draft,
        id,
        overrideAccess: false,
        req,
      })
      const mismatchedFields = verifyUpdatedFields(data, verifiedDoc)

      if (mismatchedFields.length > 0) {
        errors.push({
          id,
          isPublic: true,
          message: `수정 후 재조회 검증에 실패했습니다: ${mismatchedFields.join(', ')}`,
        })
      } else {
        docs.push(verifiedDoc)
      }
    } catch (error) {
      errors.push(publicError(error, 'Unable to update document.', id))
    }
  }

  if (errors.length > 0) {
    return jsonResponse(req, 400, {
      docs,
      errors,
      message: `${collectionLabel(collection, ids.length)} ${ids.length}개 중 ${errors.length}개를 수정하지 못했습니다.`,
    })
  }

  return jsonResponse(req, 200, {
    docs,
    errors,
    message: `${collectionLabel(collection, docs.length)} ${docs.length}개를 수정했습니다.`,
  })
}

async function reliableBulkDelete(req: PayloadRequest, collection: CollectionConfig) {
  const params = getBulkParams(req)
  let ids: DocumentID[]

  try {
    ids = await findTargetIDs(req, collection, params)
  } catch (error) {
    return jsonResponse(req, 400, {
      errors: [publicError(error, 'Unable to resolve bulk delete targets.')],
      message: '일괄 삭제 대상을 확인하지 못했습니다.',
    })
  }

  const docs: unknown[] = []
  const errors: BulkError[] = []

  for (const id of ids) {
    try {
      const deletedDoc = await req.payload.delete({
        collection: collection.slug as never,
        depth: 0,
        id,
        overrideAccess: false,
        overrideLock: params.overrideLock,
        req,
        trash: params.trash,
      })

      try {
        await req.payload.findByID({
          collection: collection.slug as never,
          depth: 0,
          id,
          overrideAccess: false,
          req,
        })
        errors.push({
          id,
          isPublic: true,
          message: '삭제 후 재조회 검증에 실패했습니다.',
        })
      } catch (error) {
        if (isNotFoundError(error)) {
          docs.push(deletedDoc)
        } else {
          errors.push(publicError(error, 'Unable to verify deleted document.', id))
        }
      }
    } catch (error) {
      errors.push(publicError(error, 'Unable to delete document.', id))
    }
  }

  if (errors.length > 0) {
    return jsonResponse(req, 400, {
      docs,
      errors,
      message: `${collectionLabel(collection, ids.length)} ${ids.length}개 중 ${errors.length}개를 삭제하지 못했습니다.`,
    })
  }

  return jsonResponse(req, 200, {
    docs,
    errors,
    message: `${collectionLabel(collection, docs.length)} ${docs.length}개를 삭제했습니다.`,
  })
}

function createReliableBulkEndpoints(collection: CollectionConfig): Endpoint[] {
  return [
    {
      handler: async (req) => {
        await addDataAndFileToRequest(req)
        addLocalesToRequestFromData(req)

        return reliableBulkUpdate(req, collection)
      },
      method: 'patch',
      path: '/',
    },
    {
      handler: (req) => reliableBulkDelete(req, collection),
      method: 'delete',
      path: '/',
    },
  ]
}

export function applyReliableBulkEndpoints(collections: CollectionConfig[]) {
  return collections.map((collection) => {
    if (collection.endpoints === false) {
      return collection
    }

    return {
      ...collection,
      endpoints: [
        ...createReliableBulkEndpoints(collection),
        ...(collection.endpoints ?? []),
      ],
    }
  })
}

import {
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { getTranslation } from '@payloadcms/translations'
import type { Where } from 'payload'
import { createPayloadRequest, headersWithCors } from 'payload'

import config from '../../../../../payload.config'

const collectionSlug = 'media'
const restArgs = { params: Promise.resolve({ slug: [collectionSlug] }) }

export const GET = (request: Request) => REST_GET(config)(request, restArgs)
export const POST = (request: Request) => REST_POST(config)(request, restArgs)
export const PATCH = (request: Request) => REST_PATCH(config)(request, restArgs)
export const PUT = (request: Request) => REST_PUT(config)(request, restArgs)
export const OPTIONS = (request: Request) => REST_OPTIONS(config)(request, restArgs)

export async function DELETE(request: Request) {
  const req = await createPayloadRequest({
    config,
    params: {
      collection: collectionSlug,
    },
    request,
  })
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })
  const where = req.query.where as Where | undefined

  if (!req.user) {
    return Response.json(
      {
        errors: [{ message: 'Unauthorized' }],
        message: 'Unauthorized',
      },
      {
        headers,
        status: 401,
      },
    )
  }

  if (!where) {
    return Response.json(
      {
        errors: [{ message: "Missing 'where' query of documents to delete." }],
        message: "Missing 'where' query of documents to delete.",
      },
      {
        headers,
        status: 400,
      },
    )
  }

  const docsToDelete = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: 0,
    overrideAccess: false,
    pagination: false,
    req,
    trash: req.query.trash === true || req.query.trash === 'true',
    where,
  })
  const docs = []
  const errors = []

  for (const doc of docsToDelete.docs) {
    try {
      const deletedDoc = await req.payload.delete({
        collection: collectionSlug,
        id: doc.id,
        overrideAccess: false,
        overrideLock: req.query.overrideLock === true || req.query.overrideLock === 'true',
        req,
        select: {},
      })

      docs.push(deletedDoc)
    } catch (error) {
      errors.push({
        id: doc.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const collection = req.payload.collections[collectionSlug]
  const total = docs.length + errors.length
  const message =
    errors.length === 0
      ? req.t('general:deletedCountSuccessfully', {
          count: docs.length,
          label: getTranslation(collection.config.labels[docs.length === 1 ? 'singular' : 'plural'], req.i18n),
        })
      : req.t('error:unableToDeleteCount', {
          count: errors.length,
          label: getTranslation(collection.config.labels[total === 1 ? 'singular' : 'plural'], req.i18n),
          total,
        })

  return Response.json(
    {
      docs,
      errors,
      message,
      totalDocs: docsToDelete.totalDocs,
    },
    {
      headers,
      status: errors.length === 0 ? 200 : 400,
    },
  )
}

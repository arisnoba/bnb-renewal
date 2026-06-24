import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { FileData, TypeWithID } from 'payload'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import fs from 'node:fs/promises'
import path from 'node:path'

import { deleteR2Object, getR2PublicUrl, hasR2Config, uploadR2Object } from '@/lib/r2'
import { R2_MEDIA_PREFIX_BY_ROLE } from '@/lib/r2ObjectKeys'
import { getServerSideURL } from '@/utilities/getURL'
import { withSiteTitle } from '@/utilities/siteMetadata'

type SeoDocument = {
  slug?: string | null
  title?: string | null
}

const generateTitle: GenerateTitle<SeoDocument> = ({ doc }) => {
  return withSiteTitle(doc?.title)
}

const generateURL: GenerateURL<SeoDocument> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const r2Enabled = hasR2Config()
const mediaPrefix = 'media/uploads'
const localMediaFallbackEnabled = process.env.NODE_ENV !== 'production'
const mediaIdScopedPrefixes = new Set([mediaPrefix, ...Object.values(R2_MEDIA_PREFIX_BY_ROLE)])
type LocalMediaFallback = typeof import('./localMediaFallback')

function mediaIdScopedPrefix(prefix: string | undefined, mediaId: unknown) {
  const normalizedPrefix = path.posix
    .join(prefix || mediaPrefix)
    .replace(/^\/+|\/+$/g, '')
  const id = String(mediaId ?? '').trim()

  if (!id || normalizedPrefix.split('/').at(-1) === id) {
    return normalizedPrefix
  }

  return mediaIdScopedPrefixes.has(normalizedPrefix)
    ? path.posix.join(normalizedPrefix, id)
    : normalizedPrefix
}

function localMediaURL(filename: string, prefix?: string) {
  const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''

  return `/api/media/file/${encodeURIComponent(filename)}${query}`
}

async function getLocalMediaFallback(): Promise<LocalMediaFallback | null> {
  if (!localMediaFallbackEnabled) {
    return null
  }

  return import('./localMediaFallback')
}

async function hasLocalMediaFile(filename: string) {
  const fallback = await getLocalMediaFallback()

  return fallback ? fallback.hasLocalMediaFile(filename) : false
}

const mediaR2Adapter: Adapter = ({ prefix = mediaPrefix }) => ({
  name: 'r2',
  generateURL: async ({ filename, prefix: storedPrefix }) => {
    const resolvedPrefix = storedPrefix || prefix

    if (await hasLocalMediaFile(filename)) {
      return localMediaURL(filename, resolvedPrefix)
    }

    return getR2PublicUrl(path.posix.join(resolvedPrefix, filename))
  },
  handleDelete: async ({ doc, filename }) => {
    const objectKey = path.posix.join(doc.prefix || prefix, filename)

    await deleteR2Object(objectKey)
  },
  handleUpload: async ({ data, file }) => {
    const resolvedPrefix = mediaIdScopedPrefix(data.prefix || prefix, data.id)
    const objectKey = path.posix.join(resolvedPrefix, file.filename)
    const body = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.buffer

    await uploadR2Object({
      body,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: file.mimeType,
      key: objectKey,
    })

    return {
      prefix: resolvedPrefix,
    } as unknown as Partial<FileData & TypeWithID>
  },
  staticHandler: async (_req, args) => {
    const filename = String(args.params.filename ?? '')
    const fallback = await getLocalMediaFallback()
    const localResponse = fallback ? await fallback.localMediaResponse(filename) : null

    if (localResponse) {
      return localResponse
    }

    const objectKey = path.posix.join(args.params.prefix || prefix, filename)

    return Response.redirect(getR2PublicUrl(objectKey), 302)
  },
})

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  cloudStoragePlugin({
    alwaysInsertFields: true,
    collections: {
      media: {
        adapter: r2Enabled ? mediaR2Adapter : null,
        generateFileURL: async ({ filename, prefix }) => {
          const resolvedPrefix = prefix || mediaPrefix

          if (await hasLocalMediaFile(filename)) {
            return localMediaURL(filename, resolvedPrefix)
          }

          const objectKey = path.posix.join(resolvedPrefix, filename)

          return getR2PublicUrl(objectKey)
        },
        prefix: mediaPrefix,
      },
    },
    enabled: r2Enabled,
  }),
]

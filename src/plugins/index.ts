import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { FileData, TypeWithID } from 'payload'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Page, Post } from '@/payload-types'
import { deleteR2Object, getR2PublicUrl, hasR2Config, uploadR2Object } from '@/lib/r2'
import { R2_MEDIA_PREFIX_BY_ROLE } from '@/lib/r2ObjectKeys'
import { getServerSideURL } from '@/utilities/getURL'
import { withSiteTitle } from '@/utilities/siteMetadata'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return withSiteTitle(doc?.title)
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const r2Enabled = hasR2Config()
const mediaPrefix = 'media'
const localMediaDir = path.resolve(process.cwd(), 'public/media')
const mediaIdScopedPrefixes = new Set([mediaPrefix, ...Object.values(R2_MEDIA_PREFIX_BY_ROLE)])

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

function localMediaPath(filename: string) {
  const filePath = path.resolve(localMediaDir, path.basename(filename))

  if (!filePath.startsWith(`${localMediaDir}${path.sep}`)) {
    return null
  }

  return filePath
}

async function hasLocalMediaFile(filename: string) {
  const filePath = localMediaPath(filename)

  if (!filePath) {
    return false
  }

  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

function localMediaURL(filename: string, prefix?: string) {
  const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''

  return `/api/media/file/${encodeURIComponent(filename)}${query}`
}

function mediaContentType(filename: string) {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
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
    const filePath = localMediaPath(filename)

    if (filePath) {
      try {
        const body = await fs.readFile(filePath)

        return new Response(new Uint8Array(body), {
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Type': mediaContentType(filename),
          },
        })
      } catch {
        // Fall through to R2 for media that only exists in object storage.
      }
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

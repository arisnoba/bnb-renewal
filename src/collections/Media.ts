import type { CollectionAfterReadHook, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function normalizeLocalMediaURL(value: unknown) {
  const url = typeof value === 'string' ? value.trim() : ''

  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)

    if (parsed.pathname.startsWith('/api/media/file/')) {
      return parsed.pathname
    }
  } catch {
    return url
  }

  return url
}

function mediaAdminThumbnail({ doc }: { doc: Record<string, unknown> }) {
  const thumbnailURL = normalizeLocalMediaURL(doc.thumbnailURL)
  const url = normalizeLocalMediaURL(doc.url)

  return thumbnailURL || url || null
}

const applyExternalUrlAfterRead: CollectionAfterReadHook = ({ doc }) => {
  const externalUrl = typeof doc?.externalUrl === 'string' ? doc.externalUrl.trim() : ''

  if (!externalUrl) {
    const normalizedUrl = normalizeLocalMediaURL(doc?.url)
    const normalizedThumbnailURL =
      normalizeLocalMediaURL(doc?.thumbnailURL) ||
      normalizeLocalMediaURL(doc?.sizes?.thumbnail?.url) ||
      normalizedUrl

    return {
      ...doc,
      ...(normalizedUrl ? { url: normalizedUrl } : {}),
      ...(normalizedThumbnailURL ? { thumbnailURL: normalizedThumbnailURL } : {}),
    }
  }

  return {
    ...doc,
    thumbnailURL: externalUrl,
    url: externalUrl,
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterRead: [applyExternalUrlAfterRead],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: mediaAdminThumbnail,
    focalPoint: true,
    resizeOptions: {
      width: 1920,
      withoutEnlargement: true,
    },
  },
}

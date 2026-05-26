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
  admin: {
    components: {
      views: {
        list: {
          Component: '@/components/payload/MediaListView#MediaListView',
        },
      },
    },
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
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}

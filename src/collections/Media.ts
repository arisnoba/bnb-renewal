import type { CollectionAfterChangeHook, CollectionAfterReadHook, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import fs from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { deleteR2Object, hasR2Config } from '@/lib/r2'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaStaticDir = path.resolve(dirname, '../../public/media')
const imageFormatOptions = {
  format: 'webp' as const,
  options: {
    quality: 80,
  },
}
const mediaImageSizes = [
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
].map((size) => ({
  ...size,
  formatOptions: imageFormatOptions,
}))

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

function localMediaPath(value: unknown) {
  const filename = path.basename(String(value ?? '').trim())

  if (!filename) {
    return null
  }

  const filePath = path.resolve(mediaStaticDir, filename)

  return filePath.startsWith(`${mediaStaticDir}${path.sep}`) ? filePath : null
}

function emptyImageSize() {
  return {
    filename: null,
    filesize: null,
    height: null,
    mimeType: null,
    url: null,
    width: null,
  }
}

function emptyImageSizes() {
  return Object.fromEntries(mediaImageSizes.map((size) => [size.name, emptyImageSize()]))
}

function imageSizeFilenames(doc: Record<string, unknown>) {
  const sizes = doc.sizes && typeof doc.sizes === 'object' ? doc.sizes : {}

  return Object.values(sizes)
    .map((size) =>
      size && typeof size === 'object' && 'filename' in size
        ? String(size.filename ?? '').trim()
        : '',
    )
    .filter(Boolean)
}

async function deleteGeneratedVariant({ filename, prefix }: { filename: string; prefix?: unknown }) {
  if (hasR2Config()) {
    await deleteR2Object(path.posix.join(String(prefix || 'media'), filename)).catch(() => undefined)
  }

  const filePath = localMediaPath(filename)

  if (filePath) {
    await fs.unlink(filePath).catch(() => undefined)
  }
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

const removeGeneratedImageVariantsAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (req.context?.skipSmallImageVariantCleanup) {
    return doc
  }

  const filenames = imageSizeFilenames(doc)

  if (filenames.length === 0) {
    return doc
  }

  await Promise.all(
    filenames.map((filename) =>
      deleteGeneratedVariant({
        filename,
        prefix: doc.prefix,
      }),
    ),
  )

  const previousSkip = req.context?.skipSmallImageVariantCleanup
  req.context = {
    ...req.context,
    skipSmallImageVariantCleanup: true,
  }

  try {
    await req.payload.update({
      collection: 'media',
      data: {
        sizes: emptyImageSizes(),
        thumbnailURL: null,
      } as Record<string, unknown>,
      id: doc.id,
      overrideAccess: true,
      req,
    })
  } finally {
    req.context.skipSmallImageVariantCleanup = previousSkip
  }

  return {
    ...doc,
    sizes: emptyImageSizes(),
    thumbnailURL: null,
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
    afterChange: [removeGeneratedImageVariantsAfterChange],
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
    staticDir: mediaStaticDir,
    adminThumbnail: mediaAdminThumbnail,
    formatOptions: imageFormatOptions,
    focalPoint: true,
    imageSizes: mediaImageSizes,
  },
}

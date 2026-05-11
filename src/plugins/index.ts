import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Page, Post } from '@/payload-types'
import { deleteR2Object, getR2PublicUrl, hasR2Config, uploadR2Object } from '@/lib/r2'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const r2Enabled = hasR2Config()
const mediaPrefix = 'media'

const mediaR2Adapter: Adapter = ({ prefix = mediaPrefix }) => ({
  name: 'r2',
  generateURL: ({ filename, prefix: storedPrefix }) => {
    return getR2PublicUrl(path.posix.join(storedPrefix || prefix, filename))
  },
  handleDelete: async ({ doc, filename }) => {
    const objectKey = path.posix.join(doc.prefix || prefix, filename)

    await deleteR2Object(objectKey)
  },
  handleUpload: async ({ data, file }) => {
    const objectKey = path.posix.join(data.prefix || prefix, file.filename)
    const body = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.buffer

    await uploadR2Object({
      body,
      cacheControl: 'public, max-age=31536000, immutable',
      contentType: file.mimeType,
      key: objectKey,
    })

    return data
  },
  staticHandler: (_req, args) => {
    const objectKey = path.posix.join(args.params.prefix || prefix, args.params.filename)

    return Response.redirect(getR2PublicUrl(objectKey), 302)
  },
})

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  cloudStoragePlugin({
    alwaysInsertFields: true,
    collections: {
      media: {
        adapter: r2Enabled ? mediaR2Adapter : null,
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => {
          const objectKey = path.posix.join(prefix || mediaPrefix, filename)

          return getR2PublicUrl(objectKey)
        },
        prefix: mediaPrefix,
      },
    },
    enabled: r2Enabled,
  }),
]

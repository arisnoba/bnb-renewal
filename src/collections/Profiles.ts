import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['name', 'category', 'publishedAt', 'updatedAt'],
    useAsTitle: 'name',
  },
  defaultSort: '-publishedAt',
  fields: [
    {
      name: 'sourceTable',
      type: 'text',
      required: true,
    },
    {
      name: 'sourceId',
      type: 'number',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'authorName',
      type: 'text',
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

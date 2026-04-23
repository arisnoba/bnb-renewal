import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
  systemDateFields,
} from './shared'

export const News: CollectionConfig = {
  slug: 'news',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'centers', 'category', 'publishedAt', 'updatedAtLabel'],
    group: '운영/소식',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
    },
    centersField,
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
      name: 'thumbnailPath',
      type: 'text',
    },
    {
      name: 'authorName',
      type: 'text',
    },
    ...publishingFields,
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
    },
    ...systemDateFields,
    legacyMetaField,
  ],
}

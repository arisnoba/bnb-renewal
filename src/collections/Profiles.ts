import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['name', 'centers', 'filter', 'publishedAt', 'updatedAt'],
    group: '프로필/출연',
    useAsTitle: 'name',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'filter',
      type: 'text',
    },
    {
      name: 'englishName',
      type: 'text',
    },
    {
      name: 'height',
      type: 'text',
    },
    {
      name: 'weight',
      type: 'text',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      required: true,
    },
    {
      name: 'profileImagePath',
      type: 'text',
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'authorName',
      type: 'text',
    },
    ...publishingFields,
    legacyMetaField,
  ],
}

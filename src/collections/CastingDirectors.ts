import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
  systemDateFields,
} from './shared'

export const CastingDirectors: CollectionConfig = {
  slug: 'casting-directors',
  labels: {
    plural: '캐스팅 디렉터',
    singular: '캐스팅 디렉터',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['personName', 'company', 'centers', 'publishedAt', 'updatedAtLabel'],
    group: '캐스팅/오디션',
    useAsTitle: 'personName',
  },
  defaultSort: 'personName',
  fields: [
    ...sourceFields,
    {
      name: 'personName',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    centersField,
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
    },
    {
      name: 'authorName',
      type: 'text',
    },
    ...publishingFields,
    ...systemDateFields,
    legacyMetaField,
  ],
}

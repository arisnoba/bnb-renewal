import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
  systemDateFields,
} from './shared'

export const ExamResults: CollectionConfig = {
  slug: 'exam-results',
  labels: {
    plural: '합격결과',
    singular: '합격결과',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'resultType', 'publishedAt', 'updatedAtLabel'],
    group: '후기/합격',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    { name: 'resultType', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'bodyHtml', type: 'textarea' },
    { name: 'thumbnailPath', type: 'text' },
    { name: 'thumbnailSource', type: 'text', required: true },
    ...publishingFields,
    ...systemDateFields,
    legacyMetaField,
  ],
}

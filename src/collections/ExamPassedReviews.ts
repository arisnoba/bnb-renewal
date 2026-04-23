import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
  systemDateFields,
} from './shared'

export const ExamPassedReviews: CollectionConfig = {
  slug: 'exam-passed-reviews',
  labels: {
    plural: '합격후기',
    singular: '합격후기',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'schoolName', 'publishedAt', 'updatedAtLabel'],
    group: '후기/합격',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    { name: 'schoolName', type: 'text', required: true },
    { name: 'schoolLogoSlug', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'bodyHtml', type: 'textarea' },
    { name: 'schoolLogoPath', type: 'text', required: true },
    { name: 'studentImagePath', type: 'text', required: true },
    ...publishingFields,
    ...systemDateFields,
    legacyMetaField,
  ],
}

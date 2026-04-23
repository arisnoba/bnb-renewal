import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const ExamPassedVideos: CollectionConfig = {
  slug: 'exam-passed-videos',
  labels: {
    plural: '합격영상',
    singular: '합격영상',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'youtubeUrl', 'publishedAt', 'updatedAt'],
    group: '후기/합격',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    { name: 'title', type: 'text', required: true },
    { name: 'bodyHtml', type: 'textarea' },
    { name: 'youtubeCode', type: 'text', required: true, unique: true },
    { name: 'youtubeUrl', type: 'text', required: true },
    ...publishingFields,
    legacyMetaField,
  ],
}

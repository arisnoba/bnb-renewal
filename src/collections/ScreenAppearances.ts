import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const ScreenAppearances: CollectionConfig = {
  slug: 'screen-appearances',
  labels: {
    plural: '드라마/광고 출연장면',
    singular: '드라마/광고 출연장면',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'centers', 'performerName', 'projectTitle', 'publishedAt'],
    group: '캐스팅/오디션',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    { name: 'appearanceType', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'bodyHtml', type: 'textarea' },
    { name: 'performerName', type: 'text', required: true },
    { name: 'className', type: 'text' },
    { name: 'projectTitle', type: 'text' },
    { name: 'roleName', type: 'text' },
    { name: 'airDateLabel', type: 'text' },
    { name: 'profileImagePath', type: 'text' },
    { name: 'thumbnailPath', type: 'text' },
    ...publishingFields,
    legacyMetaField,
  ],
}

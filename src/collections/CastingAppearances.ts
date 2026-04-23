import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
  systemDateFields,
} from './shared'

export const CastingAppearances: CollectionConfig = {
  slug: 'casting-appearances',
  labels: {
    plural: '캐스팅 출연현황',
    singular: '캐스팅 출연현황',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'centers', 'broadcaster', 'castingStatus', 'publishedAt'],
    group: '캐스팅/오디션',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    { name: 'title', type: 'text', required: true },
    { name: 'bodyHtml', type: 'textarea' },
    { name: 'broadcaster', type: 'text' },
    { name: 'productionCompany', type: 'text' },
    { name: 'directors', type: 'text' },
    { name: 'writers', type: 'text' },
    { name: 'castingStatus', type: 'text' },
    { name: 'castingCompany', type: 'text' },
    { name: 'thumbnailPath', type: 'text' },
    ...publishingFields,
    ...systemDateFields,
    legacyMetaField,
  ],
}

import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const ArtistPress: CollectionConfig = {
  slug: 'artist-press',
  labels: {
    plural: '출신 아티스트',
    singular: '출신 아티스트',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'actorName', 'generation', 'publishedAt', 'updatedAt'],
    group: '프로필/성과',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    centersField,
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'actorName',
      type: 'text',
      required: true,
    },
    {
      name: 'generation',
      type: 'text',
      required: true,
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
    },
    {
      name: 'agencyLogoPath',
      type: 'text',
    },
    {
      name: 'thumbnailPath',
      type: 'text',
    },
    ...publishingFields,
    legacyMetaField,
  ],
}

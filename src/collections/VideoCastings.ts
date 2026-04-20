import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const VideoCastings: CollectionConfig = {
  slug: 'video-castings',
  labels: {
    plural: '영상 캐스팅',
    singular: '영상 캐스팅',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'broadcaster', 'displayOrder', 'updatedAt'],
    group: '레거시 콘텐츠',
    useAsTitle: 'title',
  },
  defaultSort: 'displayOrder',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'broadcaster',
      type: 'text',
    },
    {
      name: 'youtubeUrl',
      type: 'text',
    },
    {
      name: 'messageHtml',
      type: 'textarea',
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

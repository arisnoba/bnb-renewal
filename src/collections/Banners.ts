import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
export const Banners: CollectionConfig = {
  slug: 'banners',
  labels: {
    plural: '배너',
    singular: '배너',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['label', 'position', 'device', 'displayOrder', 'updatedAt'],
    group: '레거시 콘텐츠',
    useAsTitle: 'label',
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
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'altText',
      type: 'text',
    },
    {
      name: 'url',
      type: 'text',
    },
    {
      name: 'device',
      type: 'text',
    },
    {
      name: 'position',
      type: 'text',
    },
    {
      name: 'hasBorder',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'openInNewWindow',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'beginAt',
      type: 'date',
    },
    {
      name: 'endAt',
      type: 'date',
    },
    {
      name: 'recordedAt',
      type: 'date',
    },
    {
      name: 'hitCount',
      type: 'number',
      defaultValue: 0,
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

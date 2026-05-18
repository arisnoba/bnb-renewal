import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { adminRow } from './shared'

export const Histories: CollectionConfig = {
  slug: 'histories',
  labels: {
    plural: '연혁',
    singular: '연혁',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['year', 'month', 'title', 'displayOrder', 'updatedAt'],
    group: '회사정보',
    useAsTitle: 'title',
  },
  defaultSort: 'displayOrder',
  fields: [
    adminRow([
      {
        name: 'year',
        type: 'number',
        label: '연도',
        required: true,
        admin: {
          width: '50%',
        },
      },
      {
        name: 'month',
        type: 'number',
        label: '월',
        required: true,
        admin: {
          width: '50%',
        },
      },
    ]),
    {
      name: 'title',
      type: 'text',
      label: '내용',
      required: true,
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: '정렬',
      defaultValue: 0,
    },
  ],
}

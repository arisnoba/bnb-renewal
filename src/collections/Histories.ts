import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { sharedAdminContentWarning } from './shared'

const normalizeHistory: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const year = Number(data.year)

  if (!Number.isFinite(year)) {
    return data
  }

  return {
    ...data,
    title: `${year}년`,
  }
}

const defaultHistoryMonths = () => [
  {
    month: 1,
    items: [
      {
        title: '',
      },
    ],
  },
]

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
    defaultColumns: ['title', 'year', 'updatedAt'],
    description: sharedAdminContentWarning,
    group: '회사정보',
    useAsTitle: 'title',
  },
  defaultSort: 'year',
  hooks: {
    beforeValidate: [normalizeHistory],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '제목',
      required: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'year',
      type: 'number',
      label: '연도',
      required: true,
      unique: true,
    },
    {
      name: 'months',
      type: 'array',
      label: '월별 연혁',
      defaultValue: defaultHistoryMonths,
      labels: {
        plural: '월별 연혁',
        singular: '월별 연혁',
      },
      minRows: 1,
      admin: {
        components: {
          RowLabel: '@/components/payload/HistoryMonthRowLabel#HistoryMonthRowLabel',
        },
        initCollapsed: false,
      },
      fields: [
        {
          name: 'month',
          type: 'number',
          label: '월',
          required: true,
        },
        {
          name: 'items',
          type: 'array',
          label: '항목',
          defaultValue: [
            {
              title: '',
            },
          ],
          labels: {
            plural: '항목',
            singular: '항목',
          },
          minRows: 1,
          admin: {
            components: {
              RowLabel:
                '@/components/payload/HistoryMonthItemRowLabel#HistoryMonthItemRowLabel',
            },
            initCollapsed: false,
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              label: '내용',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

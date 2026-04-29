import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { adminDateConfig } from './shared'

export const Directings: CollectionConfig = {
  slug: 'directings',
  labels: {
    plural: '연출',
    singular: '연출',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'category', 'productionMeta', 'publishedAt', 'updatedAt'],
    group: '레거시 콘텐츠',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
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
      name: 'category',
      type: 'text',
    },
    {
      name: 'productionMeta',
      type: 'textarea',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'authorName',
      type: 'text',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '발행일',
      admin: adminDateConfig,
    },
    {
      name: 'displayStatus',
      type: 'select',
      label: '상태',
      defaultValue: 'archived',
      options: [
        { label: '임시저장', value: 'draft' },
        { label: '공개', value: 'published' },
        { label: '비공개', value: 'archived' },
      ],
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

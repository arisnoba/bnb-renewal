import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const Dramas: CollectionConfig = {
  slug: 'dramas',
  labels: {
    plural: '드라마',
    singular: '드라마',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'actorLabel', 'projectTitle', 'roleName', 'publishedAt', 'updatedAt'],
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
      name: 'actorLabel',
      type: 'text',
    },
    {
      name: 'className',
      type: 'text',
    },
    {
      name: 'projectTitle',
      type: 'text',
    },
    {
      name: 'roleName',
      type: 'text',
    },
    {
      name: 'airDateLabel',
      type: 'text',
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
    },
    {
      name: 'displayStatus',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: '임시저장', value: 'draft' },
        { label: '공개', value: 'published' },
        { label: '보관', value: 'archived' },
      ],
      required: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
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

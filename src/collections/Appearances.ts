import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const Appearances: CollectionConfig = {
  slug: 'appearances',
  labels: {
    plural: '출연',
    singular: '출연',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'broadcaster', 'projectStatus', 'publishedAt', 'updatedAt'],
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
      name: 'broadcaster',
      type: 'text',
    },
    {
      name: 'productionCompany',
      type: 'text',
    },
    {
      name: 'director',
      type: 'text',
    },
    {
      name: 'writer',
      type: 'text',
    },
    {
      name: 'projectStatus',
      type: 'text',
    },
    {
      name: 'lineupType',
      type: 'text',
    },
    {
      name: 'castListLabel',
      type: 'text',
    },
    {
      name: 'castNames',
      type: 'textarea',
    },
    {
      name: 'castRoles',
      type: 'textarea',
    },
    {
      name: 'episodeInfo',
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

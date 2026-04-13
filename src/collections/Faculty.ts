import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

const centerOptions = [
  { label: '전체', value: 'all' },
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '애비뉴센터', value: 'avenue' },
  { label: '미분류', value: 'unknown' },
]

export const Faculty: CollectionConfig = {
  slug: 'faculty',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['name', 'center', 'displayOrder', 'updatedAt'],
    useAsTitle: 'name',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
    },
    {
      name: 'center',
      type: 'select',
      defaultValue: 'unknown',
      options: centerOptions,
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'bioHtml',
      type: 'textarea',
      required: true,
    },
    {
      name: 'profileImagePath',
      type: 'text',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'status',
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
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

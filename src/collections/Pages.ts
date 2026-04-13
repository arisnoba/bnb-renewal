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

const pageTypeOptions = [
  { label: '일반', value: 'general' },
  { label: '소개', value: 'about' },
  { label: '안내', value: 'guide' },
  { label: '정책', value: 'policy' },
  { label: '위치', value: 'location' },
  { label: '시설', value: 'facility' },
  { label: '프로그램', value: 'program' },
]

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'center', 'pageType', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'sourceTable',
      type: 'text',
      required: true,
    },
    {
      name: 'sourceKey',
      type: 'text',
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
      name: 'center',
      type: 'select',
      defaultValue: 'all',
      options: centerOptions,
      required: true,
    },
    {
      name: 'pageType',
      type: 'select',
      defaultValue: 'general',
      options: pageTypeOptions,
      required: true,
    },
    {
      name: 'html',
      type: 'textarea',
      required: true,
    },
    {
      name: 'mobileHtml',
      type: 'textarea',
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'isHtml',
      type: 'checkbox',
      defaultValue: true,
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

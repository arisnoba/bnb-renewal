import type { Field } from 'payload'

export const adminDateConfig = {
  date: {
    displayFormat: 'yy.MM.dd HH:mm',
    pickerAppearance: 'dayAndTime' as const,
  },
}

export const systemDateFields: Field[] = [
  {
    name: 'createdAtLabel',
    type: 'ui',
    label: '등록일',
    admin: {
      components: {
        Cell: '/components/payload/FormattedDateCell#FormattedDateCell',
        Field: '/components/payload/FormattedDateUIField#FormattedDateUIField',
      },
      custom: {
        sourceField: 'createdAt',
      },
      disableListColumn: false,
      position: 'sidebar',
    },
  },
  {
    name: 'updatedAtLabel',
    type: 'ui',
    label: '수정일',
    admin: {
      components: {
        Cell: '/components/payload/FormattedDateCell#FormattedDateCell',
        Field: '/components/payload/FormattedDateUIField#FormattedDateUIField',
      },
      custom: {
        sourceField: 'updatedAt',
      },
      disableListColumn: false,
      position: 'sidebar',
    },
  },
]

export const centerOptions = [
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'exam' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '애비뉴센터', value: 'avenue' },
  { label: '전체', value: 'all' },
  { label: '미분류', value: 'unknown' },
]

export const displayStatusOptions = [
  { label: '임시저장', value: 'draft' },
  { label: '공개', value: 'published' },
  { label: '보관', value: 'archived' },
]

export const centersField: Field = {
  name: 'centers',
  type: 'select',
  defaultValue: ['unknown'],
  hasMany: true,
  options: centerOptions,
  required: true,
}

export const sourceFields: Field[] = [
  {
    name: 'sourceDb',
    type: 'text',
    required: true,
  },
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
]

export const publishingFields: Field[] = [
  {
    name: 'publishedAt',
    type: 'date',
    admin: adminDateConfig,
  },
  {
    name: 'isPublic',
    type: 'checkbox',
    defaultValue: true,
  },
  {
    name: 'displayStatus',
    type: 'select',
    defaultValue: 'published',
    options: displayStatusOptions,
    required: true,
  },
]

export const legacyMetaField: Field = {
  name: 'legacyMeta',
  type: 'json',
}

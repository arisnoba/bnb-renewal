import type { Field } from 'payload'

export const adminDateConfig = {
  date: {
    displayFormat: 'yy.MM.dd HH:mm',
    pickerAppearance: 'dayAndTime' as const,
  },
}

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
  label: '센터',
  defaultValue: ['unknown'],
  hasMany: true,
  options: centerOptions,
  required: true,
}

export const sourceFields: Field[] = [
  {
    name: 'sourceDb',
    type: 'text',
    label: '원본 DB',
    required: true,
  },
  {
    name: 'sourceTable',
    type: 'text',
    label: '원본 테이블',
    required: true,
  },
  {
    name: 'sourceId',
    type: 'number',
    label: '원본 ID',
    required: true,
  },
  {
    name: 'slug',
    type: 'text',
    label: '슬러그',
    required: true,
    unique: true,
  },
]

export const publishingFields: Field[] = [
  {
    name: 'publishedAt',
    type: 'date',
    label: '발행일',
    admin: adminDateConfig,
  },
  {
    name: 'isPublic',
    type: 'checkbox',
    label: '공개 여부',
    defaultValue: true,
  },
  {
    name: 'displayStatus',
    type: 'select',
    label: '노출 상태',
    defaultValue: 'published',
    options: displayStatusOptions,
    required: true,
  },
]

export const legacyMetaField: Field = {
  name: 'legacyMeta',
  type: 'json',
  label: '레거시 메타',
}

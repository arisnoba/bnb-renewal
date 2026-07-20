import type { CollectionConfig, Validate } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import { sharedAdminContentWarning } from './shared'

const requiredText =
  (message: string): Validate<unknown> =>
  (value) => {
    return typeof value === 'string' && value.trim() ? true : message
  }

const requiredImages: Validate<unknown> = (value) => {
  return Array.isArray(value) && value.length > 0
    ? true
    : '강의실 사진을 한 장 이상 업로드해야 합니다.'
}

export const Classrooms: CollectionConfig = {
  slug: 'classrooms',
  labels: {
    plural: '강의실 설정',
    singular: '강의실 설정',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'photos', 'updatedAt'],
    description: sharedAdminContentWarning,
    group: '교육',
    useAsTitle: 'title',
  },
  defaultSort: 'title',
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([{ path: 'photos.*', role: 'classrooms.photo' }]),
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '강의실명',
      validate: requiredText('강의실명을 입력해야 합니다.'),
    },
    {
      name: 'photos',
      type: 'upload',
      label: '강의실 사진',
      relationTo: 'media',
      hasMany: true,
      validate: requiredImages,
      admin: {
        description: '여러 이미지를 한 번에 업로드할 수 있습니다.',
      },
    },
  ],
}

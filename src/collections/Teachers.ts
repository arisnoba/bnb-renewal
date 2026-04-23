import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { centersField, legacyMetaField, sourceFields } from './shared'

export const Teachers: CollectionConfig = {
  slug: 'teachers',
  labels: {
    plural: '강사진',
    singular: '강사',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['name', 'centers', 'displayOrder', 'updatedAt'],
    group: '교육',
    useAsTitle: 'name',
  },
  defaultSort: 'displayOrder',
  fields: [
    ...sourceFields,
    {
      name: 'name',
      type: 'text',
      label: '이름',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      label: '직함',
    },
    centersField,
    {
      name: 'summary',
      type: 'textarea',
      label: '요약',
    },
    {
      name: 'bioHtml',
      type: 'textarea',
      label: '소개',
      required: true,
    },
    {
      name: 'profileImagePath',
      type: 'text',
      label: '프로필 이미지',
    },
    {
      name: 'photoImage1',
      type: 'text',
    },
    {
      name: 'photoImage2',
      type: 'text',
    },
    {
      name: 'photoImage3',
      type: 'text',
    },
    {
      name: 'photoImage4',
      type: 'text',
    },
    {
      name: 'photoImage5',
      type: 'text',
    },
    {
      name: 'photoImage6',
      type: 'text',
    },
    {
      name: 'gallery',
      type: 'array',
      label: '갤러리',
      fields: [
        {
          name: 'path',
          type: 'text',
          label: '경로',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          label: '제목',
        },
        {
          name: 'description',
          type: 'text',
          label: '설명',
        },
      ],
    },
    {
      name: 'representativeWorks',
      type: 'array',
      label: '대표작',
      admin: {
        description: '강사 등록/수정 시 함께 관리하는 대표작 목록입니다.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: '제목',
        },
        {
          name: 'posterPath',
          type: 'text',
          label: '포스터 경로',
        },
        {
          name: 'description',
          type: 'text',
          label: '설명',
        },
        {
          name: 'displayOrder',
          type: 'number',
          label: '정렬순서',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: '정렬순서',
      defaultValue: 0,
    },
    {
      name: 'status',
      type: 'select',
      label: '상태',
      defaultValue: 'published',
      options: [
        { label: '임시저장', value: 'draft' },
        { label: '공개', value: 'published' },
        { label: '보관', value: 'archived' },
      ],
      required: true,
    },
    legacyMetaField,
  ],
}

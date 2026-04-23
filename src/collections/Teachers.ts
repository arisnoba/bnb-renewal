import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { centersField, legacyMetaField, sourceFields, systemDateFields } from './shared'

export const Teachers: CollectionConfig = {
  slug: 'teachers',
  labels: {
    plural: 'Teachers',
    singular: 'Teacher',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['name', 'centers', 'displayOrder', 'updatedAtLabel'],
    group: '교육',
    useAsTitle: 'name',
  },
  defaultSort: 'displayOrder',
  fields: [
    ...sourceFields,
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
    },
    centersField,
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
      name: 'representativeWorks',
      type: 'array',
      admin: {
        description: '강사 등록/수정 시 함께 관리하는 대표작 목록입니다.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'posterPath',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'displayOrder',
          type: 'number',
          defaultValue: 0,
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
    ...systemDateFields,
    legacyMetaField,
  ],
}

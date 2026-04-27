import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { imagePathField, legacyMetaField, sourceFields } from './shared'

export const TeacherFilmographies: CollectionConfig = {
  slug: 'teacher-filmographies',
  labels: {
    plural: '강사 대표작',
    singular: '강사 대표작',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: [
      'title',
      'resolvedTeacherName',
      'displayOrder',
      'updatedAt',
    ],
    group: '교육',
    useAsTitle: 'title',
  },
  defaultSort: 'displayOrder',
  fields: [
    ...sourceFields,
    {
      name: 'teacherSourceId',
      type: 'number',
      required: true,
    },
    {
      name: 'resolvedTeacherId',
      type: 'number',
    },
    {
      name: 'resolvedTeacherSlug',
      type: 'text',
    },
    {
      name: 'resolvedTeacherName',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
    },
    imagePathField('posterPath', '포스터 이미지'),
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    legacyMetaField,
  ],
}

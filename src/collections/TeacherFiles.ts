import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const TeacherFiles: CollectionConfig = {
  slug: 'teacher-files',
  labels: {
    plural: '강사 첨부파일',
    singular: '강사 첨부파일',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'teacherSourceId', 'displayOrder', 'updatedAt'],
    group: '레거시 콘텐츠',
    useAsTitle: 'title',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'teacherSourceId',
      type: 'number',
    },
    {
      name: 'filePath',
      type: 'text',
    },
    {
      name: 'descriptionHtml',
      type: 'textarea',
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { legacyMetaField, sourceFields } from './shared'

export const Curriculums: CollectionConfig = {
  slug: 'curriculums',
  labels: {
    plural: '커리큘럼',
    singular: '커리큘럼',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['teacherName', 'category', 'updatedAt'],
    group: '교육/강사진',
    useAsTitle: 'teacherName',
  },
  fields: [
    ...sourceFields,
    {
      name: 'category',
      type: 'text',
      label: '분류',
    },
    {
      name: 'teacherName',
      type: 'text',
      label: '강사명',
    },
    {
      name: 'resolvedTeacherId',
      type: 'number',
      label: '연결된 강사 ID',
    },
    {
      name: 'resolvedTeacherSlug',
      type: 'text',
      label: '연결된 강사 슬러그',
    },
    {
      name: 'subject',
      type: 'textarea',
      label: '주제',
    },
    {
      name: 'titleRaw',
      type: 'textarea',
      label: '원본 제목',
    },
    {
      name: 'contentRaw',
      type: 'textarea',
      label: '원본 내용',
    },
    legacyMetaField,
  ],
}

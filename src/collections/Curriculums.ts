import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { legacyMetaField, sourceFields, systemDateFields } from './shared'

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
    defaultColumns: ['teacherName', 'category', 'updatedAtLabel'],
    group: '교육/강사진',
    useAsTitle: 'teacherName',
  },
  fields: [
    ...sourceFields,
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'teacherName',
      type: 'text',
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
      name: 'subject',
      type: 'textarea',
    },
    {
      name: 'titleRaw',
      type: 'textarea',
    },
    {
      name: 'contentRaw',
      type: 'textarea',
    },
    ...systemDateFields,
    legacyMetaField,
  ],
}

import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { legacyMetaField } from './shared'

export const ExamSchoolLogos: CollectionConfig = {
  slug: 'exam-school-logos',
  labels: {
    plural: '합격 학교 로고',
    singular: '합격 학교 로고',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['schoolName', 'reviewCount', 'updatedAt'],
    group: '후기/합격',
    useAsTitle: 'schoolName',
  },
  defaultSort: 'schoolName',
  fields: [
    { name: 'schoolName', type: 'text', required: true },
    { name: 'schoolSlug', type: 'text', required: true, unique: true },
    { name: 'logoPath', type: 'text', required: true },
    { name: 'logoOriginalName', type: 'text' },
    { name: 'logoFile', type: 'text', required: true },
    { name: 'logoWidth', type: 'number' },
    { name: 'logoHeight', type: 'number' },
    { name: 'reviewCount', type: 'number', defaultValue: 0 },
    legacyMetaField,
  ],
}

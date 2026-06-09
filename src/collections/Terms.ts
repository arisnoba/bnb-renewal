import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { newsBodyEditor } from './News'

const legalDocumentTypeLabels = {
  privacy: '개인정보처리방침',
  terms: '이용약관',
} as const

type LegalDocumentType = keyof typeof legalDocumentTypeLabels

const normalizeLegalDocument: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const documentType = data.documentType as LegalDocumentType | undefined

  if (!documentType || !(documentType in legalDocumentTypeLabels)) {
    return data
  }

  return {
    ...data,
    title: data.title || legalDocumentTypeLabels[documentType],
  }
}

export const Terms: CollectionConfig = {
  slug: 'terms',
  labels: {
    plural: '약관',
    singular: '약관',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'documentType', 'effectiveDate', 'updatedAt'],
    group: '회사정보',
    useAsTitle: 'title',
  },
  defaultSort: 'documentType',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '제목',
      required: true,
    },
    {
      name: 'documentType',
      type: 'select',
      label: '문서 유형',
      options: [
        { label: '개인정보처리방침', value: 'privacy' },
        { label: '이용약관', value: 'terms' },
      ],
      required: true,
      unique: true,
    },
    {
      name: 'effectiveDate',
      type: 'date',
      label: '시행일',
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd',
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: newsBodyEditor,
      label: '본문',
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [normalizeLegalDocument],
  },
  versions: {
    maxPerDoc: 20,
  },
}

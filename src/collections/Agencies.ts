import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import { centersField, legacyMetaField, sourceFields, systemDateFields } from './shared'

export const Agencies: CollectionConfig = {
  slug: 'agencies',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['subject', 'name', 'centers', 'displayOrder', 'updatedAtLabel'],
    group: '엔터테인먼트',
    useAsTitle: 'subject',
  },
  defaultSort: 'displayOrder',
  fields: [
    ...sourceFields,
    centersField,
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
    },
    {
      name: 'profileImagePath',
      type: 'text',
    },
    {
      name: 'actors',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'generation',
          type: 'text',
        },
        {
          name: 'profileImagePath',
          type: 'text',
        },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
    },
    ...systemDateFields,
    legacyMetaField,
  ],
}

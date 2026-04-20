import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'

export const Agencies: CollectionConfig = {
  slug: 'agencies',
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['subject', 'name', 'displayOrder', 'updatedAt'],
    useAsTitle: 'subject',
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
    {
      name: 'legacyMeta',
      type: 'json',
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  adminDateConfig,
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const AuditionSchedules: CollectionConfig = {
  slug: 'audition-schedules',
  labels: {
    plural: '오디션 일정',
    singular: '오디션 일정',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'centers', 'eventType', 'scheduleStartDate', 'updatedAt'],
    group: '캐스팅/오디션',
    useAsTitle: 'title',
  },
  defaultSort: '-scheduleStartDate',
  fields: [
    ...sourceFields,
    {
      name: 'dedupeKey',
      type: 'text',
      required: true,
      unique: true,
    },
    centersField,
    {
      name: 'eventType',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'bodyHtml',
      type: 'textarea',
    },
    {
      name: 'scheduleStartDate',
      type: 'date',
      admin: adminDateConfig,
      required: true,
    },
    {
      name: 'scheduleEndDate',
      type: 'date',
      admin: adminDateConfig,
      required: true,
    },
    {
      name: 'scheduleStartRaw',
      type: 'text',
      required: true,
    },
    {
      name: 'scheduleEndRaw',
      type: 'text',
      required: true,
    },
    {
      name: 'authorName',
      type: 'text',
    },
    ...publishingFields,
    legacyMetaField,
  ],
}

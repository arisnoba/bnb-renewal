import type { CollectionConfig } from 'payload'

import { allowAll, loggedInOnly } from './access'
import {
  centersField,
  legacyMetaField,
  publishingFields,
  sourceFields,
} from './shared'

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    plural: '뉴스',
    singular: '뉴스',
  },
  access: {
    create: loggedInOnly,
    delete: loggedInOnly,
    read: allowAll,
    update: loggedInOnly,
  },
  admin: {
    defaultColumns: ['title', 'centers', 'category', 'publishedAt', 'updatedAt'],
    group: '운영/소식',
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  fields: [
    ...sourceFields,
    {
      name: 'title',
      type: 'text',
      label: '제목',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
      label: '분류',
    },
    centersField,
    {
      name: 'bodyHtml',
      type: 'textarea',
      label: '본문',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: '요약',
    },
    {
      name: 'thumbnailPath',
      type: 'text',
      label: '썸네일 경로',
    },
    {
      name: 'authorName',
      type: 'text',
      label: '작성자명',
    },
    ...publishingFields,
    {
      name: 'viewCount',
      type: 'number',
      label: '조회수',
      defaultValue: 0,
    },
    legacyMetaField,
  ],
}

import type { CollectionConfig } from 'payload'

import { createKoreanSlugifyWithFallback } from '../utilities/koreanSlugify'
import { centerScopedCollectionAccess } from './access'
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  sidebarFields,
  slugField,
} from './shared'
import { newsBodyEditor } from './News'

const starCardSlugify = createKoreanSlugifyWithFallback('star-card')

export const StarCards: CollectionConfig = {
  slug: 'star-cards',
  labels: {
    plural: '스타카드 제휴업체',
    singular: '스타카드 제휴업체',
  },
  access: centerScopedCollectionAccess,
  admin: {
    defaultColumns: [
      'title',
      'centers',
      'displayOrder',
      'displayStatus',
      'updatedAt',
    ],
    group: '운영/소식',
    useAsTitle: 'title',
  },
  defaultSort: 'displayOrder',
  hooks: {
    beforeValidate: [centerScopedBeforeValidate],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '업체명',
      required: true,
    },
    ...adminTabs([
      {
        label: '콘텐츠',
        fields: [
          adminRow([
            {
              name: 'mapUrl',
              type: 'text',
              label: '지도/외부 링크',
              admin: {
                width: '50%',
              },
            },
          ]),
          {
            name: 'body',
            type: 'richText',
            editor: newsBodyEditor,
            label: '본문',
          },
        ],
      },
      {
        label: '이미지',
        fields: [
          {
            name: 'logoMedia',
            type: 'upload',
            label: '대표 이미지',
            relationTo: 'media',
          },
          {
            name: 'bodyImages',
            type: 'array',
            label: '본문 이미지',
            labels: {
              plural: '본문 이미지',
              singular: '본문 이미지',
            },
            admin: {
              components: {
                Field:
                  '@/components/payload/StarCardBodyImagesField#StarCardBodyImagesField',
                RowLabel:
                  '@/components/payload/StarCardBodyImageRowLabel#StarCardBodyImageRowLabel',
              },
              initCollapsed: true,
            },
            fields: [
              {
                name: 'imageMedia',
                type: 'upload',
                label: '이미지',
                relationTo: 'media',
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      centersField,
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'published',
        options: displayStatusOptions,
      },
      {
        name: 'displayOrder',
        type: 'number',
        label: '정렬',
        defaultValue: 0,
      },
      publishedAtField,
      authorNameField,
    ]),
    slugField({
      slugify: starCardSlugify,
    }),
  ],
}

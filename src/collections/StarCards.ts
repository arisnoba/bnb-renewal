import type { CollectionConfig, SelectField, Validate } from 'payload'

import { centerScopedPublishedCollectionAccess } from './access'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import {
  adminRow,
  adminTabs,
  authorNameField,
  centerScopedBeforeValidate,
  centersField,
  displayStatusOptions,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
} from './shared'
import { newsBodyEditor } from './News'
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from './slugUtils'

const validateStarCardImages: Validate<unknown[] | null | undefined> = (value) => {
  const rows = Array.isArray(value) ? value : []
  const hasImage = rows.some((row) => {
    if (!row || typeof row !== 'object') {
      return false
    }

    return Boolean((row as { imageMedia?: unknown }).imageMedia)
  })

  return hasImage ? true : '이미지를 하나 이상 등록해야 합니다.'
}

const validateStarCardImageMedia: Validate<unknown> = (value) => {
  return value ? true : '이미지를 선택해야 합니다.'
}

const starCardCentersField: SelectField = {
  ...(centersField as SelectField),
  defaultValue: ['all'],
}

const starCardCategoryOptions = [
  { label: '헬스', value: 'health' },
  { label: '프로필', value: 'profile' },
  { label: '메디컬', value: 'medical' },
  { label: '헤어&메이크업', value: 'hairMakeup' },
  { label: '뷰티', value: 'beauty' },
  { label: '카페', value: 'cafe' },
]

const validateStarCardCategory: Validate<unknown> = (value) => {
  return value ? true : '분류를 선택해야 합니다.'
}

const setStarCardSlug = createIdSlugBeforeValidate()
const finalizeStarCardSlugAfterCreate = createFinalizeIdSlugAfterCreate('star-cards')

export const StarCards: CollectionConfig = {
  slug: 'star-cards',
  labels: {
    plural: '스타카드 제휴업체',
    singular: '스타카드 제휴업체',
  },
  access: centerScopedPublishedCollectionAccess,
  admin: {
    defaultColumns: [
      'title',
      'category',
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
    afterChange: [
      finalizeStarCardSlugAfterCreate,
      normalizeUploadedMediaPrefixes([
        { path: 'bodyImages.*.imageMedia', role: 'star-cards.image' },
      ]),
    ],
    beforeValidate: [centerScopedBeforeValidate, setStarCardSlug],
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
              name: 'category',
              type: 'select',
              label: '분류',
              options: starCardCategoryOptions,
              validate: validateStarCardCategory,
              admin: {
                className: 'bnb-admin-required-field',
                width: '33%',
              },
            },
            {
              name: 'mapUrl',
              type: 'text',
              label: '지도/외부 링크',
              admin: {
                width: '33%',
              },
            },
            {
              name: 'discountRate',
              type: 'text',
              label: '할인율',
              admin: {
                width: '33%',
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
            name: 'bodyImages',
            type: 'array',
            label: '이미지',
            minRows: 1,
            validate: validateStarCardImages,
            labels: {
              plural: '이미지',
              singular: '이미지',
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
                validate: validateStarCardImageMedia,
                admin: {
                  className: 'bnb-admin-required-field',
                },
              },
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      starCardCentersField,
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'published',
        options: displayStatusOptions,
        admin: publishingStatusSelectAdmin(),
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
    idSlugField,
  ],
}

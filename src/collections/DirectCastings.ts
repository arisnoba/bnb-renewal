import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { createKoreanSlugifyWithFallback } from '../utilities/koreanSlugify'
import {
  adminRow,
  adminTabs,
  authorNameField,
  displayStatusOptions,
  imagePathField,
  isGlobalAdminUser,
  publishedAtField,
  sidebarFields,
  userCenterValue,
} from './shared'
import { newsBodyEditor } from './News'

const directCastingSlugify = createKoreanSlugifyWithFallback('direct-casting')

const companyOptions = [
  { label: '유캐스팅', value: 'ucasting' },
  { label: 'IMGround', value: 'imground' },
  { label: 'BNB캐스팅', value: 'bnb-casting' },
  { label: 'BX모델에이전시', value: 'bx-model-agency' },
]

const sourceCenterOptions = [
  { label: '아트센터', value: 'art' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
]

const nonExamAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  return Boolean(center && center !== 'exam')
}

const isDirectCastingAdminMenuHidden = ({ user }: { user?: unknown }) => {
  if (!user || isGlobalAdminUser(user)) {
    return false
  }

  return userCenterValue(user) === 'exam'
}

const setDirectCastingAuthorName: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) {
    return data
  }

  if (req.user && !isGlobalAdminUser(req.user) && userCenterValue(req.user) === 'exam') {
    throw new Error('입시센터 계정은 다이렉트캐스팅을 관리할 수 없습니다.')
  }

  return {
    ...data,
    authorName: data.authorName ?? '배우앤배움 캐스팅/오디션',
  }
}

export const DirectCastings: CollectionConfig = {
  slug: 'direct-castings',
  labels: {
    plural: '다이렉트캐스팅',
    singular: '다이렉트캐스팅',
  },
  access: {
    create: nonExamAccess,
    delete: nonExamAccess,
    read: nonExamAccess,
    update: nonExamAccess,
  },
  admin: {
    defaultColumns: [
      'title',
      'company',
      'sourceCenter',
      'yearLabel',
      'displayStatus',
      'updatedAt',
    ],
    group: '캐스팅/오디션',
    hidden: isDirectCastingAdminMenuHidden,
    useAsTitle: 'title',
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeValidate: [setDirectCastingAuthorName],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '작품/항목명',
      required: true,
    },
    ...adminTabs([
      {
        label: '작품 정보',
        fields: [
          adminRow([
            {
              name: 'company',
              type: 'select',
              label: '회사명',
              options: companyOptions,
              required: true,
            },
            {
              name: 'sourceCenter',
              type: 'select',
              label: '원본 센터',
              options: sourceCenterOptions,
              required: true,
            },
          ]),
          adminRow([
            {
              name: 'yearLabel',
              type: 'text',
              label: '연도',
            },
            {
              name: 'projectInfo',
              type: 'textarea',
              label: '작품 정보',
            },
          ]),
          imagePathField('thumbnailPath', '대표 이미지'),
          {
            name: 'body',
            type: 'richText',
            editor: newsBodyEditor,
            label: '본문',
          },
        ],
      },
      {
        label: '연도별 이력',
        fields: [
          {
            name: 'workItems',
            type: 'array',
            label: '이력',
            labels: {
              plural: '이력',
              singular: '이력',
            },
            admin: {
              components: {
                RowLabel:
                  '@/components/payload/DirectCastingWorkItemRowLabel#DirectCastingWorkItemRowLabel',
              },
              initCollapsed: true,
            },
            fields: [
              adminRow([
                {
                  name: 'year',
                  type: 'text',
                  label: '연도',
                  required: true,
                  admin: {
                    width: '25%',
                  },
                },
                {
                  name: 'content',
                  type: 'textarea',
                  label: '내용',
                  required: true,
                  admin: {
                    width: '75%',
                  },
                },
              ]),
            ],
          },
        ],
      },
    ]),
    ...sidebarFields([
      {
        name: 'displayStatus',
        type: 'select',
        label: '상태',
        defaultValue: 'published',
        options: displayStatusOptions,
      },
      publishedAtField,
      authorNameField,
    ]),
    slugField({
      slugify: directCastingSlugify,
    }),
    {
      name: 'sourceDb',
      type: 'text',
      label: '원본 DB',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'sourceTable',
      type: 'text',
      label: '원본 테이블',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'sourceId',
      type: 'number',
      label: '원본 ID',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'legacyMeta',
      type: 'json',
      label: '레거시 메타',
      admin: {
        hidden: true,
      },
    },
  ],
}

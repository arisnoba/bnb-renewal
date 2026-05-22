import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { createKoreanSlugifyWithFallback } from '../utilities/koreanSlugify'
import {
  adminRow,
  adminTabs,
  authorNameFromCenters,
  authorNameField,
  displayStatusOptions,
  isGlobalAdminUser,
  publishedAtField,
  sidebarFields,
  slugField,
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

const directCastingCenterValues = new Set(sourceCenterOptions.map((option) => option.value))

const nonExamAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  if (!center || center === 'exam') {
    return false
  }

  return {
    centers: {
      contains: center,
    },
  }
}

const nonExamCreateAccess: Access = ({ req }) => {
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

const setDirectCastingAuthorName: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data) {
    return data
  }

  const center = userCenterValue(req.user)

  if (req.user && !isGlobalAdminUser(req.user) && center === 'exam') {
    throw new Error('입시센터 계정은 다이렉트캐스팅을 관리할 수 없습니다.')
  }

  const originalCenters =
    originalDoc && typeof originalDoc === 'object'
      ? (originalDoc as { centers?: unknown }).centers
      : undefined
  const centers = normalizeDirectCastingCenters(
    isGlobalAdminUser(req.user)
      ? data.centers ?? originalCenters
      : originalCenters ?? (center ? [center] : data.centers),
  )

  return {
    ...data,
    centers,
    authorName: data.authorName ?? authorNameFromCenters(centers),
  }
}

function normalizeDirectCastingCenters(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const centers = values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

  if (centers.length === 0) {
    throw new Error('센터를 선택해야 합니다.')
  }

  const invalidCenter = centers.find((center) => !directCastingCenterValues.has(center))

  if (invalidCenter) {
    throw new Error(`다이렉트캐스팅에서 지원하지 않는 센터 값입니다: ${invalidCenter}`)
  }

  return Array.from(new Set(centers))
}

export const DirectCastings: CollectionConfig = {
  slug: 'direct-castings',
  labels: {
    plural: '다이렉트캐스팅',
    singular: '다이렉트캐스팅',
  },
  access: {
    create: nonExamCreateAccess,
    delete: nonExamAccess,
    read: nonExamAccess,
    update: nonExamAccess,
  },
  admin: {
    defaultColumns: [
      'title',
      'company',
      'centers',
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
              admin: {
                width: '50%',
              },
            },
            {
              name: 'centers',
              type: 'select',
              label: '노출 센터',
              hasMany: true,
              options: sourceCenterOptions,
              required: true,
              admin: {
                width: '50%',
              },
            },
          ]),
          adminRow([
            {
              name: 'yearLabel',
              type: 'text',
              label: '연도',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'projectInfo',
              type: 'textarea',
              label: '작품 정보',
              admin: {
                width: '50%',
              },
            },
          ]),
          adminRow([
            {
              name: 'thumbnailMedia',
              type: 'upload',
              label: '대표 이미지',
              relationTo: 'media',
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
  ],
}

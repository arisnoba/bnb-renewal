import type { Access, CollectionBeforeValidateHook, CollectionConfig, Validate } from 'payload'

import {
  adminRow,
  adminTabs,
  authorNameFromCenters,
  authorNameField,
  displayStatusOptions,
  isGlobalAdminUser,
  publishedAtField,
  publishingStatusSelectAdmin,
  sidebarFields,
  userCenterValue,
} from './shared'
import { newsBodyEditor } from './News'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import {
  createCenterRevalidationAfterChange,
  createCenterRevalidationAfterDelete,
} from './revalidateFrontend'
import {
  createFinalizeIdSlugAfterCreate,
  createIdSlugBeforeValidate,
  idSlugField,
} from './slugUtils'

const companyOptions = [
  { label: 'ARKO Lab', value: 'arko-lab' },
  { label: 'IMGround', value: 'imground' },
  { label: 'BNB Casting', value: 'bnb-casting' },
  { label: 'CNA Agency', value: 'cna-agency' },
  { label: 'BX Model Agency', value: 'bx-model-agency' },
]

const directCastingCompanyValues = new Set<string>(companyOptions.map((option) => option.value))

const sourceCenterOptions = [
  { label: '아트센터', value: 'art' },
  { label: '에비뉴센터', value: 'avenue' },
  { label: '키즈센터', value: 'kids' },
  { label: '하이틴센터', value: 'highteen' },
]

const directCastingCenterValues = new Set(sourceCenterOptions.map((option) => option.value))

const directCastingTitleAliases = new Map([
  ['JTBC 서른,아홉', 'JTBC 서른, 아홉'],
])

function normalizeDirectCastingBroadcastName(value: string) {
  return value
    .replace(/넷플릭스/g, 'Netflix')
    .replace(/\bnetflix\b/gi, 'Netflix')
    .replace(/\bnetfilx\b/gi, 'Netflix')
    .replace(/채널\s+A/g, '채널A')
    .replace(/coupang\s+play/gi, 'Coupang Play')
    .replace(/쿠팡플레이/g, 'Coupang Play')
    .replace(/카카오\s+TV/gi, 'KakaoTV')
}

function hasDirectCastingCenterValue(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values.some((item) => String(item ?? '').trim())
}

function normalizeDirectCastingCompanies(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const companies = values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

  if (companies.length === 0) {
    throw new Error('회사를 선택해야 합니다.')
  }

  const invalidCompany = companies.find((company) => !directCastingCompanyValues.has(company))

  if (invalidCompany) {
    throw new Error(`다이렉트캐스팅에서 지원하지 않는 회사 값입니다: ${invalidCompany}`)
  }

  return Array.from(new Set(companies))
}

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
  const rawCenters = isGlobalAdminUser(req.user)
    ? data.centers ?? originalCenters
    : originalCenters ?? (center ? [center] : data.centers)

  if (isGlobalAdminUser(req.user) && !hasDirectCastingCenterValue(rawCenters)) {
    return {
      ...data,
      centers: rawCenters,
      authorName: data.authorName,
    }
  }

  const centers = normalizeDirectCastingCenters(rawCenters)

  return {
    ...data,
    centers,
    authorName: data.authorName ?? authorNameFromCenters(centers),
  }
}

const setDirectCastingSlug = createIdSlugBeforeValidate()
const finalizeDirectCastingSlugAfterCreate = createFinalizeIdSlugAfterCreate('direct-castings')

const normalizeDirectCastingTitle: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data.title !== 'string') {
    return data
  }

  return {
    ...data,
    title: normalizeDirectCastingBroadcastName(
      directCastingTitleAliases.get(data.title.trim()) ?? data.title,
    ),
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

const validateDirectCastingCompanies: Validate<unknown> = (value) => {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const companies = values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

  if (companies.length === 0) {
    return '회사를 선택해야 합니다.'
  }

  const invalidCompany = companies.find((company) => !directCastingCompanyValues.has(company))

  return invalidCompany ? `다이렉트캐스팅에서 지원하지 않는 회사 값입니다: ${invalidCompany}` : true
}

const validateDirectCastingCenters: Validate<unknown> = (value) => {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const centers = values
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

  if (centers.length === 0) {
    return '노출 센터를 선택해야 합니다.'
  }

  const invalidCenter = centers.find((center) => !directCastingCenterValues.has(center))

  return invalidCenter ? `다이렉트캐스팅에서 지원하지 않는 센터 값입니다: ${invalidCenter}` : true
}

const revalidateDirectCastingAfterChange = createCenterRevalidationAfterChange({
  cacheTagPrefixes: ['frontend_direct_castings'],
  reason: 'direct casting',
  suffixes: ['direct-castings'],
})

const revalidateDirectCastingAfterDelete = createCenterRevalidationAfterDelete({
  cacheTagPrefixes: ['frontend_direct_castings'],
  reason: 'direct casting',
  suffixes: ['direct-castings'],
})

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
    afterChange: [
      finalizeDirectCastingSlugAfterCreate,
      revalidateDirectCastingAfterChange,
      normalizeUploadedMediaPrefixes([
        { path: 'thumbnailMedia', role: 'direct-castings.thumbnail' },
        { path: 'body', role: 'direct-castings.body-image', type: 'richText' },
      ]),
    ],
    afterDelete: [revalidateDirectCastingAfterDelete],
    beforeValidate: [
      setDirectCastingAuthorName,
      normalizeDirectCastingTitle,
      ({ data }) => {
        if (!data || typeof data.company === 'undefined') {
          return data
        }

        return {
          ...data,
          company: normalizeDirectCastingCompanies(data.company),
        }
      },
      setDirectCastingSlug,
    ],
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
              hasMany: true,
              options: companyOptions,
              validate: validateDirectCastingCompanies,
              admin: {
                className: 'bnb-admin-required-field',
                placeholder: '선택해 주세요',
                width: '50%',
              },
            },
            {
              name: 'centers',
              type: 'select',
              label: '노출 센터',
              hasMany: true,
              options: sourceCenterOptions,
              validate: validateDirectCastingCenters,
              admin: {
                className: 'bnb-admin-required-field',
                placeholder: '선택해 주세요',
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
        admin: publishingStatusSelectAdmin(),
      },
      publishedAtField,
      authorNameField,
    ]),
    idSlugField,
  ],
}

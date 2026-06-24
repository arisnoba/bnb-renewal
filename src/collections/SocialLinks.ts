import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
} from 'payload'

import { adminRow, centerOptions, displayStatusOptions, isGlobalAdminUser, userCenterValue } from './shared'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import { extractYouTubeVideoId } from '@/lib/youtube'

type SocialLinkData = {
  center?: unknown
  displayStatus?: unknown
  externalUrl?: unknown
  representativeImage?: unknown
  snsType?: unknown
}

type SocialLinkSnsType = 'instagram' | 'youtube'

const snsTypeOptions = [
  { label: '인스타그램', value: 'instagram' },
  { label: '유튜브', value: 'youtube' },
]

const requiredText =
  (message: string): Validate<unknown> =>
  (value) => {
    return typeof value === 'string' && value.trim() ? true : message
  }

const requiredValue =
  (message: string): Validate<unknown> =>
  (value) => {
    return value ? true : message
  }

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateHttpUrl(value: unknown, requiredMessage?: string) {
  const url = stringValue(value)

  if (!url) {
    return requiredMessage ?? true
  }

  try {
    const parsed = new URL(url)

    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? true
      : 'http:// 또는 https:// URL만 입력할 수 있습니다.'
  } catch {
    return 'http:// 또는 https:// URL만 입력할 수 있습니다.'
  }
}

function normalizeSnsType(value: unknown): SocialLinkSnsType | '' {
  if (value === 'instagram' || value === 'youtube') {
    return value
  }

  return ''
}

function isYoutubeSnsType(siblingData?: SocialLinkData) {
  return normalizeSnsType(siblingData?.snsType) === 'youtube'
}

const validateExternalUrl: Validate<unknown, unknown, SocialLinkData> = (value, { siblingData }) => {
  const urlResult = validateHttpUrl(value, 'SNS 링크를 입력해야 합니다.')

  if (urlResult !== true) {
    return urlResult
  }

  if (isYoutubeSnsType(siblingData) && !extractYouTubeVideoId(value)) {
    return '유효한 유튜브 링크를 입력해야 합니다.'
  }

  return true
}

const validateRepresentativeImage: Validate<unknown, unknown, SocialLinkData> = (
  value,
  { siblingData },
) => {
  if (isYoutubeSnsType(siblingData)) {
    return true
  }

  if (value) {
    return true
  }

  return '대표 이미지를 등록해야 합니다.'
}

const readAccess: Access = ({ req }) => {
  if (!req.user) {
    return true
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  return center
    ? {
        center: {
          equals: center,
        },
      }
    : false
}

const createAccess: Access = ({ req }) => {
  return Boolean(req.user && (isGlobalAdminUser(req.user) || userCenterValue(req.user)))
}

const centerAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  return center
    ? {
        center: {
          equals: center,
        },
      }
    : false
}

const normalizeSocialLinkData: CollectionBeforeValidateHook = ({ data, operation, originalDoc, req }) => {
  if (!data) {
    return data
  }

  const nextData = { ...data } as SocialLinkData
  const userCenter = userCenterValue(req.user)

  if (req.user && !isGlobalAdminUser(req.user)) {
    if (!userCenter) {
      throw new Error('관리자 계정에 유효한 센터가 없습니다.')
    }

    nextData.center = originalDoc?.center ?? userCenter
  }

  nextData.externalUrl = stringValue(nextData.externalUrl)
  nextData.snsType = normalizeSnsType(nextData.snsType)

  if (operation === 'create' && !stringValue(nextData.displayStatus)) {
    nextData.displayStatus = 'published'
  }

  return nextData
}

export const SocialLinks: CollectionConfig = {
  slug: 'social-links',
  labels: {
    plural: 'SNS 링크',
    singular: 'SNS 링크',
  },
  access: {
    create: createAccess,
    delete: centerAccess,
    read: readAccess,
    update: centerAccess,
  },
  admin: {
    defaultColumns: [
      'title',
      'center',
      'snsType',
      'externalUrl',
      'displayStatus',
      'createdAt',
      'updatedAt',
    ],
    group: '메인설정',
    useAsTitle: 'title',
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([
        { path: 'representativeImage', role: 'social-links.image' },
      ]),
    ],
    beforeValidate: [normalizeSocialLinkData],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '관리자 제목',
      validate: requiredText('관리자 제목을 입력해야 합니다.'),
    },
    adminRow([
      {
        name: 'center',
        type: 'select',
        label: '센터 선택',
        options: centerOptions,
        required: true,
        validate: requiredValue('센터를 선택해야 합니다.'),
      },
      {
        name: 'snsType',
        type: 'select',
        label: 'SNS 타입',
        options: snsTypeOptions,
        required: true,
        validate: requiredValue('SNS 타입을 선택해야 합니다.'),
      },
    ]),
    {
      name: 'externalUrl',
      type: 'text',
      label: 'SNS 링크',
      required: true,
      validate: validateExternalUrl,
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.snsType),
        description:
          '인스타그램은 게시물 URL, 유튜브는 영상 URL을 입력합니다.',
      },
    },
    {
      name: 'representativeImage',
      type: 'upload',
      label: '대표 이미지',
      relationTo: 'media',
      validate: validateRepresentativeImage,
      admin: {
        condition: (_data, siblingData) => siblingData?.snsType === 'instagram',
        description:
          '인스타그램 대표 이미지입니다.',
      },
    },
    {
      name: 'displayStatus',
      type: 'select',
      label: '상태',
      defaultValue: 'published',
      options: displayStatusOptions,
      validate: requiredValue('상태를 선택해야 합니다.'),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      index: true,
      label: '생성일',
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'imagePreview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/SocialLinkImagePreviewField#SocialLinkImagePreviewField',
        },
        condition: (_data, siblingData) => siblingData?.snsType === 'youtube',
        position: 'sidebar',
      },
    },
  ],
}

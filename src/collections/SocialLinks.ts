import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
} from 'payload'

import { centerOptions, displayStatusOptions, isGlobalAdminUser, userCenterValue } from './shared'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'
import { youtubeThumbnailUrl } from '@/lib/youtube'

type SocialLinkData = {
  center?: unknown
  displayStatus?: unknown
  externalUrl?: unknown
  representativeImage?: unknown
  representativeImageUrl?: unknown
}

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

const validateExternalUrl: Validate<unknown> = (value) => {
  return validateHttpUrl(value, '외부 링크를 입력해야 합니다.')
}

const validateRepresentativeImage: Validate<unknown, unknown, SocialLinkData> = (
  value,
  { siblingData },
) => {
  if (value || stringValue(siblingData?.representativeImageUrl)) {
    return true
  }

  if (youtubeThumbnailUrl(siblingData?.externalUrl)) {
    return true
  }

  return '대표 이미지를 업로드하거나 대표 이미지 URL을 입력해야 합니다.'
}

const validateRepresentativeImageUrlPresence: Validate<unknown, unknown, SocialLinkData> = (
  value,
  { siblingData },
) => {
  const urlResult = validateHttpUrl(value)

  if (urlResult !== true) {
    return urlResult
  }

  if (siblingData?.representativeImage || stringValue(value)) {
    return true
  }

  if (youtubeThumbnailUrl(siblingData?.externalUrl)) {
    return true
  }

  return '대표 이미지를 업로드하거나 대표 이미지 URL을 입력해야 합니다.'
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
  nextData.representativeImageUrl = stringValue(nextData.representativeImageUrl)

  if (operation === 'create' && !stringValue(nextData.displayStatus)) {
    nextData.displayStatus = 'published'
  }

  if (!nextData.representativeImage && !nextData.representativeImageUrl) {
    nextData.representativeImageUrl = youtubeThumbnailUrl(nextData.externalUrl)
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
      'representativeImageUrl',
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
    {
      name: 'center',
      type: 'select',
      label: '센터',
      defaultValue: ({ user }) => userCenterValue(user),
      options: centerOptions,
      validate: requiredValue('센터를 선택해야 합니다.'),
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: '외부 링크',
      validate: validateExternalUrl,
      admin: {
        description:
          '클릭 시 이동할 SNS 게시물 또는 영상 URL입니다. 유튜브 영상 URL은 대표 이미지가 없을 때 썸네일 URL을 자동으로 채웁니다.',
      },
    },
    {
      name: 'representativeImage',
      type: 'upload',
      label: '대표 이미지',
      relationTo: 'media',
      validate: validateRepresentativeImage,
      admin: {
        description:
          '가장 안정적인 방식입니다. 업로드 이미지가 있으면 대표 이미지 URL보다 우선 노출됩니다.',
      },
    },
    {
      name: 'representativeImageUrl',
      type: 'text',
      label: '대표 이미지 URL',
      validate: validateRepresentativeImageUrlPresence,
      admin: {
        description:
          '이미지 파일의 직접 URL을 입력합니다. 유튜브 영상 링크는 저장 시 썸네일 URL을 자동으로 채웁니다. 인스타그램 게시물 URL에서는 이미지를 안정적으로 가져오기 어려우므로 이미지 URL을 직접 입력하거나 파일을 업로드해 주세요.',
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
      name: 'imagePreview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/SocialLinkImagePreviewField#SocialLinkImagePreviewField',
        },
        position: 'sidebar',
      },
    },
  ],
}

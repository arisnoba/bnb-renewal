import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
  Where,
} from 'payload'

import { centerOptions, isGlobalAdminUser, userCenterValue } from './shared'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'

type MainBannerData = {
  center?: unknown
  publishStartAt?: unknown
  useReservation?: unknown
}

const statusOptions = [
  { label: '임시저장', value: 'draft' },
  { label: '공개', value: 'published' },
]

const centerValues = new Set(centerOptions.map((option) => option.value))

const allowRead: Access = () => true

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

const requiredWhenReserved =
  (message: string): Validate<unknown, unknown, MainBannerData> =>
  (value, { siblingData }) => {
    return siblingData?.useReservation && !value ? message : true
  }

function dateValue(value: unknown) {
  if (!value) {
    return undefined
  }

  const date = new Date(value as string | Date)

  return Number.isNaN(date.getTime()) ? undefined : date
}

const validatePublishEndAt: Validate<unknown, unknown, MainBannerData> = (
  value,
  options,
) => {
  if (!options.siblingData?.useReservation) {
    return true
  }

  const requiredResult = requiredWhenReserved('예약 종료일을 선택해야 합니다.')(value, options)

  if (requiredResult !== true) {
    return requiredResult
  }

  if (!value) {
    return true
  }

  const startAt = dateValue(options.siblingData?.publishStartAt)
  const endAt = dateValue(value)

  if (startAt && endAt && endAt < startAt) {
    return '종료일은 시작일보다 빠를 수 없습니다.'
  }

  return true
}

function selectedCenter(data?: unknown, siblingData?: unknown) {
  const value =
    siblingData && typeof siblingData === 'object'
      ? (siblingData as MainBannerData).center
      : data && typeof data === 'object'
        ? (data as MainBannerData).center
        : undefined
  const center = String(value ?? '').trim()

  return centerValues.has(center) ? center : undefined
}

function profileFilterForSelectedCenter({
  data,
  siblingData,
}: {
  data?: unknown
  siblingData?: unknown
}): Where {
  const center = selectedCenter(data, siblingData)

  if (!center || center === 'exam') {
    return {
      id: {
        equals: -1,
      },
    }
  }

  return {
    centers: {
      contains: center,
    },
  }
}

const normalizeMainBannerData: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data) {
    return data
  }

  const nextData = { ...data }
  const userCenter = userCenterValue(req.user)

  if (req.user && !isGlobalAdminUser(req.user)) {
    nextData.center = originalDoc?.center ?? userCenter
  }

  if (nextData.center === 'exam') {
    nextData.linkedProfiles = []
  } else {
    nextData.linkedExamReviews = []
  }

  if (!nextData.useReservation) {
    nextData.publishStartAt = null
    nextData.publishEndAt = null
  }

  return nextData
}

export const MainBanners: CollectionConfig = {
  slug: 'main-banners',
  labels: {
    plural: '메인 배너',
    singular: '메인 배너',
  },
  access: {
    create: createAccess,
    delete: centerAccess,
    read: allowRead,
    update: centerAccess,
  },
  admin: {
    defaultColumns: ['title', 'center', 'status', 'useReservation', 'updatedAt'],
    group: '메인설정',
    useAsTitle: 'title',
  },
  defaultSort: '-updatedAt',
  hooks: {
    afterChange: [
      normalizeUploadedMediaPrefixes([
        { path: 'desktopImage', role: 'main-banners.desktop-image' },
        { path: 'mobileImage', role: 'main-banners.mobile-image' },
        { path: 'desktopVideo', role: 'main-banners.desktop-video' },
        { path: 'mobileVideo', role: 'main-banners.mobile-video' },
      ]),
    ],
    beforeValidate: [normalizeMainBannerData],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '내용',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: '제목',
              validate: requiredText('제목을 입력해야 합니다.'),
            },
            {
              name: 'broadcaster',
              type: 'text',
              label: '방송사/출처',
            },
            {
              name: 'description',
              type: 'textarea',
              label: '설명',
            },
          ],
        },
        {
          label: '미디어',
          fields: [
            {
              name: 'desktopImage',
              type: 'upload',
              label: '데스크톱 이미지',
              relationTo: 'media',
              validate: requiredValue('데스크톱 이미지를 선택해야 합니다.'),
            },
            {
              name: 'mobileImage',
              type: 'upload',
              label: '모바일 이미지',
              relationTo: 'media',
              admin: {
                description: '비워두면 데스크톱 이미지를 모바일에도 사용합니다.',
              },
            },
            {
              name: 'desktopVideo',
              type: 'upload',
              label: '데스크톱 영상',
              relationTo: 'media',
            },
            {
              name: 'mobileVideo',
              type: 'upload',
              label: '모바일 영상',
              relationTo: 'media',
              admin: {
                description: '비워두면 데스크톱 영상을 모바일에도 사용합니다.',
              },
            },
          ],
        },
        {
          label: '연결 콘텐츠',
          fields: [
            {
              name: 'center',
              type: 'select',
              label: '센터',
              options: centerOptions,
              validate: requiredValue('센터를 선택해야 합니다.'),
            },
            {
              name: 'linkedProfiles',
              type: 'relationship',
              label: '연결 프로필',
              filterOptions: profileFilterForSelectedCenter,
              hasMany: true,
              relationTo: 'profiles',
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.center && siblingData.center !== 'exam',
                description: '입시센터 외 센터는 배우 프로필을 연결합니다.',
              },
            },
            {
              name: 'linkedExamReviews',
              type: 'relationship',
              label: '연결 합격후기',
              hasMany: true,
              relationTo: 'exam-passed-reviews',
              admin: {
                condition: (_data, siblingData) => siblingData?.center === 'exam',
                description: '입시센터 배너는 합격후기를 연결합니다.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: '상태',
      defaultValue: 'draft',
      options: statusOptions,
      validate: requiredValue('상태를 선택해야 합니다.'),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'useReservation',
      type: 'checkbox',
      label: '예약하기',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishStartAt',
      type: 'date',
      label: '예약 시작일',
      defaultValue: () => new Date().toISOString(),
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.useReservation),
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      validate: requiredWhenReserved('예약 시작일을 선택해야 합니다.'),
    },
    {
      name: 'publishEndAt',
      type: 'date',
      label: '예약 종료일',
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.useReservation),
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      validate: validatePublishEndAt,
    },
  ],
}

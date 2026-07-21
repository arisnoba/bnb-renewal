import type {
  FieldAccess,
  Field,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalBeforeValidateHook,
  GlobalConfig,
  Validate,
} from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

import { centerOptions, type CenterValue, isGlobalAdminUser, userCenterValue } from '@/collections/shared'

import { MAIN_BANNER_ORDER_LIMIT } from './constants'

const defaultAutoplayDelay = 5000

const requiredValue =
  (message: string): Validate<unknown> =>
  (value) => {
    return value ? true : message
  }

const positiveNumber =
  (message: string): Validate<unknown> =>
  (value) => {
    if (value === undefined || value === null || value === '') {
      return true
    }

    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? true : message
  }

const centerLabelByValue = Object.fromEntries(
  centerOptions.map((option) => [option.value, option.label]),
) as Record<CenterValue, string>

type MainBannerOrderRow = {
  banner?: unknown
}

type MainBannerOrderData = Record<string, unknown>

const bannerOrderFieldNames = centerOptions.map(
  (option) => `${option.value}Banners`,
)

const canUpdateCenter =
  (center: CenterValue): FieldAccess =>
  ({ req }) => {
    return isGlobalAdminUser(req.user) || userCenterValue(req.user) === center
  }

function canViewCenterTab(user: unknown, center: CenterValue) {
  return isGlobalAdminUser(user) || userCenterValue(user) === center
}

function hasBannerValue(row: unknown) {
  if (!row || typeof row !== 'object') {
    return false
  }

  return Boolean((row as MainBannerOrderRow).banner)
}

export function normalizeMainBannerOrderData(
  data: MainBannerOrderData = {},
  originalDoc: MainBannerOrderData = {},
) {
  const nextData = { ...data }

  for (const fieldName of bannerOrderFieldNames) {
    const value = Array.isArray(data[fieldName])
      ? data[fieldName]
      : originalDoc[fieldName]

    if (!Array.isArray(value)) {
      continue
    }

    const normalizedRows = value.filter(hasBannerValue).slice(0, MAIN_BANNER_ORDER_LIMIT)

    if (Array.isArray(data[fieldName]) || normalizedRows.length !== value.length) {
      nextData[fieldName] = normalizedRows
    }
  }

  return nextData
}

const normalizeMainGlobalData: GlobalBeforeValidateHook = ({ data, originalDoc }) => {
  return normalizeMainBannerOrderData(data, originalDoc)
}

export const restrictCenterMainUpdates: GlobalBeforeChangeHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!req.user || isGlobalAdminUser(req.user)) {
    return data
  }

  const allowedCenter = userCenterValue(req.user)

  if (!allowedCenter) {
    return originalDoc ?? data
  }

  const nextData = { ...data }

  for (const option of centerOptions) {
    const center = option.value

    if (center === allowedCenter) {
      continue
    }

    nextData[`${center}BannerAutoplay`] = originalDoc?.[`${center}BannerAutoplay`]
    nextData[`${center}BannerAutoplayDelay`] = originalDoc?.[`${center}BannerAutoplayDelay`]
    nextData[`${center}Banners`] = originalDoc?.[`${center}Banners`]
  }

  return nextData
}

export function mainCenterPaths() {
  return centerOptions.map((option) => `/${option.value}`)
}

export const revalidateMainCenterPaths: GlobalAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) {
    return doc
  }

  revalidateTag('global_main', 'max')

  for (const path of mainCenterPaths()) {
    req.payload.logger.info(`Revalidating main path ${path}`)
    revalidatePath(path, 'page')
  }

  return doc
}

function centerBannerOrderField(center: CenterValue): Field {
  const label = `${centerLabelByValue[center]} 배너 순서`

  return {
    name: `${center}Banners`,
    type: 'array',
    maxRows: MAIN_BANNER_ORDER_LIMIT,
    access: {
      update: canUpdateCenter(center),
    },
    label,
    labels: {
      plural: label,
      singular: label,
    },
    admin: {
      components: {
        RowLabel: '@/Main/RowLabel#MainBannerOrderRowLabel',
      },
      description: `최대 ${MAIN_BANNER_ORDER_LIMIT}개까지 등록할 수 있으며, 배열 순서가 실제 메인 노출 순서입니다. 신규 배너는 맨 앞에 추가되고, ${MAIN_BANNER_ORDER_LIMIT}개를 초과하면 맨 뒤 배너가 목록에서 제외됩니다. 예약이 종료된 배너는 목록에 남아 있지만 사이트에는 노출되지 않습니다.`,
      initCollapsed: true,
    },
    fields: [
      {
        name: 'banner',
        type: 'relationship',
        label: '배너',
        filterOptions: () => ({
          center: {
            equals: center,
          },
        }),
        relationTo: 'main-banners',
        validate: requiredValue('배너를 선택해야 합니다.'),
      },
    ],
  }
}

function centerBannerSettingFields(center: CenterValue): Field[] {
  return [
    {
      name: `${center}BannerAutoplay`,
      type: 'checkbox',
      access: {
        update: canUpdateCenter(center),
      },
      label: '오토플레이',
      defaultValue: true,
    },
    {
      name: `${center}BannerAutoplayDelay`,
      type: 'number',
      access: {
        update: canUpdateCenter(center),
      },
      label: '전환속도(ms)',
      defaultValue: defaultAutoplayDelay,
      admin: {
        components: {
          Field:
            '@/components/payload/MainBannerAutoplayDelayField#MainBannerAutoplayDelayField',
        },
        description: '자동 전환 간격입니다. 예: 5000 = 5초',
        step: 100,
      },
      validate: positiveNumber('전환속도는 0보다 큰 숫자로 입력해야 합니다.'),
    },
  ]
}

export const Main: GlobalConfig = {
  slug: 'main',
  label: '배너 설정',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: '메인설정',
  },
  hooks: {
    afterChange: [revalidateMainCenterPaths],
    beforeChange: [restrictCenterMainUpdates],
    beforeValidate: [normalizeMainGlobalData],
  },
  fields: [
    {
      type: 'tabs',
      tabs: centerOptions.map((option) => ({
        admin: {
          condition: (_data, _siblingData, { user }) => canViewCenterTab(user, option.value),
        },
        label: option.label,
        fields: [
          ...centerBannerSettingFields(option.value),
          centerBannerOrderField(option.value),
        ],
      })),
    },
  ],
}

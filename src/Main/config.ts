import type {
  Field,
  GlobalAfterChangeHook,
  GlobalBeforeValidateHook,
  GlobalConfig,
  Validate,
} from 'payload'
import { revalidatePath } from 'next/cache'

import { centerOptions, type CenterValue } from '@/collections/shared'

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

    const normalizedRows = value.filter(hasBannerValue)

    if (Array.isArray(data[fieldName]) || normalizedRows.length !== value.length) {
      nextData[fieldName] = normalizedRows
    }
  }

  return nextData
}

const normalizeMainGlobalData: GlobalBeforeValidateHook = ({ data, originalDoc }) => {
  return normalizeMainBannerOrderData(data, originalDoc)
}

export function mainCenterPaths() {
  return centerOptions.map((option) => `/${option.value}`)
}

export const revalidateMainCenterPaths: GlobalAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) {
    return doc
  }

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
    label,
    labels: {
      plural: label,
      singular: label,
    },
    admin: {
      components: {
        RowLabel: '@/Main/RowLabel#MainBannerOrderRowLabel',
      },
      description: '배열 순서가 실제 메인 노출 순서입니다.',
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
      label: '오토플레이',
      defaultValue: true,
    },
    {
      name: `${center}BannerAutoplayDelay`,
      type: 'number',
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
    beforeValidate: [normalizeMainGlobalData],
  },
  fields: [
    {
      type: 'tabs',
      tabs: centerOptions.map((option) => ({
        label: option.label,
        fields: [
          ...centerBannerSettingFields(option.value),
          centerBannerOrderField(option.value),
        ],
      })),
    },
  ],
}

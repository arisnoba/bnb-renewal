import type { Field, GlobalConfig, Validate } from 'payload'

import { centerOptions, type CenterValue } from '@/collections/shared'

const requiredValue =
  (message: string): Validate<unknown> =>
  (value) => {
    return value ? true : message
  }

const centerLabelByValue = Object.fromEntries(
  centerOptions.map((option) => [option.value, option.label]),
) as Record<CenterValue, string>

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

export const Main: GlobalConfig = {
  slug: 'main',
  label: '배너 순서 설정',
  access: {
    read: () => true,
  },
  admin: {
    group: '글로벌',
  },
  fields: [
    {
      type: 'tabs',
      tabs: centerOptions.map((option) => ({
        label: option.label,
        fields: [
          centerBannerOrderField(option.value),
        ],
      })),
    },
  ],
}

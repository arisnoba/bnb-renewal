import type { GlobalConfig, Validate } from 'payload'

import { revalidateFooter } from './hooks/revalidateFooter'

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

const validateOptionalUrl: Validate<unknown> = (value) => {
  const url = stringValue(value)

  if (!url) {
    return true
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

const socialUrlFields = [
  {
    name: 'youtubeUrl',
    label: '유튜브 URL',
    description: '해당 센터 footer Social 영역에 연결할 유튜브 주소입니다.',
  },
  {
    name: 'naverBlogUrl',
    label: '네이버 블로그 URL',
    description: '해당 센터 footer Social 영역에 연결할 네이버 블로그 주소입니다.',
  },
  {
    name: 'instagramUrl',
    label: '인스타그램 URL',
    description: '해당 센터 footer Social 영역에 연결할 인스타그램 주소입니다.',
  },
] as const

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: '센터 정보',
  access: {
    read: () => true,
  },
  admin: {
    group: '회사정보',
  },
  fields: [
    {
      name: 'centerInfos',
      type: 'array',
      label: '센터 정보',
      fields: [
        {
          name: 'centerName',
          type: 'text',
          label: '센터명',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
          admin: {
            description: '패밀리사이트 연동에 사용할 센터 URL입니다.',
          },
        },
        {
          name: 'operationRegistrationNumber',
          type: 'text',
          label: '운영등록번호',
          required: true,
        },
        {
          name: 'address',
          type: 'textarea',
          label: '주소',
          required: true,
        },
        ...socialUrlFields.map((field) => ({
          name: field.name,
          type: 'text' as const,
          label: field.label,
          validate: validateOptionalUrl,
          admin: {
            description: field.description,
          },
        })),
      ],
      labels: {
        plural: '센터 정보',
        singular: '센터 정보',
      },
      maxRows: 5,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#CenterInfoRowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
  versions: {
    max: 15,
  },
}

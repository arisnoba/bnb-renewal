import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Footer 메뉴',
      fields: [
        link({
          appearances: false,
        }),
      ],
      labels: {
        plural: 'Footer 메뉴',
        singular: 'Footer 메뉴',
      },
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
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
}

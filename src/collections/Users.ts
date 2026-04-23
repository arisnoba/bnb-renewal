import type { CollectionConfig } from 'payload'

import { centerOptions, systemDateFields } from './shared'

const rolePermissionLevels = {
  admin: 80,
  manager: 50,
  master: 100,
} as const

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    defaultColumns: ['email', 'role', 'center', 'updatedAtLabel'],
    group: '관리자',
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) {
          return data
        }

        const role = data.role

        if (role && role in rolePermissionLevels) {
          return {
            ...data,
            permissionLevel:
              rolePermissionLevels[role as keyof typeof rolePermissionLevels],
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      admin: {
        description:
          '마스터=100, 아트센터 관리자=80, 센터 매니저=50 으로 자동 적용됩니다.',
      },
      defaultValue: 'manager',
      options: [
        { label: '마스터', value: 'master' },
        { label: '아트센터 관리자', value: 'admin' },
        { label: '센터 매니저', value: 'manager' },
      ],
      required: true,
    },
    {
      name: 'permissionLevel',
      type: 'number',
      admin: {
        hidden: true,
        readOnly: true,
      },
      defaultValue: 50,
      required: true,
    },
    {
      name: 'center',
      type: 'select',
      defaultValue: 'art',
      options: centerOptions.filter((option) => option.value !== 'all'),
      required: true,
    },
    ...systemDateFields,
  ],
}

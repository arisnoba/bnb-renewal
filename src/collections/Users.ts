import type { Access, CollectionConfig } from 'payload'

import { globalAdminOnly } from './access'
import { centerOptions, isGlobalAdminUser } from './shared'

const rolePermissionLevels = {
  admin: 80,
  manager: 50,
  master: 100,
} as const

const readUsers: Access = ({ req }) => {
  if (isGlobalAdminUser(req.user)) {
    return true
  }

  if (!req.user?.id) {
    return false
  }

  return {
    id: {
      equals: req.user.id,
    },
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    plural: '관리자',
    singular: '관리자',
  },
  admin: {
    defaultColumns: ['email', 'role', 'center', 'updatedAt'],
    group: '관리자',
    hidden: ({ user }) => !isGlobalAdminUser(user),
    useAsTitle: 'email',
  },
  access: {
    create: globalAdminOnly,
    delete: globalAdminOnly,
    read: readUsers,
    update: globalAdminOnly,
  },
  auth: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) {
          return data
        }

        const center = data.center
        let role = data.role

        if (role !== 'master') {
          role = center === 'art' ? 'admin' : 'manager'
        }

        if (role && role in rolePermissionLevels) {
          return {
            ...data,
            role,
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
        { label: '최고 관리자', value: 'master' },
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
      options: centerOptions,
      required: true,
    },
  ],
}

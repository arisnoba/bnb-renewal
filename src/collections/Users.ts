import type { Access, CollectionBeforeValidateHook, CollectionConfig, FieldAccess } from 'payload'

import { resolveUserAuth } from '@/lib/userAuth'

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

const updateUsers: Access = ({ req }) => {
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

const globalAdminFieldUpdateOnly: FieldAccess = ({ req }) => isGlobalAdminUser(req.user)

const normalizeUserPermissionLevel: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  const nextData = { ...data }

  if (req.user && !isGlobalAdminUser(req.user)) {
    nextData.role = originalDoc?.role ?? req.user.role
    nextData.center = originalDoc?.center ?? req.user.center
    nextData.permissionLevel = originalDoc?.permissionLevel ?? req.user.permissionLevel
  }

  const role = nextData.role

  if (role && role in rolePermissionLevels) {
    return {
      ...nextData,
      role,
      permissionLevel:
        rolePermissionLevels[role as keyof typeof rolePermissionLevels],
    }
  }

  return nextData
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
    hidden: ({ user }) => !user,
    useAsTitle: 'email',
  },
  access: {
    create: globalAdminOnly,
    delete: globalAdminOnly,
    read: readUsers,
    update: updateUsers,
  },
  auth: resolveUserAuth(),
  hooks: {
    beforeValidate: [normalizeUserPermissionLevel],
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
      access: {
        update: globalAdminFieldUpdateOnly,
      },
      admin: {
        description:
          '최고관리자=100, 센터 통합 매니저=80, 센터매니저=50 으로 적용됩니다.',
      },
      defaultValue: 'manager',
      options: [
        { label: '최고관리자', value: 'master' },
        { label: '센터 통합 매니저', value: 'admin' },
        { label: '센터매니저', value: 'manager' },
      ],
      required: true,
    },
    {
      name: 'permissionLevel',
      type: 'number',
      access: {
        update: globalAdminFieldUpdateOnly,
      },
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
      access: {
        update: globalAdminFieldUpdateOnly,
      },
      defaultValue: 'art',
      options: centerOptions,
      required: true,
    },
    {
      name: 'passwordSaveAction',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/UserSaveButton#UserPasswordSaveAction',
        },
      },
    },
    {
      name: 'forceUnlockHelp',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/ForceUnlockHelp#ForceUnlockHelp',
        },
      },
    },
  ],
}

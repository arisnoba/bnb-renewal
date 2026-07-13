import type { Access, GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { isMasterAdminUser } from '@/collections/shared'
import { maintenanceDefaults } from './maintenance'

const masterAdminOnly: Access = ({ req }) => isMasterAdminUser(req.user)

export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) {
    return doc
  }

  req.payload.logger.info('Revalidating site settings')

  revalidateTag('global_site-settings', 'max')
  revalidatePath('/', 'layout')

  return doc
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '사이트 설정',
  access: {
    read: () => true,
    update: masterAdminOnly,
  },
  admin: {
    group: '시스템관리',
    hidden: ({ user }) => !isMasterAdminUser(user),
  },
  fields: [
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      label: '전체 사이트 점검모드',
      defaultValue: false,
      admin: {
        description:
          '켜면 공개 프론트 전체가 점검 화면으로 전환됩니다. Payload 관리자 화면은 계속 사용할 수 있습니다.',
      },
    },
    {
      name: 'maintenanceTitle',
      type: 'text',
      label: '점검 화면 제목',
      defaultValue: maintenanceDefaults.title,
    },
    {
      name: 'maintenanceMessage',
      type: 'textarea',
      label: '점검 화면 안내문',
      defaultValue: maintenanceDefaults.message,
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}

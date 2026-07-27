import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { TeacherOrderViewClient } from './TeacherOrderViewClient'

export function TeacherOrderView(props: AdminViewServerProps) {
  const {
    initPageResult: { permissions, req },
    payload,
  } = props
  const { user } = req
  const adminRoute = payload.config.routes.admin
  const orderURL = formatAdminURL({
    adminRoute,
    path: '/collections/teachers/order',
  })

  if (!user || !permissions.canAccessAdmin || !permissions.collections?.teachers?.read) {
    const destination = formatAdminURL({
      adminRoute,
      path: user ? payload.config.admin.routes.unauthorized : payload.config.admin.routes.login,
    })

    redirect(user ? destination : `${destination}?redirect=${encodeURIComponent(orderURL)}`)
  }

  return <TeacherOrderViewClient />
}

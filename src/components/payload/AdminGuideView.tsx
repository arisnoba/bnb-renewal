import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { AdminGuideClient } from './AdminGuideClient'

export function AdminGuideView(props: AdminViewServerProps) {
  const {
    initPageResult: { permissions, req, visibleEntities },
    i18n,
    locale,
    params,
    payload,
    searchParams,
  } = props
  const { user } = req
  const adminRoute = payload.config.routes.admin
  const guideURL = formatAdminURL({ adminRoute, path: '/guide' })

  if (!user || !permissions.canAccessAdmin) {
    const destination = formatAdminURL({
      adminRoute,
      path: user
        ? payload.config.admin.routes.unauthorized
        : payload.config.admin.routes.login,
    })

    redirect(
      user ? destination : `${destination}?redirect=${encodeURIComponent(guideURL)}`,
    )
  }

  return (
    <DefaultTemplate
      className="admin-guide-view"
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user}
      viewActions={[]}
      viewType="admin-guide"
      visibleEntities={visibleEntities}
    >
      <AdminGuideClient />
    </DefaultTemplate>
  )
}

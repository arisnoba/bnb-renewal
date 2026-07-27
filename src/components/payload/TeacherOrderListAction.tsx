'use client'

import { Button, useConfig } from '@payloadcms/ui'
import { ListOrdered } from 'lucide-react'
import { formatAdminURL } from 'payload/shared'

export function TeacherOrderListAction() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const href = formatAdminURL({
    adminRoute,
    path: '/collections/teachers/order',
  })

  return (
    <Button
      buttonStyle="primary"
      className="teacher-order-list-action"
      el="link"
      size="small"
      to={href}
    >
      <ListOrdered aria-hidden="true" size={16} strokeWidth={1.8} />
      <span>센터별 순서 설정</span>
    </Button>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

export function FrontendChrome({
  children,
  footer,
  header,
  initialIsGatePage,
}: {
  children: React.ReactNode
  footer: React.ReactNode
  header: React.ReactNode
  initialIsGatePage: boolean
}) {
  const pathname = usePathname()
  const isGatePage = pathname ? pathname === '/' : initialIsGatePage

  return (
    <>
      {!isGatePage && header}
      {children}
      {!isGatePage && footer}
    </>
  )
}

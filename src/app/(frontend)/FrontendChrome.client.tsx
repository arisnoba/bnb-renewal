'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { useIsCenterDomain } from './CenterDomainContext.client'

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
  const isCenterDomain = useIsCenterDomain()
  const isGatePage = !isCenterDomain && (pathname ? pathname === '/' : initialIsGatePage)

  return (
    <>
      {!isGatePage && header}
      {children}
      {!isGatePage && footer}
    </>
  )
}

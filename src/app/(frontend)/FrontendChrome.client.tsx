'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import { isCenterPreparationPathname } from '@/lib/centerAvailability'

import { useIsCenterDomain } from './CenterDomainContext.client'

export function FrontendChrome({
  children,
  footer,
  header,
  hideChromeForPreparingCenters,
  initialIsGatePage,
}: {
  children: React.ReactNode
  footer: React.ReactNode
  header: React.ReactNode
  hideChromeForPreparingCenters: boolean
  initialIsGatePage: boolean
}) {
  const pathname = usePathname()
  const isCenterDomain = useIsCenterDomain()
  const isGatePage = !isCenterDomain && (pathname ? pathname === '/' : initialIsGatePage)
  const isPreparingCenterPage =
    hideChromeForPreparingCenters && isCenterPreparationPathname(pathname ?? '')
  const hideChrome = isGatePage || isPreparingCenterPage

  return (
    <>
      {!hideChrome && header}
      {children}
      {!hideChrome && footer}
    </>
  )
}

'use client'

import type { CenterSlug } from '@/lib/centers'
import type { ReactNode } from 'react'

import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'

import { centerFromPathname } from '@/lib/centerDomains'

const CenterDomainContext = createContext<CenterSlug | null>(null)

export function CenterDomainProvider({
  center,
  children,
}: {
  center: CenterSlug | null
  children: ReactNode
}) {
  return <CenterDomainContext.Provider value={center}>{children}</CenterDomainContext.Provider>
}

export function useCurrentCenter(fallbackCenter: CenterSlug = 'art') {
  const pathname = usePathname()
  const domainCenter = useContext(CenterDomainContext)

  return centerFromPathname(pathname) ?? domainCenter ?? fallbackCenter
}

export function useIsCenterDomain() {
  return useContext(CenterDomainContext) !== null
}

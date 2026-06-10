'use client'

import { usePathname } from 'next/navigation'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'

export type PageTone = 'dark' | 'light'

export interface PageToneContextType {
  pageTone?: PageTone | null
  setPageTone: (tone: PageTone | null) => void
}

const defaultPageTone: PageTone = 'light'

const initialContext: PageToneContextType = {
  pageTone: undefined,
  setPageTone: () => null,
}

const PageToneContext = createContext(initialContext)

export const PageToneProvider = ({
  children,
  initialPageTone,
}: {
  children: React.ReactNode
  initialPageTone?: PageTone
}) => {
  const pathname = usePathname()
  const [initialPathname] = useState(pathname)
  const [pageToneState, setPageToneState] = useState<{
    pathname: string | null
    tone: PageTone | null
  }>({
    pathname: null,
    tone: null,
  })

  const pageTone =
    pageToneState.pathname === pathname
      ? pageToneState.tone
      : pathname === initialPathname
        ? (initialPageTone ?? null)
        : null

  useEffect(() => {
    document.body.dataset.pageTone = pageTone ?? defaultPageTone

    return () => {
      delete document.body.dataset.pageTone
    }
  }, [pageTone])

  const setPageTone = useCallback(
    (toneToSet: PageTone | null) => {
      setPageToneState({
        pathname,
        tone: toneToSet,
      })
    },
    [pathname],
  )

  return <PageToneContext value={{ pageTone, setPageTone }}>{children}</PageToneContext>
}

export const usePageTone = (): PageToneContextType => use(PageToneContext)

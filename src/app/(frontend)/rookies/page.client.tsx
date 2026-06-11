'use client'

import type { PageTone } from '@/providers/PageTone'
import { usePageTone } from '@/providers/PageTone'
import React, { useEffect } from 'react'

const PageClient: React.FC<{ pageTone?: PageTone }> = ({ pageTone = 'light' }) => {
  const { setPageTone } = usePageTone()

  useEffect(() => {
    setPageTone(pageTone)
  }, [pageTone, setPageTone])

  return <React.Fragment />
}

export default PageClient

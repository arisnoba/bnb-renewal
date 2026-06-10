'use client'
import type { Theme as HeaderTheme } from '@/providers/Theme/types'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

const PageClient: React.FC<{ headerTheme?: HeaderTheme }> = ({ headerTheme = 'light' }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme(headerTheme)
  }, [headerTheme, setHeaderTheme])
  return <React.Fragment />
}

export default PageClient

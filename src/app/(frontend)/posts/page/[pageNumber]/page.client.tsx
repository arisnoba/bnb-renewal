'use client'
import { usePageTone } from '@/providers/PageTone'
import React, { useEffect } from 'react'

const PageClient: React.FC = () => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setPageTone } = usePageTone()

  useEffect(() => {
    setPageTone('light')
  }, [setPageTone])
  return <React.Fragment />
}

export default PageClient

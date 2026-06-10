'use client'
import { usePageTone } from '@/providers/PageTone'
import React, { useEffect } from 'react'

const PageClient: React.FC = () => {
  const { setPageTone } = usePageTone()

  useEffect(() => {
    setPageTone('dark')
  }, [setPageTone])
  return <React.Fragment />
}

export default PageClient

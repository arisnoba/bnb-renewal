'use client'

import { usePageTone } from '@/providers/PageTone'
import { useEffect } from 'react'

export default function MapPageClient() {
  const { setPageTone } = usePageTone()

  useEffect(() => {
    setPageTone('dark')
  }, [setPageTone])

  return null
}

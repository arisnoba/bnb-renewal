'use client'

import React, { useEffect } from 'react'

import type { PageTone } from '@/providers/PageTone'
import { usePageTone } from '@/providers/PageTone'

type PageToneClientProps = {
  tone?: PageTone
}

export function PageToneClient({ tone = 'light' }: PageToneClientProps) {
  const { setPageTone } = usePageTone()

  useEffect(() => {
    setPageTone(tone)
  }, [setPageTone, tone])

  return <React.Fragment />
}

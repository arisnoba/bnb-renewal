import React from 'react'

import { PageToneProvider, type PageTone } from './PageTone'

export const Providers: React.FC<{
  children: React.ReactNode
  initialPageTone?: PageTone
}> = ({ children, initialPageTone }) => {
  return <PageToneProvider initialPageTone={initialPageTone}>{children}</PageToneProvider>
}

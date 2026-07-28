'use client'

import NextTopLoader from 'nextjs-toploader'

import { useCurrentCenter } from './CenterDomainContext.client'

const centerTopLoaderColors = {
  art: 'var(--color-brand-art)',
  avenue: 'var(--color-brand-avenue)',
  exam: 'var(--color-brand-exam)',
  highteen: 'var(--color-brand-highteen)',
  kids: 'var(--color-brand-kids)',
} as const

export function NavigationTopLoader() {
  const center = useCurrentCenter()
  const color = centerTopLoaderColors[center]

  return (
    <NextTopLoader
      color={color}
      crawlSpeed={180}
      easing="ease"
      height={3}
      shadow={false}
      showSpinner={false}
      speed={220}
      zIndex={2147483647}
    />
  )
}

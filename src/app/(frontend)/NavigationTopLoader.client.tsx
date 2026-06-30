'use client'

import NextTopLoader from 'nextjs-toploader'
import { usePathname } from 'next/navigation'

const centerTopLoaderColors = {
  art: 'var(--color-brand-art)',
  avenue: 'var(--color-brand-avenue)',
  exam: 'var(--color-brand-exam)',
  highteen: 'var(--color-brand-highteen)',
  kids: 'var(--color-brand-kids)',
} as const

function topLoaderColorForPathname(pathname: string) {
  const center = pathname.split('/').filter(Boolean)[0]

  if (center && center in centerTopLoaderColors) {
    return centerTopLoaderColors[center as keyof typeof centerTopLoaderColors]
  }

  return centerTopLoaderColors.art
}

export function NavigationTopLoader() {
  const pathname = usePathname()
  const color = topLoaderColorForPathname(pathname)

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

'use client'

import NextTopLoader from 'nextjs-toploader'

export function NavigationTopLoader() {
  return (
    <NextTopLoader
      color="#C80000"
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

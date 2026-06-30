'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'

export function TeacherDetailScrollReset() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (window.location.hash) {
      return
    }

    window.scrollTo(0, 0)
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0))

    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return null
}

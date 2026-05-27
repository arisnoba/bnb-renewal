'use client'

import { useEffect } from 'react'

export function ConsultationLightTheme() {
  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute('data-theme')
    const previousStoredTheme = window.localStorage.getItem('payload-theme')
    const applyLightTheme = () => {
      window.localStorage.setItem('payload-theme', 'light')
      document.documentElement.setAttribute('data-theme', 'light')
    }

    applyLightTheme()
    const frame = window.requestAnimationFrame(applyLightTheme)

    return () => {
      window.cancelAnimationFrame(frame)

      if (previousStoredTheme) {
        window.localStorage.setItem('payload-theme', previousStoredTheme)
      } else {
        window.localStorage.removeItem('payload-theme')
      }

      if (previousTheme) {
        document.documentElement.setAttribute('data-theme', previousTheme)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }, [])

  return null
}

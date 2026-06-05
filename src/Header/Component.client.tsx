'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import './index.scss'

export const HeaderClient: React.FC = () => {
  /* Storing the value in a useState to avoid hydration errors */
  const headerRef = useRef<HTMLElement | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  useEffect(() => {
    const updateScrolled = () => {
      setIsScrolled(window.scrollY > 16)
    }

    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrolled)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const header = headerRef.current

    if (!header) return

    const updateHeight = () => {
      root.style.setProperty('--site-header-measured-height', `${header.offsetHeight}px`)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)

    return () => {
      observer.disconnect()
      root.style.removeProperty('--site-header-measured-height')
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-scrolled={isScrolled ? 'true' : undefined}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container-fluid site-header__inner">
        <Link className="site-header__logo" href="/">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav />
      </div>
    </header>
  )
}

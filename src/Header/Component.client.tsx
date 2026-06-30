'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Logo } from '@/components/Logo/Logo'
import { centerLogoFor } from '@/lib/centerLogos'
import { HeaderNav } from './Nav'
import { headerCenterFromPathname } from './Nav/menu'
import './index.scss'

export const HeaderClient: React.FC = () => {
  /* Storing the value in a useState to avoid hydration errors */
  const headerRef = useRef<HTMLElement | null>(null)
  const [isMegaOpen, setIsMegaOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const center = headerCenterFromPathname(pathname)
  const centerLogo = centerLogoFor(center)

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
      const headerHeight =
        getComputedStyle(header).getPropertyValue('--site-header-height').trim() ||
        getComputedStyle(root).getPropertyValue('--site-header-height').trim()

      root.style.setProperty(
        '--site-header-measured-height',
        headerHeight || `${header.offsetHeight}px`,
      )
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    window.addEventListener('resize', updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeight)
      root.style.removeProperty('--site-header-measured-height')
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className={isMegaOpen ? 'site-header is-hover' : 'site-header'}
      data-scrolled={isScrolled ? 'true' : undefined}
    >
      <div className="container-fluid site-header__inner">
        <Link className="site-header__logo" href={`/${center}`} prefetch={false}>
          <Logo loading="eager" priority="high" {...centerLogo} />
        </Link>
        <HeaderNav onMegaOpenChange={setIsMegaOpen} />
      </div>
    </header>
  )
}

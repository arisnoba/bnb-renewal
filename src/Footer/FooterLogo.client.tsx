'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'

import { centerLogoFor } from '@/lib/centerLogos'
import { centerSlugFromPathname } from './centerInfo'

export function FooterLogo({ initialCenter }: { initialCenter: CenterSlug }) {
  const pathname = usePathname()
  const center = centerSlugFromPathname(pathname) ?? initialCenter
  const logo = centerLogoFor(center)

  return (
    <Link aria-label={`${logo.alt} 홈`} href={`/${center}`}>
      <Image alt="" height={logo.height} priority src={logo.src} width={logo.width} />
    </Link>
  )
}

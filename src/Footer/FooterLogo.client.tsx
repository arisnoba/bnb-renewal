'use client'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'

import { centerLogoFor } from '@/lib/centerLogos'
import { useCurrentCenter } from '@/app/(frontend)/CenterDomainContext.client'

export function FooterLogo({ initialCenter }: { initialCenter: CenterSlug }) {
  const center = useCurrentCenter(initialCenter)
  const logo = centerLogoFor(center)

  return (
    <Link aria-label={`${logo.alt} 홈`} href={`/${center}`} prefetch={false}>
      <Image alt="" height={logo.height} priority src={logo.src} width={logo.width} />
    </Link>
  )
}

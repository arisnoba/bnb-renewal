'use client'

import type { FooterCenterInfo } from './centerInfo'

import Image from 'next/image'
import React from 'react'

import { useCurrentCenter } from '@/app/(frontend)/CenterDomainContext.client'
import { footerCenterInfoForCenter, footerSocialLinks } from './centerInfo'

export function FooterSocialLinks({
  centerInfos,
}: {
  centerInfos: FooterCenterInfo[]
}) {
  const center = useCurrentCenter()
  const socialLinks = footerSocialLinks(footerCenterInfoForCenter(centerInfos, center))

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-row flex-wrap items-center gap-x-12 gap-y-4 lg:flex-col lg:items-start lg:gap-x-0 lg:gap-y-2">
      {socialLinks.map((item) => (
        <li key={item.label}>
          <a
            className="flex items-center gap-2 whitespace-nowrap text-[#666] transition-colors hover:text-white"
            href={item.href}
            rel="noreferrer"
            target="_blank"
          >
            <Image alt="" className="h-7 w-7 lg:h-5 lg:w-5" height={20} src={item.icon} width={20} />
            <span className="sr-only text-sm leading-normal lg:not-sr-only">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

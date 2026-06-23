'use client'

import type { FooterCenterInfo } from './centerInfo'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'

import { footerSocialLinksForPathname } from './centerInfo'

export function FooterSocialLinks({
  centerInfos,
  initialPathname,
}: {
  centerInfos: FooterCenterInfo[]
  initialPathname: string | null
}) {
  const pathname = usePathname() ?? initialPathname
  const socialLinks = footerSocialLinksForPathname(centerInfos, pathname)

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:gap-x-8 min-[360px]:gap-y-3 lg:flex-col lg:gap-x-0 lg:gap-y-2">
      {socialLinks.map((item) => (
        <li key={item.label}>
          <a
            className="flex items-center gap-2 whitespace-nowrap text-[#666] transition-colors hover:text-white"
            href={item.href}
            rel="noreferrer"
            target="_blank"
          >
            <Image alt="" height={20} src={item.icon} width={20} />
            <span className="text-sm leading-normal">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

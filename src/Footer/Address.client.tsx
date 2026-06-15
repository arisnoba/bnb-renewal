'use client'

import type { FooterCenterInfo } from './centerInfo'

import { usePathname } from 'next/navigation'
import React from 'react'

import { footerAddressLines, footerCenterInfoForPathname } from './centerInfo'

export function FooterAddress({
  centerInfos,
  initialPathname,
}: {
  centerInfos: FooterCenterInfo[]
  initialPathname: string | null
}) {
  const pathname = usePathname() ?? initialPathname
  const addressLines = footerAddressLines(footerCenterInfoForPathname(centerInfos, pathname))

  return (
    <address className="not-italic text-sm leading-normal tracking-normal text-white/40">
      {addressLines.map((line, index) => (
        <React.Fragment key={`${index}-${line}`}>
          {index > 0 ? <br /> : null}
          {line}
        </React.Fragment>
      ))}
    </address>
  )
}

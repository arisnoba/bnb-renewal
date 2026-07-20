'use client'

import type { FooterCenterInfo } from './centerInfo'

import React from 'react'

import { useCurrentCenter } from '@/app/(frontend)/CenterDomainContext.client'
import { footerAddressLines, footerCenterInfoForCenter } from './centerInfo'

export function FooterAddress({
  centerInfos,
}: {
  centerInfos: FooterCenterInfo[]
}) {
  const center = useCurrentCenter()
  const addressLines = footerAddressLines(footerCenterInfoForCenter(centerInfos, center))

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

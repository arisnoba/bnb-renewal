import Link from 'next/link'
import React from 'react'

import { FooterAddress } from './Address.client'
import { FooterCenterLinks, FooterPolicyLinks } from './CenterLinks.client'
import { FooterLogo } from './FooterLogo.client'
import { FooterSocialLinks } from './SocialLinks.client'
import { getFooterData } from './data'
import { familySitesFromFooter } from './familySites'

export async function Footer() {
  const initialCenter = 'art'
  const footer = await getFooterData()
  const familySites = familySitesFromFooter(footer)
  const centerInfos = footer?.centerInfos ?? []
  const copyrightYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-bg-footer text-white">
      <div className="mx-auto flex w-full container flex-col gap-14 px-5 py-20 md:px-8 lg:gap-10 lg:py-20">
        <div className="grid gap-20 lg:grid-cols-2 lg:gap-5">
          <p className="text-[32px] font-semibold leading-normal tracking-normal lg:leading-[1.2]">
            배우의 서사가
            <br />
            시작되는 곳
          </p>
          <div className="grid gap-16 md:grid-cols-2 md:gap-5">
            <FooterCenterLinks initialCenter={initialCenter} />
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-5">
          <div className="order-2 flex flex-col items-start gap-6 lg:order-1 lg:min-h-[234px] lg:justify-between">
            <FooterLogo initialCenter={initialCenter} />

            <FooterPolicyLinks initialCenter={initialCenter} />

            <FooterAddress centerInfos={centerInfos} initialPathname={null} />

            <p className="text-sm leading-[1.2] tracking-normal text-white/40">
              ©{copyrightYear} BNB INDUSTRY. All rights reserved.
            </p>
          </div>

          <div className="order-1 grid gap-16 lg:order-2 lg:grid-cols-2 lg:gap-6">
            <FooterLinkGroup title="FAMILY SITE">
              <FooterTextLinks links={familySites} />
            </FooterLinkGroup>
            <FooterLinkGroup title="SOCIAL">
              <FooterSocialLinks centerInfos={centerInfos} initialPathname={null} />
            </FooterLinkGroup>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section className="flex min-w-0 flex-col items-start gap-8">
      <h2 className="whitespace-nowrap text-xs font-bold leading-[1.2] tracking-normal text-white">
        {title}
      </h2>
      {children}
    </section>
  )
}

function FooterTextLinks({
  links,
  size = 'small',
}: {
  links: { href: string; label: string }[]
  size?: 'large' | 'small'
}) {
  const className =
    size === 'large'
      ? 'text-xl font-medium leading-[1.2] text-[#666]'
      : 'text-sm font-normal leading-normal text-[#666]'

  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            className={`${className} whitespace-nowrap transition-colors hover:text-white`}
            href={link.href}
            prefetch={false}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

import type { Footer as FooterData } from '@/payload-types'

import Link from 'next/link'
import { headers } from 'next/headers'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { FooterAddress } from './Address.client'
import { FooterLogo } from './FooterLogo.client'
import { FooterSocialLinks } from './SocialLinks.client'
import { centerSlugFromPathname } from './centerInfo'

const fallbackFamilySites = [
  { href: '/art', label: 'ART CENTER', name: '아트센터' },
  { href: '/exam', label: 'EXAM CENTER', name: '입시센터' },
  { href: '/highteen', label: 'HIGH TEEN CENTER', name: '하이틴센터' },
  { href: '/kids', label: 'KIDS CENTER', name: '키즈센터' },
  { href: '/avenue', label: 'AVENUE CENTER', name: '애비뉴센터' },
]

async function getFooterData() {
  try {
    return await getCachedGlobal('footer', 0)()
  } catch {
    return null
  }
}

function familySitesFromFooter(footer: FooterData | null) {
  const centerInfos = footer?.centerInfos ?? []

  return fallbackFamilySites.map((site) => {
    const centerInfo = centerInfos.find((item) => item.centerName === site.name)

    return {
      ...site,
      href: centerInfo?.url || site.href,
    }
  })
}

export async function Footer() {
  const footer = await getFooterData()
  const familySites = familySitesFromFooter(footer)
  const centerInfos = footer?.centerInfos ?? []
  const pathname = (await headers()).get('x-pathname')
  const center = centerSlugFromPathname(pathname) ?? 'art'
  const consultHref = `/${center}/consult`
  const customerLinks = [
    { href: 'tel:15779929', label: '대표전화', value: '1577-9929' },
    { href: consultHref, label: 'CS센터 운영안내' },
    { href: `/${center}/map`, label: '오시는 길' },
  ]
  const consultationLinks = [
    { href: `/${center}/admission`, label: '입학안내' },
    { href: consultHref, label: '상담신청' },
    { href: `/${center}/faq`, label: '자주 묻는 질문' },
  ]
  const copyrightYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-bg-footer text-white">
      <div className="mx-auto flex w-full container flex-col gap-10 px-5 py-16 md:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-5">
          <p className="text-[32px] font-semibold leading-[1.2] tracking-normal">
            배우의 서사가
            <br />
            시작되는 곳
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:gap-5">
            <FooterLinkGroup title="고객 안내 센터">
              <ul className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:gap-x-8 min-[360px]:gap-y-3 lg:flex-col lg:gap-x-0 lg:gap-y-2">
                {customerLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      className="flex flex-wrap items-center gap-3 whitespace-nowrap text-xl font-medium leading-[1.2] text-[#666] transition-colors hover:text-white"
                      href={item.href}
                    >
                      <span>{item.label}</span>
                      {item.value ? (
                        <span className="font-semibold leading-none text-white">{item.value}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterLinkGroup>
            <FooterLinkGroup title="온라인 상담 신청">
              <FooterTextLinks links={consultationLinks} size="large" />
            </FooterLinkGroup>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-6">
          <div className="order-2 flex flex-col items-start gap-6 lg:order-1 lg:min-h-[234px] lg:justify-between">
            <FooterLogo initialCenter={center} />

            <nav aria-label="정책" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] leading-[1.2] tracking-normal">
              <Link className="text-[#666] transition-colors hover:text-white" href="/terms">
                이용약관
              </Link>
              <Link className="font-medium text-[#999] transition-colors hover:text-white" href="/privacy">
                개인정보처리방침
              </Link>
            </nav>

            <FooterAddress centerInfos={centerInfos} initialPathname={pathname} />

            <p className="text-sm leading-[1.2] tracking-normal text-white/40">
              ©{copyrightYear} BNB INDUSTRY. All rights reserved.
            </p>
          </div>

          <div className="order-1 grid gap-8 sm:grid-cols-2 lg:order-2 lg:gap-6">
            <FooterLinkGroup title="FAMILY SITE">
              <FooterTextLinks links={familySites} />
            </FooterLinkGroup>
            <FooterLinkGroup title="SOCIAL">
              <FooterSocialLinks centerInfos={centerInfos} initialPathname={pathname} />
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
    <ul className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:gap-x-8 min-[360px]:gap-y-3 lg:flex-col lg:gap-x-0 lg:gap-y-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link className={`${className} whitespace-nowrap transition-colors hover:text-white`} href={link.href}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

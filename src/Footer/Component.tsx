import type { Footer as FooterData } from '@/payload-types'

import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { FooterAddress } from './Address.client'
import { centerSlugFromPathname } from './centerInfo'

const footerLogo = '/assets/footer/logo-bnb-footer.svg'

const consultationLinks = [
  { href: '/consult', label: '입학안내' },
  { href: '/consult', label: '상담신청' },
  { href: '/test/faq', label: '자주 묻는 질문' },
]

const fallbackFamilySites = [
  { href: '/art', label: 'ART CENTER', name: '아트센터' },
  { href: '/exam', label: 'EXAM CENTER', name: '입시센터' },
  { href: '/highteen', label: 'HIGH TEEN CENTER', name: '하이틴센터' },
  { href: '/kids', label: 'KIDS CENTER', name: '키즈센터' },
  { href: '/avenue', label: 'AVENUE CENTER', name: '애비뉴센터' },
]

const socialItems = [
  { href: 'https://www.youtube.com/', icon: '/assets/footer/icon-youtube.png', label: 'Youtube' },
  { href: 'https://www.instagram.com/', icon: '/assets/footer/icon-instagram.png', label: 'Instagram' },
  { href: 'https://www.facebook.com/', icon: '/assets/footer/icon-facebook.png', label: 'Facebook' },
  { href: 'https://blog.naver.com/', icon: '/assets/footer/icon-naver-blog.png', label: 'Naver Blog' },
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
  const customerLinks = [
    { href: 'tel:15779929', label: '대표전화', value: '1577-9929' },
    { href: '/consult', label: 'CS센터 운영안내' },
    { href: `/${center}/map`, label: '오시는 길' },
  ]
  const copyrightYear = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-bg-footer text-white">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-5 py-16 font-['Pretendard','Pretendard_Variable','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] md:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-5">
          <p className="text-[32px] font-semibold leading-[1.2] tracking-normal">
            배움의 시작이
            <br />
            당신만의 무대로
            <br />
            이어집니다.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:gap-5">
            <FooterLinkGroup title="고객 안내 센터">
              <ul className="flex flex-col gap-4">
                {customerLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      className="flex flex-wrap items-center gap-3 text-xl font-medium leading-[1.2] text-[#666] transition-colors hover:text-white"
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
          <div className="flex flex-col items-start gap-6 lg:min-h-[234px] lg:justify-between">
            <Link aria-label="배우앤배움 홈" href="/">
              <Image alt="" height={38} priority src={footerLogo} width={120} />
            </Link>

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

          <div className="grid gap-8 sm:grid-cols-2 lg:gap-6">
            <FooterLinkGroup title="패밀리사이트">
              <FooterTextLinks links={familySites} />
            </FooterLinkGroup>
            <FooterLinkGroup title="Social">
              <ul className="flex flex-col gap-2">
                {socialItems.map((item) => (
                  <li key={item.label}>
                    <a
                      className="flex items-center gap-2 text-[#666] transition-colors hover:text-white"
                      href={item.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Image alt="" height={20} src={item.icon} width={20} />
                      <span className="w-[142px] text-sm leading-[1.5]">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
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
      : 'text-sm font-normal leading-[1.5] text-[#666]'

  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link className={`${className} transition-colors hover:text-white`} href={link.href}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

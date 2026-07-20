'use client'

import Link from 'next/link'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'

import { useCurrentCenter } from '@/app/(frontend)/CenterDomainContext.client'

export function FooterCenterLinks({ initialCenter = 'art' }: { initialCenter?: CenterSlug }) {
  const center = useCurrentCenter(initialCenter)
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

  return (
    <>
      <FooterLinkGroup title="고객 안내 센터">
        <ul className="flex flex-col gap-2">
          {customerLinks.map((item) => (
            <li key={item.label}>
              <Link
                className="flex flex-wrap items-center gap-3 whitespace-nowrap text-xl font-medium leading-[1.2] text-[#666] transition-colors hover:text-white"
                href={item.href}
                prefetch={false}
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
    </>
  )
}

export function FooterPolicyLinks({ initialCenter = 'art' }: { initialCenter?: CenterSlug }) {
  const center = useCurrentCenter(initialCenter)

  return (
    <nav
      aria-label="정책"
      className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] leading-[1.2] tracking-normal"
    >
      <Link className="text-[#666] transition-colors hover:text-white" href={`/${center}/terms`} prefetch={false}>
        이용약관
      </Link>
      <Link className="font-medium text-[#999] transition-colors hover:text-white" href={`/${center}/privacy`} prefetch={false}>
        개인정보처리방침
      </Link>
    </nav>
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

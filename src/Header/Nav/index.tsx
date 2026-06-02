'use client'

import React from 'react'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const navItems = [
  { href: '/', label: '배우앤배움' },
  { href: '/art', label: '교육' },
  { href: '/exam', label: '캐스팅' },
  { href: '/highteen', label: '아티스트' },
  { href: '/consult', label: '지원센터' },
]

export const HeaderNav: React.FC = () => {
  return (
    <>
      <nav aria-label="주요 메뉴" className="site-header__nav">
        {navItems.map((item) => (
          <Link className="site-header__nav-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__consult" href="/consult">
          온라인상담신청
        </Link>
        <Link className="site-header__family" href="/">
          <span>Family Site</span>
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2.4} />
        </Link>
      </div>
      <Link className="site-header__mobile-consult" href="/consult">
        상담
      </Link>
    </>
  )
}

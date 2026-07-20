'use client'

import { BookOpenText } from 'lucide-react'
import { usePathname } from 'next/navigation'

const adminGuidePath = '/admin/guide'

export function AdminGuideNavLink() {
  const pathname = usePathname()
  const isActive = pathname === adminGuidePath

  return (
    <div className="bnb-admin-guide-nav">
      <a
        aria-current={isActive ? 'page' : undefined}
        className={`bnb-admin-guide-nav__link${isActive ? ' is-active' : ''}`}
        href={adminGuidePath}
      >
        <BookOpenText aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>사용 가이드</span>
      </a>
    </div>
  )
}

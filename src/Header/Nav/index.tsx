'use client'

import React from 'react'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'

export const HeaderNav: React.FC = () => {
  return (
    <nav className="flex gap-3 items-center">
      <CMSLink appearance="link" label="테스트" type="custom" url="/test" />
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}

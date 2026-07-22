'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'

type RookiesSearchFormProps = {
  center: CenterSlug
  filter?: string
  search: string
}

export function RookiesSearchForm({ center, filter, search }: RookiesSearchFormProps) {
  const router = useRouter()

  return (
    <form
      action={centerPublicHref(center, '/rookies')}
      className="section-rookies-list__search"
      method="get"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const searchQuery = String(formData.get('search') ?? '').trim().replace(/\s+/g, ' ')
        const params = new URLSearchParams()

        if (filter) {
          params.set('filter', filter)
        }

        if (searchQuery) {
          params.set('search', searchQuery)
        }

        const query = params.toString()

        router.push(centerPublicHref(center, `/rookies${query ? `?${query}` : ''}`), { scroll: false })
      }}
      role="search"
    >
      {filter && <input name="filter" type="hidden" value={filter} />}
      <input
        aria-label="BNB 루키 검색어"
        className="section-rookies-list__search-input type-title-m font-bold leading-[1.4]"
        defaultValue={search}
        name="search"
        placeholder="이름을 검색해보세요."
        type="search"
      />
      <button
        aria-label="BNB 루키 검색"
        className="section-rookies-list__search-button"
        type="submit"
      >
        <Search aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
    </form>
  )
}

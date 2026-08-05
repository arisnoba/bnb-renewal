'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import type { CenterSlug } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'

type ArtistPressSearchFormProps = {
  center: CenterSlug
  search: string
}

export function ArtistPressSearchForm({ center, search }: ArtistPressSearchFormProps) {
  const router = useRouter()

  return (
    <form
      action={`${centerPublicHref(center, '/artist-press')}#artist-press-list-results`}
      className="section-artist-press-list__search flex h-[38px] w-full items-center overflow-hidden rounded-full border border-black/40 bg-white transition-[border-color,box-shadow] focus-within:border-black focus-within:shadow-[0_0_0_3px_rgb(34_34_34_/_8%)] md:ml-auto md:h-[45px] md:w-[360px] md:flex-[0_0_360px]"
      method="get"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const searchQuery = String(formData.get('search') ?? '').trim().replace(/\s+/g, ' ')
        const params = new URLSearchParams()

        if (searchQuery) {
          params.set('search', searchQuery)
        }

        const query = params.toString()

        router.push(
          centerPublicHref(
            center,
            `/artist-press${query ? `?${query}` : ''}#artist-press-list-results`,
          ),
        )
      }}
      role="search"
    >
      <input
        aria-label="출신 아티스트 검색어"
        className="section-artist-press-list__search-input h-full min-w-0 flex-1 border-0 bg-transparent px-5 type-title-m font-normal leading-[1.4] text-black outline-none placeholder:text-black/40"
        defaultValue={search}
        name="search"
        placeholder="이름을 검색해보세요."
        type="search"
      />
      <button
        aria-label="출신 아티스트 검색"
        className="section-artist-press-list__search-button flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-black p-0 text-white md:size-[45px]"
        type="submit"
      >
        <Search aria-hidden="true" size={18} strokeWidth={2.4} />
      </button>
    </form>
  )
}

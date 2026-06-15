import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media/Renderer'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { CenterSlug } from '@/lib/centers'
import type { Profile } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

import { FilterChips } from '../_components/FilterChips'

const ITEMS_PER_PAGE = 16

const rookieFilters = [
  { key: 'women', label: 'Women' },
  { key: 'men', label: 'Men' },
] as const

type RookieFilter = (typeof rookieFilters)[number]['key']

type RookiesArchiveProps = {
  activeFilter?: string
  center: CenterSlug
  page?: number
}

export async function RookiesArchive({ activeFilter, center, page = 1 }: RookiesArchiveProps) {
  const payload = await getPayload({ config: configPromise })
  const currentPage = Math.max(1, page)
  const filter = normalizeRookieFilter(activeFilter)
  const decoIcons = getPageDecoIcons(3, `rookies-${center}`)
  const where: Where = {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        or: [
          {
            centers: {
              contains: center,
            },
          },
          {
            centers: {
              contains: 'all',
            },
          },
        ],
      },
      ...(filter
        ? [
            {
              filter: {
                equals: filter,
              },
            },
          ]
        : []),
    ],
  }

  const rookies = await payload
    .find({
      collection: 'profiles',
      depth: 1,
      limit: ITEMS_PER_PAGE,
      overrideAccess: false,
      page: currentPage,
      select: {
        englishName: true,
        filter: true,
        height: true,
        name: true,
        profileImageMedia: true,
        profileImagePath: true,
        slug: true,
        weight: true,
      },
      where,
    })
    .catch(() => ({
      docs: [],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }))

  const totalPages = Math.max(rookies.totalPages || 1, 1)
  const filterItems = [
    {
      active: !filter,
      href: rookiesArchiveHref({ center }),
      label: 'ALL',
    },
    ...rookieFilters.map((item) => ({
      active: filter === item.key,
      href: rookiesArchiveHref({ center, filter: item.key }),
      label: item.label,
    })),
  ]

  return (
    <main
      className="page page-light page-rookies-archive"
      data-center={center}
      data-page-tone="dark"
    >
      <section className="section-rookies-hero" aria-labelledby="rookies-hero-title">
        <div className="section-rookies-hero__background" aria-hidden="true" />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--left"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--center"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="section-rookies-hero__deco section-rookies-hero__deco--right"
          icon={decoIcons[2]}
        />
        <div className="section-rookies-hero__content">
          <p className="section-rookies-hero__eyebrow type-display-xl font-extrabold leading-[1.2]">
            매니지먼트
          </p>
          <h1
            id="rookies-hero-title"
            className="section-rookies-hero__title type-display-xl font-extrabold leading-[1.2]"
          >
            BNB 루키
          </h1>
        </div>
      </section>

      <section className="section-rookies-list" aria-labelledby="rookies-list-title">
        <div className="section-rookies-list__container">
          <header className="section-rookies-list__head">
            <p className="section-rookies-list__eyebrow type-title-l font-bold leading-[1.4]">
              BNB 루키
            </p>
            <h2
              id="rookies-list-title"
              className="section-rookies-list__title type-display-l font-bold leading-[1.35]"
            >
              배우의 가능성은 준비에서 시작되지만,
              <br />
              결국은 더 좋은 기회를 만나는 순간 완성됩니다.
            </h2>
            <p className="section-rookies-list__description type-body-m leading-normal">
              배우앤배움 EnM 매니지먼트팀은 수강생 한 명 한 명이 더 나은 작품과 소속사를 만날 수 있도록 체계적인 매니지먼트와 연결을 지원합니다.
            </p>
          </header>

          <div className="section-rookies-list__content">
            <FilterChips
              ariaLabel="BNB 루키 성별 필터"
              className="section-rookies-list__tabs"
              itemClassName="section-rookies-list__tab type-title-m font-bold leading-[1.4]"
              items={filterItems}
              tone="brand"
            />

            {rookies.docs.length === 0 ? (
              <p className="section-rookies-list__empty type-title-s font-semibold">
                등록된 BNB 루키가 없습니다.
              </p>
            ) : (
              <div className="section-rookies-list__grid">
                {rookies.docs.map((profile) => (
                  <RookieCard center={center} key={profile.id} profile={profile} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <RookiesPagination
                center={center}
                filter={filter}
                page={Math.min(rookies.page || currentPage, totalPages)}
                totalPages={totalPages}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export function rookiesArchiveMetadata(): Metadata {
  return {
    title: 'BNB 루키',
  }
}

function RookieCard({
  center,
  profile,
}: {
  center: CenterSlug
  profile: Partial<Profile> & Pick<Profile, 'id' | 'name' | 'slug'>
}) {
  const media = profile.profileImageMedia
  const hasMediaImage = media && typeof media === 'object'
  const legacyImagePath = profile.profileImagePath || undefined
  const profileMeta = [profile.height, profile.weight].filter(Boolean).join(', ')

  return (
    <Link className="section-rookies-card" href={`/${center}/profiles/${encodeURIComponent(profile.slug)}`}>
      <article className="section-rookies-card__inner">
        <div className="section-rookies-card__media">
          {hasMediaImage ? (
            <Media
              fill
              htmlElement={null}
              imgClassName="section-rookies-card__image"
              pictureClassName="section-rookies-card__picture"
              resource={media}
              size="(max-width: 767px) 46vw, (max-width: 1279px) 30vw, 268px"
            />
          ) : legacyImagePath ? (
            <Image
              alt={profile.name}
              className="section-rookies-card__image"
              fill
              sizes="(max-width: 767px) 46vw, (max-width: 1279px) 30vw, 268px"
              src={legacyImagePath}
              unoptimized
            />
          ) : (
            <div className="section-rookies-card__placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="section-rookies-card__overlay" aria-hidden="true" />
        <div className="section-rookies-card__info">
          <div className="section-rookies-card__names">
            <p className="section-rookies-card__name type-title-m font-bold leading-[1.4]">
              {profile.name}
            </p>
            {profile.englishName && (
              <p className="section-rookies-card__english type-label-l font-semibold leading-[1.2]">
                {profile.englishName}
              </p>
            )}
          </div>
          {profileMeta && (
            <p className="section-rookies-card__meta type-body-s leading-normal">{profileMeta}</p>
          )}
        </div>
      </article>
    </Link>
  )
}

function RookiesPagination({
  center,
  filter,
  page,
  totalPages,
}: {
  center: CenterSlug
  filter?: RookieFilter
  page: number
  totalPages: number
}) {
  const pages = paginationItems(page, totalPages)

  return (
    <Pagination className="section-rookies-pagination">
      <PaginationContent className="section-rookies-pagination__content">
        <PaginationItem>
          <PaginationLink
            disabled={page <= 1}
            href={rookiesArchiveHref({ center, filter, page: page - 1 })}
            label="이전"
          />
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={typeof item === 'number' ? item : `ellipsis-${index}`}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="section-rookies-pagination__ellipsis type-label-m font-medium leading-none" />
            ) : (
              <PaginationLink
                active={item === page}
                href={rookiesArchiveHref({ center, filter, page: item })}
                label={String(item)}
              />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationLink
            disabled={page >= totalPages}
            href={rookiesArchiveHref({ center, filter, page: page + 1 })}
            label="다음"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function PaginationLink({
  active,
  disabled,
  href,
  label,
}: {
  active?: boolean
  disabled?: boolean
  href: string
  label: string
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="section-rookies-pagination__link type-label-m font-medium leading-none"
        data-disabled="true"
      >
        {label}
      </span>
    )
  }

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className="section-rookies-pagination__link type-label-m font-medium leading-none"
      data-active={active ? 'true' : undefined}
      href={href}
    >
      {label}
    </Link>
  )
}

function rookiesArchiveHref({
  center,
  filter,
  page,
}: {
  center: CenterSlug
  filter?: RookieFilter
  page?: number
}) {
  const params = new URLSearchParams()

  if (filter) {
    params.set('filter', filter)
  }

  if (page && page > 1) {
    params.set('page', String(page))
  }

  const query = params.toString()

  return `/${center}/rookies${query ? `?${query}` : ''}`
}

function normalizeRookieFilter(value: string | undefined): RookieFilter | undefined {
  return rookieFilters.some((filter) => filter.key === value) ? (value as RookieFilter) : undefined
}

function paginationItems(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, page - 1, page, page + 1, totalPages])
  const sorted = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []

  for (const item of sorted) {
    const previous = items[items.length - 1]

    if (typeof previous === 'number' && item - previous > 1) {
      items.push('ellipsis')
    }

    items.push(item)
  }

  return items
}

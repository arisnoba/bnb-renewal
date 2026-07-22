import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { getArtistHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { Media } from '@/components/Media/Renderer'
import { PageIntro } from '@/components/PageIntro'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { CenterSlug } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'
import type { ArtistPress } from '@/payload-types'
import {
  getArtistPressAgencyLogoMedia,
  getArtistPressThumbnailMedia,
  getArtistPressUrl,
} from '@/utilities/artistPressFallbacks'
import { publishedArtistPressWhere } from '@/utilities/artistPressVisibility'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload } from 'payload'

const ITEMS_PER_PAGE = 16
export const artistPressArchiveDepth = 2
export const artistPressArchiveSelect = {
  actorName: true,
  agency: true,
  agencyLogoMedia: true,
  generation: true,
  meta: true,
  publishedAt: true,
  slug: true,
  thumbnailMedia: true,
  title: true,
} as const

type ArtistPressArchiveProps = {
  center: CenterSlug
  page?: number
}

export async function ArtistPressArchive({ center, page = 1 }: ArtistPressArchiveProps) {
  const currentPage = Math.max(1, page)
  const decoIcons = getPageDecoIcons(3, `artist-press-${center}`)
  const artistPress = await getCachedArtistPressPage(center, currentPage)

  const totalPages = Math.max(artistPress.totalPages || 1, 1)

  return (
    <main
      className="page page-light page-artist-press-archive"
      data-center={center}
      data-page-tone="dark"
    >
      <section
        className="section-kv-hero section-kv-hero--compact-title section-artist-press-hero"
        aria-labelledby="artist-press-hero-title"
      >
        <PageHeroImage
          image={getArtistHeroImage(center)}
          className="section-kv-hero__background"
        />
        <div aria-hidden="true" className="section-kv-hero__overlay" />
        <PageDeco
          className="section-kv-hero__deco section-kv-hero__deco--left"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="section-kv-hero__deco section-kv-hero__deco--center"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="section-kv-hero__deco section-kv-hero__deco--right"
          icon={decoIcons[2]}
        />
        <div className="section-kv-hero__content">
          <div
            id="artist-press-hero-title"
            className="section-kv-hero__title page-hero-label"
          >
            <span className="block text-brand">아티스트</span>
            <span className="block">BNB</span>
            <span className="block">출신 아티스트</span>
          </div>
        </div>
      </section>

      <section className="section-artist-press-list" aria-labelledby="artist-press-list-title">
        <div className="section-artist-press-list__container">
          <PageIntro
            className="section-artist-press-list__head"
            description="배우앤배움은 수강생의 데뷔 이전부터 활동하고 있는 현재까지 각 배우의 액팅 코치로서 지속적인 모니터링 및 연기지도를 하고 있습니다."
            descriptionClassName="section-artist-press-list__description"
            eyebrow="BNB출신 아티스트"
            eyebrowClassName="section-artist-press-list__eyebrow"
            id="artist-press-list-title"
            title={'배우앤배움이 배출한\n선배 연기자들의 다양한 소식입니다.'}
            titleClassName="section-artist-press-list__title"
          />

          {artistPress.docs.length === 0 ? (
            <p className="section-artist-press-list__empty type-title-s font-semibold">
              등록된 출신 아티스트 소식이 없습니다.
            </p>
          ) : (
            <div className="section-artist-press-list__grid grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {artistPress.docs.map((item) => (
                <ArtistPressCard
                  artistPress={item}
                  center={center}
                  key={item.id}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <ArtistPressPagination
              center={center}
              page={Math.min(artistPress.page || currentPage, totalPages)}
              totalPages={totalPages}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export function artistPressArchiveMetadata(): Metadata {
  return {
    title: '출신 아티스트',
  }
}

function getCachedArtistPressPage(center: CenterSlug, page: number) {
  return unstable_cache(() => queryArtistPressPage(center, page), ['frontend-artist-press', center, String(page)], {
    revalidate: 600,
    tags: [`frontend_artist_press_${center}`],
  })()
}

async function queryArtistPressPage(center: CenterSlug, page: number) {
  const payload = await getPayload({ config: configPromise })

  return findArtistPressPage({ center, page, payload })
}

export async function findArtistPressPage({
  center,
  page,
  payload,
}: {
  center: CenterSlug
  page: number
  payload: Payload
}) {
  const where = publishedArtistPressWhere(center)

  return payload.find({
    collection: 'artist-press',
    depth: artistPressArchiveDepth,
    limit: ITEMS_PER_PAGE,
    overrideAccess: false,
    page,
    select: artistPressArchiveSelect,
    where,
  })
}

function ArtistPressCard({
  artistPress,
  center,
}: {
  artistPress: Partial<ArtistPress> & Pick<ArtistPress, 'id' | 'slug' | 'title'>
  center: CenterSlug
}) {
  const media = getArtistPressThumbnailMedia(artistPress)
  const agencyLogo = getArtistPressAgencyLogoMedia(artistPress)
  const publishedAt = formatDate(artistPress.publishedAt)
  const actorLabel = [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')

  return (
    <Link
      className="section-artist-press-card"
      href={getArtistPressUrl(artistPress, center)}
      prefetch={false}
    >
      <article className="section-artist-press-card__inner">
        <div className="section-artist-press-card__media">
          {media ? (
            <Media
              fill
              htmlElement={null}
              imgClassName="section-artist-press-card__image"
              pictureClassName="section-artist-press-card__picture"
              resource={media}
              size="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 268px"
            />
          ) : null}
        </div>
        <div className="section-artist-press-card__body">
          <div className="section-artist-press-card__copy">
            {actorLabel && (
              <p className="section-artist-press-card__actor type-title-s font-bold leading-normal">
                {actorLabel}
              </p>
            )}
            {artistPress.title && (
              <p className="section-artist-press-card__description type-body-s leading-normal">
                {artistPress.title}
              </p>
            )}
          </div>
          <div className="section-artist-press-card__agency" aria-hidden="true">
            {agencyLogo ? (
              <Media
                imgClassName="section-artist-press-card__agency-image"
                pictureClassName="section-artist-press-card__agency-picture"
                resource={agencyLogo}
                size="40px"
              />
            ) : (
              <span className="section-artist-press-card__agency-fallback">BNB</span>
            )}
          </div>
        </div>
        {publishedAt && (
          <time
            className="section-artist-press-card__date type-caption-s font-medium leading-[1.35]"
            dateTime={artistPress.publishedAt ?? undefined}
          >
            {publishedAt}
          </time>
        )}
      </article>
    </Link>
  )
}

function ArtistPressPagination({
  center,
  page,
  totalPages,
}: {
  center: CenterSlug
  page: number
  totalPages: number
}) {
  const pages = paginationItems(page, totalPages)

  return (
    <Pagination className="section-artist-press-pagination">
      <PaginationContent className="section-artist-press-pagination__content">
        <PaginationItem>
          <ArtistPressPaginationLink
            disabled={page <= 1}
            href={artistPressArchiveHref({ center, page: page - 1 })}
          >
            이전
          </ArtistPressPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis
                className="section-artist-press-pagination__ellipsis type-label-m font-medium leading-none"
              />
            ) : (
              <ArtistPressPaginationLink
                active={page === item}
                href={artistPressArchiveHref({ center, page: item })}
              >
                {item}
              </ArtistPressPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <ArtistPressPaginationLink
            disabled={page >= totalPages}
            href={artistPressArchiveHref({ center, page: page + 1 })}
          >
            다음
          </ArtistPressPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ArtistPressPaginationLink({
  active,
  children,
  disabled,
  href,
}: {
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  href: string
}) {
  if (disabled) {
    return (
      <span
        className="section-artist-press-pagination__link type-label-m font-medium leading-none"
        data-disabled="true"
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className="section-artist-press-pagination__link type-label-m font-medium leading-none"
      data-active={active ? 'true' : 'false'}
      href={href}
    >
      {children}
    </Link>
  )
}

function artistPressArchiveHref({
  center,
  page,
}: {
  center: CenterSlug
  page?: number
}) {
  const params = new URLSearchParams()

  if (page && page > 1) {
    params.set('page', String(page))
  }

  const query = params.toString()

  return centerPublicHref(center, `/artist-press${query ? `?${query}` : ''}`)
}

function paginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items = new Set<number>([1, totalPages, currentPage])

  if (currentPage > 1) {
    items.add(currentPage - 1)
  }

  if (currentPage < totalPages) {
    items.add(currentPage + 1)
  }

  const sorted = [...items].sort((a, b) => a - b)
  const result: Array<number | 'ellipsis'> = []

  for (const item of sorted) {
    const previous = result[result.length - 1]

    if (typeof previous === 'number' && item - previous > 1) {
      result.push('ellipsis')
    }

    result.push(item)
  }

  return result
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

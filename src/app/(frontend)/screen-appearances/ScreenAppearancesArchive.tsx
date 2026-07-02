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
import type {
  BroadcastStation,
  Media as PayloadMedia,
  Profile,
  ScreenAppearance,
} from '@/payload-types'
import configPromise from '@payload-config'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import React from 'react'

import { getMediaUrl } from '@/utilities/getMediaUrl'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'

import { HeroMosaicDim } from '../_components/HeroMosaicDim'
import { ScreenAppearanceProfileAvatar } from './ScreenAppearanceProfileAvatar.client'
import { screenAppearanceProfileImageUrl } from './screenAppearanceProfileImage'

type ScreenAppearancesArchiveProps = {
  center: CenterSlug
  page?: number
}

type ScreenAppearanceListItem = Pick<
  ScreenAppearance,
  | 'airDateLabel'
  | 'appearanceType'
  | 'actorInputMode'
  | 'bodyImages'
  | 'broadcastStation'
  | 'className'
  | 'createdAt'
  | 'id'
  | 'introText'
  | 'linkedProfiles'
  | 'performerName'
  | 'projectTitle'
  | 'publishedAt'
  | 'roleName'
  | 'slug'
  | 'thumbnailPath'
  | 'title'
>

type ScreenAppearancesPageResult = {
  docs: ScreenAppearanceListItem[]
  page: number
  totalDocs: number
  totalPages: number
}

const pageSize = 12
const heroImageLimit = 24
const heroImagePriorityCount = 6
const listAnchorId = 'screen-appearances-list'
const heroImagePlaceholder =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 3%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23111111%22/%3E%3Cstop offset=%221%22 stop-color=%22%23333333%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%224%22 height=%223%22 fill=%22url(%23g)%22/%3E%3C/svg%3E'

export async function ScreenAppearancesArchive({
  center,
  page = 1,
}: ScreenAppearancesArchiveProps) {
  const currentPage = Math.max(1, page)
  const decoIcons = getPageDecoIcons(3, `screen-appearances-${center}`)
  const [appearances, heroImages] = await Promise.all([
    getCachedScreenAppearancesPage(center, currentPage),
    getCachedScreenAppearancesHeroImages(center),
  ])
  const totalPages = Math.max(appearances.totalPages || 1, 1)
  const safePage = Math.min(appearances.page || currentPage, totalPages)

  return (
    <main className="page page-light page-screen-appearances" data-center={center}>
      <section
        className="section-screen-appearances-hero relative min-h-140 overflow-hidden bg-black md:min-h-200"
        aria-labelledby="screen-appearances-hero-title"
        data-page-tone="dark"
      >
        <HeroImageWall images={heroImages} />
        <HeroMosaicDim />
        <PageDeco
          className="-left-20 top-[36%] md:-left-28"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[12%] md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <div className="container relative flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[142px]">
          <div
            id="screen-appearances-hero-title"
            className="section-screen-appearances-hero__title page-hero-label"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">BNB 출연장면</span>
          </div>
        </div>
      </section>

      <section
        className="section-screen-appearances-list section-p-block-base scroll-mt-(--page-top-offset) bg-white text-neutral-900"
        aria-labelledby="screen-appearances-list-title"
        id={listAnchorId}
      >
        <div className="container">
          <PageIntro
            className="section-screen-appearances-list__head mb-14 md:mb-20"
            description="배우들에 관한 개인정보는 해당 법률의 규정에 따라 보호받고 있습니다."
            descriptionClassName="section-screen-appearances-list__description"
            eyebrow="BNB 출연장면"
            eyebrowClassName="section-screen-appearances-list__eyebrow"
            id="screen-appearances-list-title"
            title={'배우앤배움 수강생들의\n드라마 · 영화 · 광고 촬영장면을 만나보세요.'}
            titleClassName="section-screen-appearances-list__title"
          />

          {appearances.docs.length === 0 ? (
            <p className="section-screen-appearances-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              등록된 출연장면이 없습니다.
            </p>
          ) : (
            <div className="section-screen-appearances-list__grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {appearances.docs.map((appearance) => (
                <ScreenAppearanceCard
                  appearance={appearance}
                  center={center}
                  key={appearance.id}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <ScreenAppearancesPagination
              center={center}
              page={safePage}
              totalPages={totalPages}
            />
          )}
        </div>
      </section>
    </main>
  )
}

function getCachedScreenAppearancesPage(center: CenterSlug, page: number) {
  return unstable_cache(
    () => queryScreenAppearancesPage(center, page),
    ['frontend-screen-appearances', center, String(page)],
    {
      revalidate: 600,
      tags: [`frontend_screen_appearances_${center}`],
    },
  )()
}

function getCachedScreenAppearancesHeroImages(center: CenterSlug) {
  return unstable_cache(
    () => queryScreenAppearancesHeroImages(center),
    ['frontend-screen-appearances-hero-images', center],
    {
      revalidate: 600,
      tags: [`frontend_screen_appearances_${center}`],
    },
  )()
}

async function queryScreenAppearancesPage(center: CenterSlug, page: number) {
  const payload = await getPayload({ config: configPromise })
  const where: Where = {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        centers: {
          equals: center,
        },
      },
    ],
  }

  return findScreenAppearancesPage({
    page,
    payload,
    where,
  })
}

async function queryScreenAppearancesHeroImages(center: CenterSlug) {
  const payload = await getPayload({ config: configPromise })
  const where: Where = {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        centers: {
          equals: center,
        },
      },
    ],
  }

  return findHeroImages({
    payload,
    where,
  })
}

type ScreenAppearanceHeroImage = {
  id: ScreenAppearance['id']
  src: string
}

function HeroImageWall({ images }: { images: ScreenAppearanceHeroImage[] }) {
  if (images.length === 0) {
    return <div className="absolute inset-0 bg-neutral-950" aria-hidden="true" />
  }

  return (
    <div
      aria-hidden="true"
      className="absolute -inset-x-8 -top-12 grid grid-cols-3 gap-2 opacity-70 md:-inset-x-12 md:-top-24 md:grid-cols-6 md:rotate-[-5.5deg] md:scale-110 md:gap-4"
    >
      {images.map((image, index) => (
        <HeroImageTile image={image} index={index} key={`${image.id}-${index}`} />
      ))}
    </div>
  )
}

function HeroImageTile({ image, index }: { image: ScreenAppearanceHeroImage; index: number }) {
  const isPriority = index < heroImagePriorityCount

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-linear-to-br from-neutral-950 to-neutral-800">
      <Image
        alt=""
        className="size-full object-cover grayscale"
        fill
        blurDataURL={heroImagePlaceholder}
        loading={isPriority ? undefined : 'lazy'}
        placeholder="blur"
        priority={isPriority}
        sizes="(max-width: 767px) 34vw, 18vw"
        src={image.src}
      />
    </div>
  )
}

function ScreenAppearanceCard({
  appearance,
  center,
}: {
  appearance: ScreenAppearanceListItem
  center: CenterSlug
}) {
  const projectTitle = appearance.projectTitle?.trim() || appearance.title
  const broadcastStation = getBroadcastStation(appearance.broadcastStation)
  const projectMeta = [broadcastStation?.stationName, getAppearanceTypeLabel(appearance.appearanceType)]
    .filter(Boolean)
    .join(' · ')
  const screenImage = getScreenImage(appearance)
  const thumbnailUrl = screenImage ? '' : normalizeImageUrl(appearance.thumbnailPath)
  const performer = getPerformer(appearance)
  const registrationDate = formatDate(appearance.publishedAt ?? appearance.createdAt)
  const airDate = formatDate(appearance.airDateLabel)
  const detailHref = `/${center}/screen-appearances/${encodeURIComponent(String(appearance.id))}`

  return (
    <Link
      aria-label={`${projectTitle} 출연장면 상세 보기`}
      className="group section-screen-appearances-card flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={detailHref}
      prefetch={false}
    >
      <div className="section-screen-appearances-card__head flex min-h-[76px] items-center gap-3 px-5 py-4">
        <BroadcastStationLogo station={broadcastStation} />
        <div className="section-screen-appearances-card__project min-w-0">
          <p className="line-clamp-1 type-caption-s font-medium leading-[1.2] text-neutral-400">
            {projectMeta}
          </p>
          <h3 className="line-clamp-1 type-title-s font-semibold leading-normal text-neutral-500">
            {projectTitle}
          </h3>
        </div>
      </div>

      <div className="section-screen-appearances-card__media relative aspect-4/3 overflow-hidden bg-neutral-100">
        {thumbnailUrl ? (
          <Image
            alt={`${projectTitle} 대표 이미지`}
            className="size-full object-cover transition duration-300 group-hover:scale-[1.035]"
            fill
            loading="lazy"
            sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 280px"
            src={thumbnailUrl}
            unoptimized
          />
        ) : screenImage ? (
          <Media
            fill
            htmlElement={null}
            imgClassName="size-full object-cover transition duration-300 group-hover:scale-[1.035]"
            pictureClassName="block size-full"
            resource={screenImage}
            size="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 280px"
          />
        ) : (
          <div className="flex size-full items-center justify-center type-label-m font-semibold text-neutral-400">
            NO IMAGE
          </div>
        )}
      </div>

      <div className="section-screen-appearances-card__body flex flex-1 flex-col">
        <div className="section-screen-appearances-card__performer flex flex-1 gap-3 p-5">
          <ScreenAppearanceProfileAvatar
            imageUrl={screenAppearanceProfileImageUrl(performer.profileImageMedia)}
          />
          <div className="min-w-0 flex-1 space-y-1 type-body-s font-medium leading-[1.6] text-neutral-500">
            <p className="line-clamp-1">이름 : {performer.name}</p>
            {performer.className && (
              <p className="line-clamp-1">클래스 : {performer.className}</p>
            )}
            {appearance.roleName && <p className="line-clamp-1">{appearance.roleName}</p>}
            {airDate && <p className="line-clamp-1">방영일 : {airDate}</p>}
            {!appearance.roleName && !airDate && appearance.introText && (
              <p className="line-clamp-2">{appearance.introText}</p>
            )}
          </div>
        </div>
        <div className="section-screen-appearances-card__date mt-auto flex items-center justify-between border-t border-neutral-200 px-5 py-3 type-caption-s font-medium leading-[1.35] text-neutral-400">
          <span>등록일</span>
          {registrationDate ? (
            <time dateTime={appearance.publishedAt ?? appearance.createdAt}>
              {registrationDate}
            </time>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function ScreenAppearancesPagination({
  center,
  page,
  totalPages,
}: {
  center: CenterSlug
  page: number
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination aria-label="출연장면 페이지" className="section-screen-appearances-pagination mt-16 md:mt-20">
      <PaginationContent className="section-screen-appearances-pagination__content gap-1">
        <PaginationItem>
          <ScreenAppearancesPaginationLink
            disabled={page <= 1}
            href={screenAppearancesHref({ center, page: page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
            이전
          </ScreenAppearancesPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="size-9 type-label-m font-medium" />
            ) : (
              <ScreenAppearancesPaginationLink
                active={page === item}
                href={screenAppearancesHref({ center, page: item })}
              >
                {item}
              </ScreenAppearancesPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <ScreenAppearancesPaginationLink
            disabled={page >= totalPages}
            href={screenAppearancesHref({ center, page: page + 1 })}
          >
            다음
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </ScreenAppearancesPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ScreenAppearancesPaginationLink({
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
  const className =
    'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-3 type-label-m font-medium leading-none text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[active=true]:border data-[active=true]:border-neutral-200 data-[active=true]:bg-white data-[active=true]:shadow-sm data-[disabled=true]:pointer-events-none data-[disabled=true]:text-neutral-400'

  if (disabled) {
    return (
      <span className={className} data-disabled="true">
        {children}
      </span>
    )
  }

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={className}
      data-active={active ? 'true' : 'false'}
      href={href}
      prefetch={false}
    >
      {children}
    </Link>
  )
}

async function findScreenAppearancesPage({
  page,
  payload,
  where,
}: {
  page: number
  payload: Awaited<ReturnType<typeof getPayload>>
  where: Where
}): Promise<ScreenAppearancesPageResult> {
  const result = await payload
    .find({
      collection: 'screen-appearances',
      depth: 2,
      limit: pageSize,
      overrideAccess: false,
      page,
      select: screenAppearancesArchiveSelect,
      sort: '-publishedAt',
      where,
    })
    .catch(() => ({
      docs: [],
      page,
      totalDocs: 0,
      totalPages: 0,
    }))

  return {
    docs: result.docs as ScreenAppearanceListItem[],
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

async function findHeroImages({
  payload,
  where,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  where: Where
}): Promise<ScreenAppearanceHeroImage[]> {
  const result = await payload
    .find({
      collection: 'screen-appearances',
      depth: 1,
      limit: heroImageLimit,
      overrideAccess: false,
      pagination: false,
      select: {
        bodyImages: true,
        id: true,
        thumbnailPath: true,
      },
      sort: '-publishedAt',
      where,
    })
    .catch(() => ({
      docs: [],
    }))

  return result.docs
    .map((appearance) => {
      const item = appearance as Pick<ScreenAppearance, 'bodyImages' | 'id' | 'thumbnailPath'>
      const src = screenAppearanceImageUrl(item)

      if (!src) {
        return null
      }

      return {
        id: item.id,
        src,
      }
    })
    .filter((image): image is ScreenAppearanceHeroImage => Boolean(image))
}

const screenAppearancesArchiveSelect = {
  airDateLabel: true,
  appearanceType: true,
  actorInputMode: true,
  bodyImages: true,
  broadcastStation: true,
  className: true,
  createdAt: true,
  introText: true,
  linkedProfiles: true,
  performerName: true,
  projectTitle: true,
  publishedAt: true,
  roleName: true,
  slug: true,
  thumbnailPath: true,
  title: true,
} as const

type PerformerInfo = {
  className?: string | null
  name: string
  profileImageMedia?: PayloadMedia | null
}

function BroadcastStationLogo({ station }: { station?: BroadcastStation | null }) {
  const logoMedia = station?.logoMedia && typeof station.logoMedia === 'object' ? station.logoMedia : null

  if (logoMedia) {
    return (
      <span className="section-screen-appearances-card__broadcast-logo relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
        <Media
          fill
          htmlElement={null}
          imgClassName="size-full object-contain"
          pictureClassName="block size-full"
          resource={logoMedia}
          size="40px"
        />
      </span>
    )
  }

  return (
    <span className="section-screen-appearances-card__mark flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white type-caption-s font-bold leading-none text-brand">
      BNB
    </span>
  )
}

function getBroadcastStation(value: ScreenAppearanceListItem['broadcastStation']) {
  return value && typeof value === 'object' ? value : null
}

function getPerformer(appearance: ScreenAppearanceListItem): PerformerInfo {
  if (appearance.actorInputMode === 'manual') {
    return {
      className: normalizeText(appearance.className),
      name: appearance.performerName?.trim() || '배우앤배움 수강생',
    }
  }

  const profiles = appearance.linkedProfiles
    ?.filter((profile): profile is Profile => typeof profile === 'object' && profile !== null)
    .filter((profile) => Boolean(profile.name))
  const profile = profiles?.[0]
  const names = profiles?.map((item) => item.name).join(', ')

  return {
    className: getProfileClassName(profiles) || normalizeText(appearance.className),
    name: names || appearance.performerName?.trim() || '배우앤배움 수강생',
    profileImageMedia:
      profile?.profileImageMedia && typeof profile.profileImageMedia === 'object'
        ? profile.profileImageMedia
        : null,
  }
}

function getProfileClassName(profiles: Profile[] | undefined) {
  const classNames = profiles
    ?.map((profile) => normalizeText(profile.className))
    .filter((className): className is string => Boolean(className))

  return classNames && classNames.length > 0 ? Array.from(new Set(classNames)).join(', ') : null
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

function getScreenImage(
  appearance: Pick<ScreenAppearance, 'bodyImages'> | ScreenAppearanceListItem,
) {
  const image = appearance.bodyImages?.find((item) => typeof item.image === 'object')?.image

  return image && typeof image === 'object' ? image : null
}

function mediaResourceUrl(resource: PayloadMedia | null | undefined) {
  return resource?.url ? getMediaUrl(resource.url, resource.updatedAt) : ''
}

function screenAppearanceImageUrl(
  appearance: Pick<ScreenAppearance, 'bodyImages' | 'thumbnailPath'> | ScreenAppearanceListItem,
) {
  return mediaResourceUrl(getScreenImage(appearance)) || normalizeImageUrl(appearance.thumbnailPath)
}

function getAppearanceTypeLabel(value: ScreenAppearance['appearanceType']) {
  if (value === 'commercial') {
    return '광고 출연장면'
  }

  if (value === 'movie') {
    return '영화 출연장면'
  }

  return '드라마 출연장면'
}

function screenAppearancesHref({ center, page }: { center: CenterSlug; page?: number }) {
  if (!page || page <= 1) {
    return `/${center}/screen-appearances#${listAnchorId}`
  }

  return `/${center}/screen-appearances?page=${page}#${listAnchorId}`
}

function paginationWindow(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis' as const, totalPages]
  }

  if (page >= totalPages - 3) {
    return [
      1,
      'ellipsis' as const,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [1, 'ellipsis' as const, page - 1, page, page + 1, 'ellipsis' as const, totalPages]
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = publishedImageSrc(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

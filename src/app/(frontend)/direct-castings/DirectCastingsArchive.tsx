import { Media } from '@/components/Media/Renderer'
import { PageIntro } from '@/components/PageIntro'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { CenterSlug } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'
import type { DirectCasting, Media as PayloadMedia } from '@/payload-types'
import configPromise from '@payload-config'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'

import { HeroMosaicDim } from '../_components/HeroMosaicDim'

type DirectCastingsArchiveProps = {
  center: CenterSlug
  company?: string
  page?: number
}

const queryableDirectCastingCompanies = [
  'arko-lab',
  'bnb-casting',
  'bx-model-agency',
  'cna-agency',
  'imground',
] as const

type QueryableDirectCastingCompany = (typeof queryableDirectCastingCompanies)[number]
type DirectCastingCompany = QueryableDirectCastingCompany | 'cna-agency'

type DirectCastingListItem = Pick<
  DirectCasting,
  | 'company'
  | 'createdAt'
  | 'id'
  | 'projectInfo'
  | 'publishedAt'
  | 'slug'
  | 'thumbnailMedia'
  | 'title'
  | 'yearLabel'
>

type DirectCastingsPageResult = {
  docs: DirectCastingListItem[]
  page: number
  totalDocs: number
  totalPages: number
}

type DirectCastingCompanyTab = {
  label: string
  value: 'all' | DirectCastingCompany
}

type DirectCastingCompanyOnlyTab = {
  label: string
  value: DirectCastingCompany
}

const pageSize = 16
const heroImageLimit = 18
const heroImagePriorityCount = 6
const listAnchorId = 'direct-castings-list'

const directCastingCompanyTabs = [
  { label: 'BNB Casting', value: 'bnb-casting' },
  { label: 'CNA Agency', value: 'cna-agency' },
  { label: 'ARKO Lab', value: 'arko-lab' },
  { label: 'IMGround', value: 'imground' },
  { label: 'BX Model Agency', value: 'bx-model-agency' },
] as const satisfies readonly DirectCastingCompanyOnlyTab[]

const defaultDirectCastingCompanies = [
  'bnb-casting',
  'cna-agency',
  'arko-lab',
  'bx-model-agency',
] as const satisfies readonly DirectCastingCompany[]

const directCastingCompaniesByCenter: Partial<Record<CenterSlug, readonly DirectCastingCompany[]>> = {
  art: defaultDirectCastingCompanies,
  avenue: defaultDirectCastingCompanies,
  highteen: ['bnb-casting', 'cna-agency', 'arko-lab', 'imground', 'bx-model-agency'],
  kids: ['bnb-casting', 'cna-agency', 'arko-lab', 'imground', 'bx-model-agency'],
}

const queryableCompanies = new Set<string>(queryableDirectCastingCompanies)

export async function DirectCastingsArchive({
  center,
  company,
  page = 1,
}: DirectCastingsArchiveProps) {
  const currentPage = Math.max(1, page)
  const activeCompany = parseDirectCastingCompany(center, company)
  const [castings, heroImages] = await Promise.all([
    getCachedDirectCastingsPage({
      center,
      company: activeCompany,
      page: currentPage,
    }),
    getCachedDirectCastingsHeroImages(center),
  ])
  const totalPages = Math.max(castings.totalPages || 1, 1)
  const safePage = Math.min(castings.page || currentPage, totalPages)

  return (
    <main className="page page-light page-direct-castings" data-center={center}>
      <section
        aria-labelledby="direct-castings-hero-title"
        className="section-kv-hero section-kv-hero--standard section-direct-castings-hero overflow-hidden"
        data-page-tone="dark"
      >
        <DirectCastingsHero images={heroImages} />
        <HeroMosaicDim />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[120px]">
          <div
            className="section-direct-castings-hero__title page-hero-label"
            id="direct-castings-hero-title"
          >
            <span className="block text-brand">캐스팅</span>
            <span className="block">다이렉트 캐스팅</span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="direct-castings-list-title"
        className="section-direct-castings-list section-p-block-base scroll-mt-(--page-top-offset) bg-white text-neutral-900"
        id={listAnchorId}
      >
        <div className="container">
          <PageIntro
            className="section-direct-castings-list__head mb-12 md:mb-16"
            eyebrow="DIRECT CASTING"
            eyebrowClassName="section-direct-castings-list__eyebrow"
            id="direct-castings-list-title"
            title={'작품별 엔딩 크레딧과\n캐스팅 이력을 확인해보세요.'}
            titleClassName="section-direct-castings-list__title"
          />

          <DirectCastingTabs activeCompany={activeCompany} center={center} />

          {castings.docs.length > 0 ? (
            <div className="section-direct-castings-list__grid mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-12">
              {castings.docs.map((casting, index) => (
                <DirectCastingCard
                  casting={casting}
                  center={center}
                  key={casting.id}
                  priority={index < 8}
                />
              ))}
            </div>
          ) : (
            <p className="section-direct-castings-list__empty mt-10 border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500 md:mt-12">
              등록된 다이렉트 캐스팅이 없습니다.
            </p>
          )}

          {totalPages > 1 && (
            <DirectCastingsPagination
              center={center}
              company={activeCompany}
              page={safePage}
              totalPages={totalPages}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export function getDirectCastingCompanyLabel(value: DirectCastingCompany) {
  return directCastingCompanyTabs.find((tab) => tab.value === value)?.label ?? value
}

export function getDirectCastingCompanyLabels(
  value: DirectCasting['company'] | DirectCastingCompany | null | undefined,
) {
  return directCastingCompanyValues(value).map((company) => getDirectCastingCompanyLabel(company))
}

export function directCastingCompanyQueryValue(value: string) {
  if (value === 'im-ground') {
    return 'imground'
  }

  return value
}

function DirectCastingTabs({
  activeCompany,
  center,
}: {
  activeCompany: 'all' | DirectCastingCompany
  center: CenterSlug
}) {
  const tabs = getDirectCastingTabs(center)

  return (
    <nav
      aria-label="다이렉트 캐스팅 회사"
      className="section-direct-castings-list__tabs overflow-x-auto border-b border-neutral-200"
    >
      <div className="flex min-w-max items-center gap-10">
        {tabs.map((tab) => {
          const active = activeCompany === tab.value

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className="section-direct-castings-list__tab relative inline-flex min-h-16 items-center px-1 type-title-l font-bold leading-[1.4] text-neutral-900/40 transition hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-[active=true]:text-brand"
              data-active={active ? 'true' : 'false'}
              href={directCastingsHref({ center, company: tab.value })}
              key={tab.value}
            >
              {tab.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.75 bg-brand"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function DirectCastingCard({
  casting,
  center,
  priority,
}: {
  casting: DirectCastingListItem
  center: CenterSlug
  priority: boolean
}) {
  const media = getThumbnailMedia(casting.thumbnailMedia)
  const projectInfo = projectInfoLines(casting.projectInfo)
  const companyLabel = getDirectCastingCompanyLabels(casting.company).join(' · ')
  const href = centerPublicHref(center, `/direct-castings/${encodeURIComponent(String(casting.id))}`)

  return (
    <Link
      aria-label={`${casting.title} 엔딩크레딧 보기`}
      className="group section-direct-casting-card relative block overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={href}
      prefetch={false}
    >
      <div className="section-direct-casting-card__media relative aspect-[265/380] overflow-hidden">
        {media ? (
          <Media
            alt={`${casting.title} 대표 이미지`}
            fadeIn
            fill
            htmlElement={null}
            imgClassName="size-full object-cover transition duration-300 group-hover:scale-[1.035]"
            loading={priority ? 'eager' : 'lazy'}
            pictureClassName="block size-full"
            placeholder="empty"
            priority={priority}
            resource={media}
            size="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 280px"
          />
        ) : (
          <div className="flex size-full items-center justify-center type-label-m font-semibold text-neutral-400">
            NO IMAGE
          </div>
        )}
      </div>
      <div className="section-direct-casting-card__overlay absolute inset-0 flex items-center justify-center bg-black/78 p-5 text-center text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
        <div className="flex max-w-full flex-col items-center gap-5">
          <div>
            <p className="line-clamp-2 type-title-l font-bold leading-[1.4]">
              {casting.title}
            </p>
            <div className="mt-4 space-y-1 whitespace-pre-line type-body-m font-medium leading-normal">
              {projectInfo.length > 0 ? (
                projectInfo.slice(0, 3).map((line) => <p key={line}>{line}</p>)
              ) : (
                <p>캐스팅: {companyLabel}</p>
              )}
            </div>
          </div>
          <span className="inline-flex border border-white px-3 py-2 type-label-s font-bold leading-[1.2] tracking-[0.02em]">
            엔딩크레딧 보기
          </span>
        </div>
      </div>
    </Link>
  )
}

function getCachedDirectCastingsPage({
  center,
  company,
  page,
}: {
  center: CenterSlug
  company: 'all' | DirectCastingCompany
  page: number
}) {
  return unstable_cache(
    () => queryDirectCastingsPage({ center, company, page }),
    ['frontend-direct-castings', center, company, String(page)],
    {
      revalidate: 600,
      tags: [`frontend_direct_castings_${center}`],
    },
  )()
}

function getCachedDirectCastingsHeroImages(center: CenterSlug) {
  return unstable_cache(
    () => queryDirectCastingsHeroImages(center),
    ['frontend-direct-castings-hero-images', center],
    {
      revalidate: 600,
      tags: [`frontend_direct_castings_${center}`],
    },
  )()
}

async function queryDirectCastingsPage({
  center,
  company,
  page,
}: {
  center: CenterSlug
  company: 'all' | DirectCastingCompany
  page: number
}) {
  const payload = await getPayload({ config: configPromise })
  const where = directCastingsWhere({ center, company })

  return findDirectCastingsPage({
    page,
    payload,
    where,
  })
}

async function queryDirectCastingsHeroImages(center: CenterSlug) {
  const payload = await getPayload({ config: configPromise })

  return findHeroImages({
    center,
    payload,
  })
}

function DirectCastingsHero({ images }: { images: DirectCastingHeroImage[] }) {
  if (images.length === 0) {
    return <div className="absolute inset-0 bg-neutral-950" aria-hidden="true" />
  }

  return (
    <div
      aria-hidden="true"
      className="section-direct-castings-hero__visual absolute -inset-x-10 -top-12 grid grid-cols-3 gap-2 opacity-55 md:-inset-x-16 md:-top-28 md:grid-cols-6 md:rotate-[-5deg] md:scale-110 md:gap-4"
    >
      {images.map((image, index) => (
        <div
          className="section-direct-castings-hero__poster relative aspect-[265/380] overflow-hidden rounded-xl bg-neutral-900"
          key={`${image.id}-${index}`}
        >
          <Media
            alt=""
            fill
            htmlElement={null}
            imgClassName="size-full object-cover grayscale"
            loading="eager"
            pictureClassName="block size-full"
            placeholder="blur"
            priority={index < heroImagePriorityCount}
            resource={image.media}
            size="(max-width: 767px) 34vw, 18vw"
          />
        </div>
      ))}
    </div>
  )
}

function DirectCastingsPagination({
  center,
  company,
  page,
  totalPages,
}: {
  center: CenterSlug
  company: 'all' | DirectCastingCompany
  page: number
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination aria-label="다이렉트 캐스팅 페이지" className="section-direct-castings-pagination mt-16 md:mt-20">
      <PaginationContent className="section-direct-castings-pagination__content gap-1">
        <PaginationItem>
          <DirectCastingsPaginationLink
            disabled={page <= 1}
            href={directCastingsHref({ center, company, page: page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
            이전
          </DirectCastingsPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="size-9 type-label-m font-medium" />
            ) : (
              <DirectCastingsPaginationLink
                active={page === item}
                href={directCastingsHref({ center, company, page: item })}
              >
                {item}
              </DirectCastingsPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <DirectCastingsPaginationLink
            disabled={page >= totalPages}
            href={directCastingsHref({ center, company, page: page + 1 })}
          >
            다음
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </DirectCastingsPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function DirectCastingsPaginationLink({
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
    >
      {children}
    </Link>
  )
}

export async function findDirectCastingsPage({
  page,
  payload,
  where,
}: {
  page: number
  payload: Awaited<ReturnType<typeof getPayload>>
  where: Where
}): Promise<DirectCastingsPageResult> {
  const result = await payload.find({
    collection: 'direct-castings',
    depth: 1,
    limit: pageSize,
    overrideAccess: true,
    page,
    select: directCastingArchiveSelect,
    sort: '-publishedAt',
    where,
  })

  return {
    docs: result.docs as DirectCastingListItem[],
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

type DirectCastingHeroImage = {
  id: DirectCasting['id']
  media: PayloadMedia
}

export async function findHeroImages({
  center,
  payload,
}: {
  center: CenterSlug
  payload: Awaited<ReturnType<typeof getPayload>>
}): Promise<DirectCastingHeroImage[]> {
  const result = await payload.find({
    collection: 'direct-castings',
    depth: 1,
    limit: heroImageLimit,
    overrideAccess: true,
    pagination: false,
    select: {
      thumbnailMedia: true,
    },
    sort: '-publishedAt',
    where: directCastingsWhere({ center, company: 'all' }),
  })

  return result.docs
    .map((casting) => {
      const item = casting as Pick<DirectCasting, 'id' | 'thumbnailMedia'>
      const media = getThumbnailMedia(item.thumbnailMedia)

      if (!media) {
        return null
      }

      return {
        id: item.id,
        media,
      }
    })
    .filter((image): image is DirectCastingHeroImage => Boolean(image))
}

const directCastingArchiveSelect = {
  company: true,
  createdAt: true,
  projectInfo: true,
  publishedAt: true,
  slug: true,
  thumbnailMedia: true,
  title: true,
  yearLabel: true,
} as const

function directCastingsWhere({
  center,
  company,
}: {
  center: CenterSlug
  company: 'all' | DirectCastingCompany
}): Where {
  const filters: Where[] = [
    {
      displayStatus: {
        equals: 'published',
      },
    },
    {
      centers: {
        contains: center,
      },
    },
  ]

  if (isQueryableCompany(company)) {
    filters.push({
      company: {
        contains: company,
      },
    })
  } else if (company !== 'all') {
    filters.push({
      id: {
        equals: -1,
      },
    })
  }

  return {
    and: filters,
  }
}

function parseDirectCastingCompany(
  center: CenterSlug,
  value: string | undefined,
): 'all' | DirectCastingCompany {
  const normalized = directCastingCompanyQueryValue(value?.trim() ?? '')
  const visibleCompanies = new Set(getDirectCastingCompanies(center))

  return normalized !== 'all' && visibleCompanies.has(normalized as DirectCastingCompany)
    ? (normalized as 'all' | DirectCastingCompany)
    : 'all'
}

function getDirectCastingTabs(center: CenterSlug): DirectCastingCompanyTab[] {
  return [
    { label: 'ALL', value: 'all' },
    ...getDirectCastingCompanies(center)
      .map((company) => directCastingCompanyTabs.find((tab) => tab.value === company))
      .filter((tab): tab is (typeof directCastingCompanyTabs)[number] => Boolean(tab)),
  ]
}

function getDirectCastingCompanies(center: CenterSlug) {
  return directCastingCompaniesByCenter[center] ?? defaultDirectCastingCompanies
}

function isQueryableCompany(value: 'all' | DirectCastingCompany): value is QueryableDirectCastingCompany {
  return queryableCompanies.has(value)
}

function getThumbnailMedia(value: DirectCasting['thumbnailMedia']) {
  return value && typeof value === 'object' ? value : null
}

function projectInfoLines(value: string | null | undefined) {
  return (
    value
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean) ?? []
  )
}

export function directCastingCompanyValues(
  value: DirectCasting['company'] | DirectCastingCompany | null | undefined,
): DirectCastingCompany[] {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values.filter((company): company is DirectCastingCompany =>
    directCastingCompanyTabs.some((tab) => tab.value === company),
  )
}

function directCastingsHref({
  center,
  company,
  page,
}: {
  center: CenterSlug
  company?: 'all' | DirectCastingCompany
  page?: number
}) {
  const params = new URLSearchParams()

  if (company && company !== 'all') {
    params.set('company', company)
  }

  if (page && page > 1) {
    params.set('page', String(page))
  }

  const query = params.toString()

  return centerPublicHref(center, `/direct-castings${query ? `?${query}` : ''}#${listAnchorId}`)
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

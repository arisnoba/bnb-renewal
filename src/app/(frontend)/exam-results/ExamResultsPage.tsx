import { getExamResultsHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { PageIntro } from '@/components/PageIntro'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { ExamResult } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'
import configPromise from '@payload-config'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload, type Payload, type Where } from 'payload'
import type { ReactNode } from 'react'

type ExamResultType = ExamResult['resultType']

type ExamResultPageProps = {
  page?: number
  resultType: ExamResultType
}

type ExamResultListItem = Pick<
  ExamResult,
  'id' | 'thumbnailPath' | 'title'
>

type ExamResultPageConfig = {
  description: [string, string]
  emptyLabel: string
  eyebrow: string
  heroTitle: string
  title: string
}

const listAnchorId = 'exam-results-list'
const pageSize = 16

const examResultSelect = {
  createdAt: true,
  publishedAt: true,
  resultType: true,
  slug: true,
  thumbnailPath: true,
  title: true,
} as const

const pageConfigByType = {
  university: {
    description: [
      '철저한 학생관리를 통해 다수 합격생 배출 달성!',
      '배우앤배움 입시센터의 최강 합격 신화는 올해도 계속됩니다.',
    ],
    emptyLabel: '등록된 대학교 합격현황이 없습니다.',
    eyebrow: '대학교 합격현황',
    heroTitle: '대학교',
    title: '체계적인 교육과 학생 관리를 통해\n수많은 합격의 결과를 만들어가고 있습니다.',
  },
  arts_high_school: {
    description: [
      '철저한 학생관리를 통해 다수 합격생 배출 달성!',
      '배우앤배움 입시센터의 최강 합격 신화는 올해도 계속됩니다.',
    ],
    emptyLabel: '등록된 예술고등학교 합격현황이 없습니다.',
    eyebrow: '예술고등학교 합격현황',
    heroTitle: '예술고등학교',
    title: '체계적인 교육과 학생 관리를 통해\n수많은 합격의 결과를 만들어가고 있습니다.',
  },
} satisfies Record<ExamResultType, ExamResultPageConfig>

export async function ExamResultsPage({ page = 1, resultType }: ExamResultPageProps) {
  const config = pageConfigByType[resultType]
  const decoIcons = getPageDecoIcons(3, `exam-results-${resultType}`)
  const resultsPage = await getCachedExamResultsPage({ page, resultType })
  const safePage = Math.min(resultsPage.page || page, Math.max(resultsPage.totalPages, 1))

  return (
    <main className="page page-light page-exam-results" data-center="exam">
      <section
        aria-labelledby="exam-results-hero-title"
        className="section-exam-results-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <PageHeroImage image={getExamResultsHeroImage()} className="opacity-60" />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <PageDeco
          className="-left-20 top-[36%] max-md:hidden! md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:hidden! md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] max-md:hidden! md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[120px]">
          <div className="section-exam-results-hero__title-wrap">
            <div
              className="section-exam-results-hero__title page-hero-label"
              id="exam-results-hero-title"
            >
              <span className="block text-brand">합격현황</span>
              <span className="block">{config.heroTitle}</span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exam-results-list-title"
        className="section-exam-results-list section-p-block-base bg-white text-neutral-900"
        id={listAnchorId}
      >
        <div className="container">
          <PageIntro
            className="section-exam-results-list__head mb-16 md:mb-20"
            description={config.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
            descriptionClassName="section-exam-results-list__description"
            eyebrow={config.eyebrow}
            eyebrowClassName="section-exam-results-list__eyebrow"
            id="exam-results-list-title"
            title={config.title}
            titleClassName="section-exam-results-list__title"
          />

          {resultsPage.docs.length > 0 ? (
            <>
              <div className="section-exam-results-list__grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {resultsPage.docs.map((item) => (
                  <ExamResultCard config={config} item={item} key={item.id} />
                ))}
              </div>
              {resultsPage.totalPages > 1 ? (
                <ExamResultsPagination
                  page={safePage}
                  resultType={resultType}
                  totalPages={resultsPage.totalPages}
                />
              ) : null}
            </>
          ) : (
            <p className="section-exam-results-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              {config.emptyLabel}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function getCachedExamResultsPage({
  page,
  resultType,
}: {
  page: number
  resultType: ExamResultType
}) {
  return unstable_cache(
    () => queryExamResultsPage({ page, resultType }),
    ['frontend-exam-results', resultType, String(page)],
    {
      revalidate: 600,
      tags: [`frontend_exam_results_${resultType}`],
    },
  )()
}

async function queryExamResultsPage({
  page,
  resultType,
}: {
  page: number
  resultType: ExamResultType
}) {
  const payload = await getPayload({ config: configPromise })

  return findExamResultsPage({
    page,
    payload,
    resultType,
  })
}

async function findExamResultsPage({
  page,
  payload,
  resultType,
}: {
  page: number
  payload: Payload
  resultType: ExamResultType
}) {
  const result = await payload
    .find({
      collection: 'exam-results',
      depth: 0,
      limit: pageSize,
      overrideAccess: false,
      page,
      select: examResultSelect,
      sort: '-publishedAt',
      where: createExamResultsWhere(resultType),
    })
    .catch(() => ({
      docs: [],
      page,
      totalDocs: 0,
      totalPages: 0,
    }))

  return {
    docs: result.docs as ExamResultListItem[],
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

function createExamResultsWhere(resultType: ExamResultType): Where {
  return {
    and: [
      {
        displayStatus: {
          equals: 'published',
        },
      },
      {
        resultType: {
          equals: resultType,
        },
      },
      {
        or: [
          {
            centers: {
              contains: 'exam',
            },
          },
          {
            centers: {
              contains: 'all',
            },
          },
        ],
      },
    ],
  }
}

function ExamResultCard({
  config,
  item,
}: {
  config: ExamResultPageConfig
  item: ExamResultListItem
}) {
  const imageUrl = normalizeImageUrl(item.thumbnailPath)
  const displayTitle = normalizeText(item.title) || config.eyebrow

  return (
    <article className="section-exam-result-card overflow-hidden rounded-xl border border-neutral-300 bg-white">
      <div className="section-exam-result-card__media relative aspect-270/268 overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <Image
            alt=""
            aria-hidden="true"
            className="size-full object-cover"
            fill
            loading="lazy"
            sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 56px) / 2), calc((min(100vw, 1160px) - 48px) / 4)"
            src={imageUrl}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-neutral-100 px-6 text-center type-label-m font-semibold leading-normal text-neutral-500">
            이미지 준비중
          </div>
        )}
      </div>
      <div className="section-exam-result-card__body flex items-center p-5">
        <p className="section-exam-result-card__title line-clamp-2 type-body-m font-medium leading-normal text-neutral-900">
          {displayTitle}
        </p>
      </div>
    </article>
  )
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

function ExamResultsPagination({
  page,
  resultType,
  totalPages,
}: {
  page: number
  resultType: ExamResultType
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination
      aria-label={`${getExamResultPageTitle(resultType)} 페이지`}
      className="section-exam-results-pagination mt-16 md:mt-20"
    >
      <PaginationContent className="section-exam-results-pagination__content gap-1">
        <PaginationItem>
          <ExamResultsPaginationLink
            disabled={page <= 1}
            href={examResultsHref({ page: page - 1, resultType })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
            이전
          </ExamResultsPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="size-9 type-label-m font-medium" />
            ) : (
              <ExamResultsPaginationLink
                active={page === item}
                href={examResultsHref({ page: item, resultType })}
              >
                {item}
              </ExamResultsPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <ExamResultsPaginationLink
            disabled={page >= totalPages}
            href={examResultsHref({ page: page + 1, resultType })}
          >
            다음
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </ExamResultsPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ExamResultsPaginationLink({
  active,
  children,
  disabled,
  href,
}: {
  active?: boolean
  children: ReactNode
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

function examResultsHref({ page, resultType }: { page?: number; resultType: ExamResultType }) {
  const pathname =
    resultType === 'arts_high_school' ? '/exam/arts-high-results' : '/exam/university-results'

  if (!page || page <= 1) {
    return `${pathname}#${listAnchorId}`
  }

  return `${pathname}?page=${page}#${listAnchorId}`
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

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

export function getExamResultPageTitle(resultType: ExamResultType) {
  return pageConfigByType[resultType].eyebrow
}

export type { ExamResultType }

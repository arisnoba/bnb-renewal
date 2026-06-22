import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { youtubeThumbnailUrl } from '@/lib/youtube'
import type { ExamPassedVideo } from '@/payload-types'
import configPromise from '@payload-config'
import { ChevronLeft, ChevronRight, CirclePlay } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload, type Payload, type Where } from 'payload'
import type { ReactNode } from 'react'

type ExamPassedVideosPageProps = {
  page?: number
}

type ExamPassedVideoListItem = Pick<
  ExamPassedVideo,
  'id' | 'publishedAt' | 'slug' | 'title' | 'youtubeCode' | 'youtubeUrl'
>

const listAnchorId = 'exam-passed-videos-list'
const pageSize = 16

const examPassedVideoSelect = {
  publishedAt: true,
  slug: true,
  title: true,
  youtubeCode: true,
  youtubeUrl: true,
} as const

export async function ExamPassedVideosPage({ page = 1 }: ExamPassedVideosPageProps) {
  const payload = await getPayload({ config: configPromise })
  const decoIcons = getPageDecoIcons(3, 'exam-passed-videos')
  const videosPage = await findExamPassedVideosPage({
    page,
    payload,
  })
  const safePage = Math.min(videosPage.page || page, Math.max(videosPage.totalPages, 1))

  return (
    <main className="page page-light page-exam-passed-videos" data-center="exam">
      <section
        aria-labelledby="exam-passed-videos-hero-title"
        className="section-exam-passed-videos-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-60"
          fill
          priority
          sizes="100vw"
          src="/assets/exam-results/hero-university.png"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        <PageDeco
          className="-left-20 top-[36%] max-md:!hidden md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] max-md:!hidden md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] max-md:!hidden md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[120px]">
          <div className="section-exam-passed-videos-hero__title-wrap">
            <h1
              className="section-exam-passed-videos-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
              id="exam-passed-videos-hero-title"
            >
              <span className="block text-brand">합격현황</span>
              <span className="block">수강생 합격영상</span>
            </h1>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exam-passed-videos-list-title"
        className="section-exam-passed-videos-list section-p-block-base bg-white text-neutral-900"
        id={listAnchorId}
      >
        <div className="container">
          <header className="section-exam-passed-videos-list__head mb-16 md:mb-20">
            <p className="section-exam-passed-videos-list__eyebrow mb-8 type-title-s font-bold leading-[1.4] text-brand md:mb-10">
              수강생 합격영상
            </p>
            <h2
              className="section-exam-passed-videos-list__title type-display-m font-extrabold leading-[1.35] md:type-display-l"
              id="exam-passed-videos-list-title"
            >
              <span className="block">배우를 향한 꿈을 현실로 만들어낸</span>
              <span className="block">합격생들의 진솔한 이야기를 만나보세요.</span>
            </h2>
            <div className="section-exam-passed-videos-list__description mt-6 type-body-m font-medium leading-normal text-neutral-500 md:mt-8">
              <p>배우앤배움 입시센터 합격생들이 직접 작성한 합격후기입니다.</p>
              <p>대입 연극영화과 입시를 준비하는 모든 수강생들에게 도움이 되길 바랍니다.</p>
            </div>
          </header>

          {videosPage.docs.length > 0 ? (
            <>
              <div className="section-exam-passed-videos-list__grid mx-auto grid w-full max-w-280 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {videosPage.docs.map((item) => (
                  <ExamPassedVideoCard item={item} key={item.id} />
                ))}
              </div>
              {videosPage.totalPages > 1 ? (
                <ExamPassedVideosPagination page={safePage} totalPages={videosPage.totalPages} />
              ) : null}
            </>
          ) : (
            <p className="section-exam-passed-videos-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              등록된 합격영상이 없습니다.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

async function findExamPassedVideosPage({
  page,
  payload,
}: {
  page: number
  payload: Payload
}) {
  const result = await payload
    .find({
      collection: 'exam-passed-videos',
      depth: 0,
      limit: pageSize,
      overrideAccess: false,
      page,
      select: examPassedVideoSelect,
      sort: '-publishedAt',
      where: createExamPassedVideosWhere(),
    })
    .catch(() => ({
      docs: [],
      page,
      totalDocs: 0,
      totalPages: 0,
    }))

  return {
    docs: result.docs as ExamPassedVideoListItem[],
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

function createExamPassedVideosWhere(): Where {
  return {
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

function ExamPassedVideoCard({ item }: { item: ExamPassedVideoListItem }) {
  const title = normalizeText(item.title) || '합격영상'
  const youtubeUrl = normalizeText(item.youtubeUrl)
  const thumbnailUrl = youtubeThumbnailUrl(item.youtubeCode || youtubeUrl)
  const cardLabel = `${title} 영상 보기`

  return (
    <article className="section-exam-passed-video-card bg-neutral-100">
      <Link
        aria-label={cardLabel}
        className="section-exam-passed-video-card__link group relative block aspect-video overflow-hidden bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        href={youtubeUrl || '#'}
        target={youtubeUrl ? '_blank' : undefined}
        rel={youtubeUrl ? 'noreferrer' : undefined}
      >
        {thumbnailUrl ? (
          <Image
            alt=""
            aria-hidden="true"
            className="size-full object-cover transition duration-300 group-hover:scale-105 group-focus-visible:scale-105"
            fill
            loading="lazy"
            sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 56px) / 2), 268px"
            src={thumbnailUrl}
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6 text-center type-label-m font-semibold leading-normal text-neutral-500">
            썸네일 준비중
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/70 group-focus-visible:bg-black/70"
        />
        <p className="section-exam-passed-video-card__title absolute left-5 top-5 max-w-[calc(100%-40px)] text-pretty type-body-s font-bold leading-normal text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {title}
        </p>
        <CirclePlay
          aria-hidden="true"
          className="absolute bottom-5 right-5 size-8 text-white drop-shadow-sm"
          strokeWidth={1.6}
        />
      </Link>
    </article>
  )
}

function ExamPassedVideosPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination
      aria-label="수강생 합격영상 페이지"
      className="section-exam-passed-videos-pagination mt-16 md:mt-20"
    >
      <PaginationContent className="section-exam-passed-videos-pagination__content gap-1">
        <PaginationItem>
          <ExamPassedVideosPaginationLink
            disabled={page <= 1}
            href={examPassedVideosHref({ page: page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
            이전
          </ExamPassedVideosPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="size-9 type-label-m font-medium" />
            ) : (
              <ExamPassedVideosPaginationLink
                active={page === item}
                href={examPassedVideosHref({ page: item })}
              >
                {item}
              </ExamPassedVideosPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <ExamPassedVideosPaginationLink
            disabled={page >= totalPages}
            href={examPassedVideosHref({ page: page + 1 })}
          >
            다음
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </ExamPassedVideosPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ExamPassedVideosPaginationLink({
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

function examPassedVideosHref({ page }: { page?: number }) {
  const pathname = '/exam/passed-videos'

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

import { getExamPassedHeroImage, PageHeroImage } from '@/app/(frontend)/_components/PageHeroImage'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { PageIntro } from '@/components/PageIntro'
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
import { unstable_cache } from 'next/cache'
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
  const decoIcons = getPageDecoIcons(3, 'exam-passed-videos')
  const videosPage = await getCachedExamPassedVideosPage(page)
  const safePage = Math.min(videosPage.page || page, Math.max(videosPage.totalPages, 1))

  return (
    <main className="page page-light page-exam-passed-videos" data-center="exam">
      <section
        aria-labelledby="exam-passed-videos-hero-title"
        className="section-kv-hero section-kv-hero--standard section-exam-passed-videos-hero"
        data-page-tone="dark"
      >
        <PageHeroImage image={getExamPassedHeroImage()} />
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        <PageDeco
          className="-left-20 top-[36%] md:block md:-left-72 2xl:-left-39"
          icon={decoIcons[0]}
        />
        <PageDeco
          className="right-[-72px] top-[16%] md:block md:right-[-104px]"
          icon={decoIcons[1]}
        />
        <PageDeco
          className="right-[16%] bottom-[-8%] md:block"
          icon={decoIcons[2]}
        />
        <div className="container relative z-10 flex min-h-140 items-end pb-20 pt-32 md:min-h-200 md:pb-[120px]">
          <div className="section-exam-passed-videos-hero__title-wrap">
            <div
              className="section-exam-passed-videos-hero__title page-hero-label"
              id="exam-passed-videos-hero-title"
            >
              <span className="block text-brand">합격현황</span>
              <span className="block">수강생 합격영상</span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exam-passed-videos-list-title"
        className="section-exam-passed-videos-list section-p-block-base bg-white text-neutral-900"
        id={listAnchorId}
      >
        <div className="container">
          <PageIntro
            className="section-exam-passed-videos-list__head mb-16 md:mb-20"
            description={(
              <>
                <p>배우앤배움 입시센터 합격생들이 직접 작성한 합격후기입니다.</p>
                <p>대입 연극영화과 입시를 준비하는 모든 수강생들에게 도움이 되길 바랍니다.</p>
              </>
            )}
            descriptionClassName="section-exam-passed-videos-list__description"
            eyebrow="수강생 합격영상"
            eyebrowClassName="section-exam-passed-videos-list__eyebrow"
            id="exam-passed-videos-list-title"
            title={'배우를 향한 꿈을 현실로 만들어낸\n합격생들의 진솔한 이야기를 만나보세요.'}
            titleClassName="section-exam-passed-videos-list__title"
          />

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

function getCachedExamPassedVideosPage(page: number) {
  return unstable_cache(
    () => queryExamPassedVideosPage(page),
    ['frontend-exam-passed-videos', String(page)],
    {
      revalidate: 600,
      tags: ['frontend_exam_passed_videos'],
    },
  )()
}

async function queryExamPassedVideosPage(page: number) {
  const payload = await getPayload({ config: configPromise })

  return findExamPassedVideosPage({
    page,
    payload,
  })
}

export async function findExamPassedVideosPage({
  page,
  payload,
}: {
  page: number
  payload: Payload
}) {
  const result = await payload.find({
    collection: 'exam-passed-videos',
    depth: 0,
    limit: pageSize,
    overrideAccess: false,
    page,
    select: examPassedVideoSelect,
    sort: '-publishedAt',
    where: createExamPassedVideosWhere(),
  })

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
    <article className="section-exam-passed-video-card bg-neutral-100 rounded-sm overflow-hidden">
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

import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { ExamPassedReview, ExamSchoolLogo, Media } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import configPromise from '@payload-config'
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload, type Payload, type Where } from 'payload'
import type { ReactNode } from 'react'

type ExamPassedReviewsPageProps = {
  page?: number
}

type ExamPassedReviewListItem = Pick<
  ExamPassedReview,
  'id' | 'publishedAt' | 'resultSummary' | 'slug' | 'studentImagePath' | 'studentName' | 'title'
> & {
  school: number | (Pick<ExamSchoolLogo, 'id' | 'logoMedia' | 'schoolName'> & Record<string, unknown>)
}

const listAnchorId = 'exam-passed-reviews-list'
const pageSize = 16

const examPassedReviewSelect = {
  publishedAt: true,
  resultSummary: true,
  school: true,
  slug: true,
  studentImagePath: true,
  studentName: true,
  title: true,
} as const

export async function ExamPassedReviewsPage({ page = 1 }: ExamPassedReviewsPageProps) {
  const payload = await getPayload({ config: configPromise })
  const decoIcons = getPageDecoIcons(3, 'exam-passed-reviews')
  const reviewsPage = await findExamPassedReviewsPage({
    page,
    payload,
  })
  const safePage = Math.min(reviewsPage.page || page, Math.max(reviewsPage.totalPages, 1))

  return (
    <main className="page page-light page-exam-passed-reviews" data-center="exam">
      <section
        aria-labelledby="exam-passed-reviews-hero-title"
        className="section-exam-passed-reviews-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
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
          <div className="section-exam-passed-reviews-hero__title-wrap">
            <h1
              className="section-exam-passed-reviews-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
              id="exam-passed-reviews-hero-title"
            >
              <span className="block text-brand">합격자소개</span>
              <span className="block">수강생 합격후기</span>
            </h1>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="exam-passed-reviews-list-title"
        className="section-exam-passed-reviews-list section-p-block-base bg-white text-neutral-900"
        id={listAnchorId}
      >
        <div className="container">
          <header className="section-exam-passed-reviews-list__head mb-16 md:mb-20">
            <p className="section-exam-passed-reviews-list__eyebrow mb-8 type-title-l font-bold leading-[1.4] text-brand md:mb-10">
              수강생 합격후기
            </p>
            <h2
              className="section-exam-passed-reviews-list__title type-display-m font-extrabold leading-[1.35] md:type-display-l"
              id="exam-passed-reviews-list-title"
            >
              <span className="block">배우를 향한 꿈을 현실로 만들어낸</span>
              <span className="block">합격생들의 진솔한 이야기를 만나보세요.</span>
            </h2>
            <div className="section-exam-passed-reviews-list__description mt-6 type-body-m font-medium text-neutral-500 md:mt-8">
              <p>배우앤배움 입시센터 합격생들이 직접 작성한 합격후기입니다.</p>
              <p>대입 연극영화과 입시를 준비하는 모든 수강생들에게 도움이 되길 바랍니다.</p>
            </div>
          </header>

          {reviewsPage.docs.length > 0 ? (
            <>
              <div className="section-exam-passed-reviews-list__grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {reviewsPage.docs.map((item) => (
                  <ExamPassedReviewCard item={item} key={item.id} />
                ))}
              </div>
              {reviewsPage.totalPages > 1 ? (
                <ExamPassedReviewsPagination
                  page={safePage}
                  totalPages={reviewsPage.totalPages}
                />
              ) : null}
            </>
          ) : (
            <p className="section-exam-passed-reviews-list__empty border-y border-neutral-200 py-18 text-center type-title-s font-semibold text-neutral-500">
              등록된 합격후기가 없습니다.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

async function findExamPassedReviewsPage({
  page,
  payload,
}: {
  page: number
  payload: Payload
}) {
  const result = await payload
    .find({
      collection: 'exam-passed-reviews',
      depth: 2,
      limit: pageSize,
      overrideAccess: false,
      page,
      select: examPassedReviewSelect,
      sort: '-publishedAt',
      where: createExamPassedReviewsWhere(),
    })
    .catch(() => ({
      docs: [],
      page,
      totalDocs: 0,
      totalPages: 0,
    }))

  return {
    docs: result.docs as ExamPassedReviewListItem[],
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

function createExamPassedReviewsWhere(): Where {
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

function ExamPassedReviewCard({ item }: { item: ExamPassedReviewListItem }) {
  const imageUrl = normalizeImageUrl(item.studentImagePath)
  const school = schoolFromReview(item)
  const schoolLogoUrl = logoUrlFromSchool(school)
  const resultText = normalizeText(item.resultSummary) || normalizeText(item.title) || '합격후기'
  const studentName = normalizeText(item.studentName) || '합격생'
  const href = examPassedReviewDetailHref(item.slug)

  return (
    <article className="section-exam-passed-review-card overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <Link
        aria-label={`${studentName} 합격후기 보기`}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        href={href}
      >
        <div className="section-exam-passed-review-card__media relative aspect-[67/62] overflow-hidden bg-neutral-100">
          {imageUrl ? (
            <Image
              alt={`${studentName} 학생`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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

          <div className="section-exam-passed-review-card__logo absolute bottom-5 right-5 grid size-[50px] place-items-center overflow-hidden rounded-full border border-neutral-300 bg-white p-1.5">
            {schoolLogoUrl ? (
              <Image
                alt=""
                aria-hidden="true"
                className="size-full object-contain"
                fill
                loading="lazy"
                sizes="50px"
                src={schoolLogoUrl}
                unoptimized
              />
            ) : (
              <GraduationCap aria-hidden="true" className="size-6 text-brand" strokeWidth={2.2} />
            )}
          </div>
        </div>
        <div className="section-exam-passed-review-card__body p-5">
          <p className="section-exam-passed-review-card__result truncate type-body-s font-medium leading-[1.6] text-neutral-900">
            {resultText}
          </p>
          <p className="section-exam-passed-review-card__student mt-1 flex items-center gap-2 type-title-s font-bold text-neutral-900">
            <GraduationCap aria-hidden="true" className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} />
            <span className="truncate">{studentName}</span>
          </p>
        </div>
      </Link>
    </article>
  )
}

function schoolFromReview(item: ExamPassedReviewListItem) {
  return typeof item.school === 'object' ? item.school : null
}

function logoUrlFromSchool(school: ReturnType<typeof schoolFromReview>) {
  const media = school?.logoMedia

  if (!media || typeof media !== 'object') {
    return ''
  }

  return mediaUrl(media)
}

function mediaUrl(media: Pick<Media, 'updatedAt' | 'url'>) {
  const url = normalizeText(media.url)

  return url ? getMediaUrl(url, media.updatedAt) : ''
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = normalizeText(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function ExamPassedReviewsPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination
      aria-label="수강생 합격후기 페이지"
      className="section-exam-passed-reviews-pagination mt-16 md:mt-20"
    >
      <PaginationContent className="section-exam-passed-reviews-pagination__content gap-1">
        <PaginationItem>
          <ExamPassedReviewsPaginationLink
            disabled={page <= 1}
            href={examPassedReviewsHref({ page: page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
            이전
          </ExamPassedReviewsPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis className="size-9 type-label-m font-medium" />
            ) : (
              <ExamPassedReviewsPaginationLink
                active={page === item}
                href={examPassedReviewsHref({ page: item })}
              >
                {item}
              </ExamPassedReviewsPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <ExamPassedReviewsPaginationLink
            disabled={page >= totalPages}
            href={examPassedReviewsHref({ page: page + 1 })}
          >
            다음
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </ExamPassedReviewsPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ExamPassedReviewsPaginationLink({
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

function examPassedReviewsHref({ page }: { page?: number }) {
  const pathname = '/exam/passed-reviews'

  if (!page || page <= 1) {
    return `${pathname}#${listAnchorId}`
  }

  return `${pathname}?page=${page}#${listAnchorId}`
}

function examPassedReviewDetailHref(slug: string) {
  return `/exam/passed-reviews/${encodeURIComponent(slug)}`
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

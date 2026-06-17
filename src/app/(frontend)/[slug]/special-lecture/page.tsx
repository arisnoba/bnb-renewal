import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { CirclePlay } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import React from 'react'

import { Media } from '@/components/Media/Renderer'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { assertCenter, getCenterLabel } from '@/lib/centers'
import { extractYouTubeVideoId, youtubeThumbnailUrl, youtubeWatchUrl } from '@/lib/youtube'
import type { HighteenSpecialClass, Media as MediaType } from '@/payload-types'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

type SpecialLectureListItem = Pick<
  HighteenSpecialClass,
  'id' | 'publishedAt' | 'slug' | 'thumbnailMedia' | 'title' | 'youtubeUrl'
>

const ITEMS_PER_PAGE = 16

export const dynamic = 'force-dynamic'
export const revalidate = 600

export function generateStaticParams() {
  return [{ slug: 'highteen' }]
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const center = assertCenter(slug)

  if (center !== 'highteen') {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  return {
    description: '배우앤배움 하이틴센터에서 진행한 특강 영상 모음',
    title: `하이틴센터 특강 | ${getCenterLabel(center)}`,
  }
}

export default async function HighteenSpecialLecturePage({
  params,
  searchParams,
}: Args) {
  const [{ slug }, query = {}] = await Promise.all([params, searchParams])
  const center = assertCenter(slug)

  if (center !== 'highteen') {
    notFound()
  }

  const currentPage = parsePage(query.page)
  const lectures = await querySpecialLectures(currentPage)
  const totalPages = Math.max(lectures.totalPages || 1, 1)
  const safePage = Math.min(lectures.page || currentPage, totalPages)

  return (
    <main className="page page-dark page-special-lecture" data-center={center}>
      <section
        aria-labelledby="special-lecture-hero-title"
        className="section-special-lecture-hero relative min-h-[560px] overflow-hidden bg-black md:min-h-[800px]"
        data-page-tone="dark"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-45 grayscale"
          style={{ backgroundImage: "url('/assets/curriculum/hero.png')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/65" />
        <HeroDeco />
        <div className="container relative flex min-h-[560px] items-end pb-20 pt-32 md:min-h-[800px] md:pb-[142px]">
          <h1
            className="section-special-lecture-hero__title page-title type-display-l font-extrabold leading-[1.2] text-white md:type-display-xl"
            id="special-lecture-hero-title"
          >
            <span className="block text-brand">교육</span>
            <span className="block">하이틴센터</span>
            <span className="block">특강</span>
          </h1>
        </div>
      </section>

      <section
        aria-labelledby="special-lecture-list-title"
        className="section-special-lecture-list section-p-block-base bg-bg-footer text-white"
      >
        <div className="container">
          <header className="section-special-lecture-list__head mb-14 max-w-[960px] md:mb-20">
            <p className="section-special-lecture-list__eyebrow mb-8 type-title-s font-bold leading-[1.4] text-brand md:mb-10">
              하이틴센터 특강
            </p>
            <h2
              className="section-special-lecture-list__title type-display-m font-extrabold leading-[1.35] md:type-display-l"
              id="special-lecture-list-title"
            >
              배우의 성장을 위한
              <br />
              특별한 만남
            </h2>
            <div className="section-special-lecture-list__description mt-6 type-body-m leading-[1.6] text-white/60 md:mt-8">
              <p>배우앤배움에서 직접 촬영한 영상입니다.</p>
              <p>영상 제작은 배우앤배움의 자회사 BnB Media에서 주관하고 있습니다.</p>
            </div>
          </header>

          {lectures.docs.length === 0 ? (
            <p className="section-special-lecture-list__empty border-y border-white/15 py-18 text-center type-title-s font-semibold text-white/50">
              등록된 하이틴센터 특강이 없습니다.
            </p>
          ) : (
            <div className="section-special-lecture-list__grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {lectures.docs.map((lecture) => (
                <SpecialLectureCard key={lecture.id} lecture={lecture} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <SpecialLecturePagination page={safePage} totalPages={totalPages} />
          ) : null}
        </div>
      </section>
    </main>
  )
}

function HeroDeco() {
  const decoIcons = getPageDecoIcons(2, 'highteen-special-lecture')

  return (
    <>
      <PageDeco className="-left-20 top-[30%] md:-left-28" icon={decoIcons[0]} />
      <PageDeco className="-right-18 bottom-[-8%] md:-right-24" icon={decoIcons[1]} />
    </>
  )
}

function SpecialLectureCard({ lecture }: { lecture: SpecialLectureListItem }) {
  const thumbnailMedia = getLectureThumbnailMedia(lecture)
  const thumbnailUrl = thumbnailMedia ? '' : youtubeThumbnailUrl(lecture.youtubeUrl)
  const href = getLectureYoutubeHref(lecture.youtubeUrl)

  return (
    <a
      className="group section-special-lecture-card block overflow-hidden rounded-xl bg-neutral-900 outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:ring-4 focus-visible:ring-brand/40"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <article>
        <div className="section-special-lecture-card__media relative aspect-video overflow-hidden bg-neutral-900">
          {thumbnailMedia ? (
            <Media
              fill
              htmlElement={null}
              imgClassName="object-cover transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
              pictureClassName="block size-full"
              resource={thumbnailMedia}
              size="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 268px"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
              style={thumbnailUrl ? { backgroundImage: `url('${thumbnailUrl}')` } : undefined}
            />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-black/42" />
          <CirclePlay
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md"
            strokeWidth={1.8}
          />
        </div>
        <div className="section-special-lecture-card__body flex min-h-14 items-center justify-center px-4 py-3 text-center">
          <h3 className="line-clamp-2 type-body-m font-medium leading-[1.5] text-white">
            {lecture.title}
          </h3>
        </div>
      </article>
    </a>
  )
}

function SpecialLecturePagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const pages = paginationItems(page, totalPages)

  return (
    <nav
      aria-label="하이틴센터 특강 페이지 이동"
      className="section-special-lecture-pagination mt-14 flex justify-center md:mt-18"
    >
      <ul className="section-special-lecture-pagination__content flex items-center gap-2">
        <li>
          <PaginationLink disabled={page <= 1} href={specialLectureHref(page - 1)}>
            이전
          </PaginationLink>
        </li>
        {pages.map((item, index) => (
          <li key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <span className="grid size-10 place-items-center type-label-m font-medium text-white/45">
                ...
              </span>
            ) : (
              <PaginationLink active={page === item} href={specialLectureHref(item)}>
                {item}
              </PaginationLink>
            )}
          </li>
        ))}
        <li>
          <PaginationLink disabled={page >= totalPages} href={specialLectureHref(page + 1)}>
            다음
          </PaginationLink>
        </li>
      </ul>
    </nav>
  )
}

function PaginationLink({
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
    'grid min-w-10 place-items-center rounded-full px-3 py-2 type-label-m font-medium leading-none transition-colors'

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} text-white/25`}>
        {children}
      </span>
    )
  }

  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={`${className} ${
        active ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
      href={href}
    >
      {children}
    </a>
  )
}

async function querySpecialLectures(page: number) {
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
          contains: 'highteen',
        },
      },
    ],
  }

  return payload
    .find({
      collection: 'highteen-special-classes',
      depth: 1,
      limit: ITEMS_PER_PAGE,
      overrideAccess: false,
      page,
      select: {
        publishedAt: true,
        slug: true,
        thumbnailMedia: true,
        title: true,
        youtubeUrl: true,
      },
      sort: '-publishedAt',
      where,
    })
    .catch(() => ({
      docs: [] as SpecialLectureListItem[],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }))
}

function getLectureThumbnailMedia(lecture: SpecialLectureListItem) {
  return lecture.thumbnailMedia && typeof lecture.thumbnailMedia === 'object'
    ? (lecture.thumbnailMedia as MediaType)
    : null
}

function getLectureYoutubeHref(value: string) {
  const videoId = extractYouTubeVideoId(value)

  if (videoId) {
    return youtubeWatchUrl(videoId)
  }

  return value
}

function specialLectureHref(page?: number) {
  return page && page > 1 ? `/highteen/special-lecture?page=${page}` : '/highteen/special-lecture'
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

function parsePage(value: string | undefined) {
  const page = Number(value)

  return Number.isInteger(page) && page > 0 ? page : 1
}

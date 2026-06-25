import { Media } from '@/components/Media/Renderer'
import { PageIntro } from '@/components/PageIntro'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { CenterSlug } from '@/lib/centers'
import type { News } from '@/payload-types'
import { getNewsThumbnailMedia, getNewsUrl } from '@/utilities/newsFallbacks'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'
import Link from 'next/link'
import React from 'react'

import { FilterChips } from '../_components/FilterChips'

type NewsCategory = {
  key: string
  label: string
  match: readonly string[]
  matchMode?: 'contains' | 'exact'
  legacyKeys?: readonly string[]
}

const defaultNewsCategories = [
  {
    key: 'audition-casting',
    label: '오디션 · 캐스팅공지',
    match: ['오디션', '캐스팅공지', '캐스팅진행'],
  },
  {
    key: 'casting-confirmed',
    label: '캐스팅 확정',
    match: ['캐스팅확정'],
  },
  {
    key: 'casting-onair',
    label: '캐스팅 OnAir',
    match: ['OnAir'],
  },
  {
    key: 'education-news',
    label: '교육 · 운영 · 소식',
    match: ['교육', '운영', '소식'],
  },
] as const satisfies readonly NewsCategory[]

const examNewsCategories = [
  {
    key: 'pass-results',
    label: '합격현황',
    match: ['합격현황', '대학합격현황', '예고합격현황'],
    matchMode: 'exact',
    legacyKeys: ['university-results', 'arts-high-results'],
  },
  {
    key: 'admission-schedule',
    label: '수시·정시 일정',
    match: ['수시·정시 일정', '수시ㆍ정시일정공지', '수시전형일정', '정시전형일정'],
    matchMode: 'exact',
  },
  {
    key: 'education-news',
    label: '교육·운영·소식',
    match: ['교육·운영·소식', '교육', '운영', '교육ㆍ운영ㆍ소식', '공지'],
    matchMode: 'exact',
  },
] as const satisfies readonly NewsCategory[]

const newsCategoriesByCenter: Partial<Record<CenterSlug, readonly NewsCategory[]>> = {
  exam: examNewsCategories,
}

const pageSize = 5
type NewsPageResult = {
  docs: (Partial<News> & Pick<News, 'id' | 'slug' | 'title'>)[]
  page: number
  totalDocs: number
  totalPages: number
}

type NewsArchiveProps = {
  activeCategory?: string
  center: string
  page?: number
  title?: React.ReactNode
}

export async function NewsArchive({
  activeCategory,
  center,
  page = 1,
  title = (
    <>
      배우앤배움의 새로운 소식과
      <br />
      다양한 활동 이야기를 전합니다.
    </>
  ),
}: NewsArchiveProps) {
  const newsCategories = getNewsCategoriesForCenter(center)
  const category =
    getCategoryByKey(activeCategory, newsCategories) ??
    normalizeCategory(activeCategory, newsCategories)
  const currentPage = Math.max(1, page)
  const news = await getCachedNewsArchivePage({
    categoryKey: category?.key ?? null,
    center,
    page: currentPage,
  })
  const totalPages = Math.max(news.totalPages || 1, 1)
  const categoryItems = [
    {
      active: !category,
      href: newsArchiveHref({ center }),
      label: '전체',
    },
    ...newsCategories.map((item) => ({
      active: category?.key === item.key,
      href: newsArchiveHref({ category: item.key, center }),
      label: item.label,
    })),
  ]

  return (
    <main className="page page-light page-news-archive page-top-offset" data-center={center}>
      <section className="section-news-list section-p-block-base" aria-labelledby="news-list-title">
        <div className="section-news-list__container">
          <PageIntro
            className="section-news-list__head"
            eyebrow="NEWS&NOTICE"
            eyebrowClassName="section-news-list__eyebrow"
            id="news-list-title"
            title={title}
            titleClassName="section-news-list__title"
          />

          <FilterChips
            ariaLabel="뉴스 분류"
            className="section-news-list__tabs"
            itemClassName="section-news-list__tab type-label-l font-semibold leading-[1.4]"
            items={categoryItems}
            tone="dark"
          />

          {news.docs.length === 0 ? (
            <p className="section-news-list__empty type-title-s font-semibold">
              등록된 뉴스가 없습니다.
            </p>
          ) : (
            <div className="section-news-list__items">
              {news.docs.map((item) => (
                <NewsCard
                  center={center}
                  key={item.id}
                  news={item}
                  newsCategories={newsCategories}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <NewsPagination
              activeCategory={category?.key ?? null}
              center={center}
              page={Math.min(news.page || currentPage, totalPages)}
              totalPages={totalPages}
            />
          )}
        </div>
      </section>
    </main>
  )
}

function getCachedNewsArchivePage({
  categoryKey,
  center,
  page,
}: {
  categoryKey: string | null
  center: string
  page: number
}) {
  return unstable_cache(
    () => queryNewsArchivePage({ categoryKey, center, page }),
    ['frontend-news', center, categoryKey ?? 'all', String(page)],
    {
      revalidate: 600,
      tags: [`frontend_news_${center}`],
    },
  )()
}

async function queryNewsArchivePage({
  categoryKey,
  center,
  page,
}: {
  categoryKey: string | null
  center: string
  page: number
}) {
  const payload = await getPayload({ config: configPromise })
  const newsCategories = getNewsCategoriesForCenter(center)
  const category = categoryKey ? getCategoryByKey(categoryKey, newsCategories) : null
  const baseWhere: Where = {
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
    ],
  }

  return category
    ? await findCategorizedNews({
        category,
        page,
        payload,
        where: baseWhere,
      })
    : await findNewsPage({
        page,
        payload,
        where: baseWhere,
      })
}

function NewsCard({
  center,
  news,
  newsCategories,
}: {
  center: string
  news: Partial<News> & Pick<News, 'id' | 'slug' | 'title'>
  newsCategories: readonly NewsCategory[]
}) {
  const media = getNewsThumbnailMedia(news)
  const categoryLabel = getNewsCategoryLabel(news.category, newsCategories) ?? news.category
  const description = getNewsArchiveDescription(news)
  const publishedAt = formatDate(news.publishedAt)

  return (
    <Link className="section-news-card group" href={getNewsUrl(news, center)}>
      <article className="section-news-card__inner">
        <div className="section-news-card__media">
          {media ? (
            <Media
              imgClassName="section-news-card__image"
              pictureClassName="section-news-card__picture"
              resource={media}
              size="146px"
            />
          ) : null}
        </div>
        <div className="section-news-card__content">
          <div className="section-news-card__main">
            <h2 className="section-news-card__title type-title-l font-bold leading-[1.4]">
              {news.title}
            </h2>
            {description && (
              <p className="section-news-card__description type-body-s font-medium leading-normal">
                {description}
              </p>
            )}
            {categoryLabel && (
              <div className="section-news-card__badges">
                <span className="section-news-card__badge type-label-m leading-none">
                  {categoryLabel}
                </span>
              </div>
            )}
          </div>
          {publishedAt && (
            <time
              className="section-news-card__date type-label-m leading-[1.2]"
              dateTime={news.publishedAt ?? undefined}
            >
              {publishedAt}
            </time>
          )}
        </div>
      </article>
    </Link>
  )
}

function NewsPagination({
  activeCategory,
  center,
  page,
  totalPages,
}: {
  activeCategory: string | null
  center: string
  page: number
  totalPages: number
}) {
  const pages = paginationWindow(page, totalPages)

  return (
    <Pagination aria-label="뉴스 페이지" className="section-news-pagination">
      <PaginationContent className="section-news-pagination__content">
        <PaginationItem>
          <NewsPaginationLink
            disabled={page <= 1}
            href={newsArchiveHref({ category: activeCategory, center, page: page - 1 })}
          >
            이전
          </NewsPaginationLink>
        </PaginationItem>
        {pages.map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis
                className="section-news-pagination__ellipsis type-label-m font-extrabold leading-none"
              />
            ) : (
              <NewsPaginationLink
                active={page === item}
                href={newsArchiveHref({ category: activeCategory, center, page: item })}
              >
                {item}
              </NewsPaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <NewsPaginationLink
            disabled={page >= totalPages}
            href={newsArchiveHref({ category: activeCategory, center, page: page + 1 })}
          >
            다음
          </NewsPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function NewsPaginationLink({
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
        className="section-news-pagination__link type-label-m font-extrabold leading-none"
        data-disabled="true"
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className="section-news-pagination__link type-label-m font-extrabold leading-none"
      data-active={active ? 'true' : 'false'}
      href={href}
    >
      {children}
    </Link>
  )
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

  return `${year}.${month}.${day}`
}

export function getNewsCategoriesForCenter(center: string): readonly NewsCategory[] {
  return newsCategoriesByCenter[center as CenterSlug] ?? defaultNewsCategories
}

function normalizeCategory(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  if (!value) {
    return null
  }

  const normalizedValue = normalizeCategoryText(value)

  return (
    newsCategories.find((category) => categoryMatches(normalizedValue, category)) ?? null
  )
}

function getCategoryByKey(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  return (
    newsCategories.find(
      (category) => category.key === value || category.legacyKeys?.includes(value ?? ''),
    ) ?? null
  )
}

function getNewsCategoryLabel(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  const category = normalizeCategory(value, newsCategories)

  return category?.label
}

async function findNewsPage({
  page,
  payload,
  where,
}: {
  page: number
  payload: Awaited<ReturnType<typeof getPayload>>
  where: Where
}): Promise<NewsPageResult> {
  const result = await payload
    .find({
      collection: 'news',
      depth: 1,
      limit: pageSize,
      overrideAccess: false,
      page,
      select: newsArchiveSelect,
      where,
    })
    .catch(() => ({
      docs: [],
      page,
      totalDocs: 0,
      totalPages: 0,
    }))

  return {
    docs: result.docs,
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

async function findCategorizedNews({
  category,
  page,
  payload,
  where,
}: {
  category: NewsCategory
  page: number
  payload: Awaited<ReturnType<typeof getPayload>>
  where: Where
}): Promise<NewsPageResult> {
  const categoryCandidates = await payload
    .find({
      collection: 'news',
      depth: 0,
      limit: 10000,
      overrideAccess: false,
      pagination: false,
      select: {
        category: true,
      },
      sort: '-publishedAt',
      where,
    })
    .catch(() => ({
      docs: [],
    }))
  const matchingIds = categoryCandidates.docs
    .filter((news) => categoryMatches(news.category, category))
    .map((news) => news.id)
  const totalDocs = matchingIds.length
  const totalPages = Math.max(Math.ceil(totalDocs / pageSize), 1)
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const pageIds = matchingIds.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (pageIds.length === 0) {
    return {
      docs: [],
      page: safePage,
      totalDocs,
      totalPages,
    }
  }

  const result = await payload
    .find({
      collection: 'news',
      depth: 1,
      limit: pageSize,
      overrideAccess: false,
      pagination: false,
      select: newsArchiveSelect,
      sort: '-publishedAt',
      where: {
        and: [
          where,
          {
            id: {
              in: pageIds,
            },
          },
        ],
      },
    })
    .catch(() => ({
      docs: [],
    }))

  return {
    docs: result.docs,
    page: safePage,
    totalDocs,
    totalPages,
  }
}

const newsArchiveSelect = {
  category: true,
  body: true,
  excerpt: true,
  publishedAt: true,
  slug: true,
  thumbnailMedia: true,
  title: true,
} as const

function categoryMatches(value: string | null | undefined, category: NewsCategory) {
  const normalizedValue = normalizeCategoryText(value ?? '')

  return category.match.some((categoryValue) => {
    const normalizedCategory = normalizeCategoryText(categoryValue)

    return category.matchMode === 'exact'
      ? normalizedValue === normalizedCategory
      : normalizedValue.includes(normalizedCategory)
  })
}

function normalizeCategoryText(value: string) {
  return value.replace(/[\s·ㆍ・.]+/g, '').toLowerCase()
}

function newsArchiveHref({
  category,
  center,
  page,
}: {
  category?: string | null
  center: string
  page?: number
}) {
  const params = new URLSearchParams()

  if (category) {
    params.set('category', category)
  }

  if (page && page > 1) {
    params.set('page', String(page))
  }

  const query = params.toString()

  return `/${center}/news${query ? `?${query}` : ''}`
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

function getNewsArchiveDescription(news: Partial<News>) {
  const excerpt = news.excerpt?.trim()

  if (excerpt) {
    return excerpt
  }

  return truncateText(extractLexicalText(news.body), 160)
}

function extractLexicalText(value: News['body'] | undefined) {
  const textParts: string[] = []

  collectLexicalText(value, textParts)

  return textParts.join(' ').replace(/\s+/g, ' ').trim()
}

function collectLexicalText(value: unknown, textParts: string[]) {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectLexicalText(item, textParts))
    return
  }

  const node = value as { children?: unknown; root?: unknown; text?: unknown }

  if (typeof node.text === 'string') {
    textParts.push(node.text)
  }

  collectLexicalText(node.root, textParts)
  collectLexicalText(node.children, textParts)
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}...`
}

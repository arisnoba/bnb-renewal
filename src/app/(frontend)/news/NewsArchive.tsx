import { Media } from '@/components/Media/Renderer'
import type { News } from '@/payload-types'
import {
  getNewsDescription,
  getNewsImageAlt,
  getNewsLegacyThumbnailSrc,
  getNewsThumbnailMedia,
  getNewsUrl,
} from '@/utilities/newsFallbacks'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import Link from 'next/link'
import React from 'react'

import PageClient from './page.client'

type NewsArchiveProps = {
  center?: string
  title?: string
}

export async function NewsArchive({ center, title = '뉴스' }: NewsArchiveProps) {
  const payload = await getPayload({ config: configPromise })
  const where: Where = center
    ? {
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
    : {
        displayStatus: {
          equals: 'published',
        },
      }

  const news = await payload
    .find({
      collection: 'news',
      depth: 1,
      limit: 24,
      overrideAccess: false,
      select: {
        category: true,
        excerpt: true,
        legacyMeta: true,
        meta: true,
        publishedAt: true,
        slug: true,
        sourceDb: true,
        thumbnailMedia: true,
        thumbnailPath: true,
        title: true,
      },
      where,
    })
    .catch(() => ({
      docs: [],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }))

  return (
    <main className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-12">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            News
          </p>
          <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">{title}</h1>
        </div>
      </div>

      <div className="container">
        {news.docs.length === 0 ? (
          <p className="text-muted-foreground">등록된 뉴스가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {news.docs.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function NewsCard({ news }: { news: Partial<News> & Pick<News, 'id' | 'slug' | 'title'> }) {
  const media = getNewsThumbnailMedia(news)
  const legacySrc = media ? undefined : getNewsLegacyThumbnailSrc(news)
  const description = getNewsDescription(news)
  const publishedAt = formatDate(news.publishedAt)

  return (
    <Link className="group block h-full" href={getNewsUrl(news)}>
      <article className="h-full overflow-hidden rounded-lg border border-border bg-card transition-colors group-hover:border-muted-foreground/50">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {media ? (
            <Media
              imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              pictureClassName="block h-full w-full"
              resource={media}
              size="(max-width: 768px) 100vw, 33vw"
            />
          ) : legacySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={getNewsImageAlt(news)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              src={legacySrc}
            />
          ) : null}
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {news.category && <span>{news.category}</span>}
            {publishedAt && <span>{publishedAt}</span>}
          </div>
          <h2 className="line-clamp-2 text-xl font-semibold leading-snug tracking-normal">
            {news.title}
          </h2>
          {description && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </article>
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

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}

import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import { assertCenter, getCenterLabel } from '@/lib/centers'
import type { News } from '@/payload-types'
import {
  getNewsDescription,
  getNewsThumbnailMedia,
  hasLexicalContent,
} from '@/utilities/newsFallbacks'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import PageClient from '../../../news/page.client'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    newsSlug?: string
    slug: string
  }>
}

export default async function CenterNewsDetail({ params: paramsPromise }: Args) {
  const { newsSlug = '', slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedNewsSlug = decodeURIComponent(newsSlug)
  const news = await queryNewsBySlug({ center, slug: decodedNewsSlug }).catch(() => null)

  if (!news) {
    notFound()
  }

  const media = getNewsThumbnailMedia(news)
  const description = getNewsDescription(news)
  const publishedAt = formatDateTime(news.publishedAt)
  const body = hasLexicalContent(news.body) ? news.body : undefined

  return (
    <article className="page page-light page-detail page-top-offset pb-24" data-center={center}>
      <PageClient />

      <header className="container page-heading max-w-5xl">
        <div className="page-eyebrow text-muted-foreground">
          {news.category && <span>{news.category}</span>}
          {news.category && publishedAt && <span className="mx-2">/</span>}
          {publishedAt && <time dateTime={news.publishedAt ?? undefined}>{publishedAt}</time>}
        </div>
        <h1 className="page-title max-w-4xl">{news.title}</h1>
        {description && <p className="page-desc max-w-3xl">{description}</p>}
      </header>

      {media && (
        <div className="container mt-10 max-w-5xl">
          <div className="overflow-hidden rounded-lg bg-muted">
            <Media
              imgClassName="h-auto w-full object-cover"
              pictureClassName="block w-full"
              priority
              resource={media}
              size="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      )}

      <div className="container mt-12">
        <div className="mx-auto max-w-3xl">
          {body ? <RichText data={body} enableGutter={false} /> : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { newsSlug = '', slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedNewsSlug = decodeURIComponent(newsSlug)
  const news = await queryNewsBySlug({ center, slug: decodedNewsSlug }).catch(() => null)
  const description = news ? getNewsDescription(news) : undefined

  return {
    description,
    title: news?.title ? `${news.title} | ${getCenterLabel(center)} 뉴스` : `${getCenterLabel(center)} 뉴스`,
  }
}

const queryNewsBySlug = cache(async ({ center, slug }: { center: string; slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'news',
    depth: 1,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
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
        ...(draft
          ? []
          : [
              {
                displayStatus: {
                  equals: 'published',
                },
              },
            ]),
      ],
    },
  })

  return (result.docs?.[0] as News | undefined) || null
})

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

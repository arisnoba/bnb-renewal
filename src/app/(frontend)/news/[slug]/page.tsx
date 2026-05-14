import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import type { News } from '@/payload-types'
import {
  generateNewsMeta,
  getNewsDescription,
  getNewsThumbnailMedia,
  hasLexicalContent,
} from '@/utilities/newsFallbacks'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import PageClient from './page.client'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'news',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
      where: {
        displayStatus: {
          equals: 'published',
        },
      },
    })

    return result.docs.map(({ slug }) => ({ slug }))
  } catch {
    return []
  }
}

export default async function NewsDetail({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const news = await queryNewsBySlug({ slug: decodedSlug }).catch(() => null)

  if (!news) {
    notFound()
  }

  const media = getNewsThumbnailMedia(news)
  const description = getNewsDescription(news)
  const publishedAt = formatDateTime(news.publishedAt)
  const body = hasLexicalContent(news.body) ? news.body : undefined

  return (
    <article className="pt-20 pb-24">
      <PageClient />

      <header className="container max-w-5xl">
        <div className="mb-8 text-sm text-muted-foreground">
          {news.category && <span>{news.category}</span>}
          {news.category && publishedAt && <span className="mx-2">/</span>}
          {publishedAt && <time dateTime={news.publishedAt ?? undefined}>{publishedAt}</time>}
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
          {news.title}
        </h1>
        {description && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>}
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
          {body ? (
            <RichText data={body} enableGutter={false} />
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const news = await queryNewsBySlug({ slug: decodedSlug }).catch(() => null)

  return generateNewsMeta(news)
}

const queryNewsBySlug = cache(async ({ slug }: { slug: string }) => {
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

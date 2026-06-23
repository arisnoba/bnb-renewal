import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import { assertCenter } from '@/lib/centers'
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

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailPage,
  DetailPager,
} from '../../../_components/DetailLayout'

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
  const body = hasLexicalContent(news.body) ? news.body : undefined
  const adjacent = await queryAdjacentNews({ center, slug: news.slug })

  return (
    <DetailPage center={center}>
      <DetailBackLink href={`/${center}/news`} label="NEWS&NOTICE" />

      <DetailContainer>
        <DetailHeader
          dateTime={news.publishedAt}
          description={description}
          eyebrow={news.category}
          title={news.title}
        />

        {media && (
          <div className="mb-10 overflow-hidden bg-muted md:mb-16">
            <Media
              imgClassName="aspect-video h-auto w-full object-cover"
              pictureClassName="block w-full"
              priority
              resource={media}
              size="(max-width: 767px) 100vw, 800px"
            />
          </div>
        )}

        {body ? (
          <RichText
            className="[&_img]:mx-auto [&_picture]:mx-auto"
            data={body}
            enableGutter={false}
          />
        ) : null}
      </DetailContainer>

      <DetailPager nextHref={adjacent.nextHref} previousHref={adjacent.previousHref} />
    </DetailPage>
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
    title: news?.title || '뉴스',
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

const queryAdjacentNews = cache(async ({ center, slug }: { center: string; slug: string }) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload
    .find({
      collection: 'news',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
      sort: '-publishedAt',
      where: {
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
      },
    })
    .catch(() => ({ docs: [] }))

  const index = result.docs.findIndex((item) => item.slug === slug)
  const previous = index >= 0 ? result.docs[index + 1] : undefined
  const next = index > 0 ? result.docs[index - 1] : undefined

  return {
    nextHref: next?.slug ? `/${center}/news/${encodeURIComponent(next.slug)}` : null,
    previousHref: previous?.slug ? `/${center}/news/${encodeURIComponent(previous.slug)}` : null,
  }
})

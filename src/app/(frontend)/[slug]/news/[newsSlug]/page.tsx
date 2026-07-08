import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import { assertCenter } from '@/lib/centers'
import type { News } from '@/payload-types'
import {
  getNewsDescription,
  getNewsMetaImageUrl,
  getNewsUrl,
  hasLexicalContent,
} from '@/utilities/newsFallbacks'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import React, { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailPage,
  DetailPager,
} from '../../../_components/DetailLayout'

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Args = {
  params: Promise<{
    newsSlug?: string
    slug: string
  }>
}

export async function generateStaticParams() {
  return []
}

export default async function CenterNewsDetail({ params: paramsPromise }: Args) {
  const { newsSlug = '', slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedNewsSlug = decodeURIComponent(newsSlug)
  const news = await queryNewsBySlug({ center, slug: decodedNewsSlug })

  if (!news) {
    notFound()
  }

  const description = getNewsDescription(news)
  const body = hasLexicalContent(news.body) ? news.body : undefined
  const adjacent = await queryAdjacentNews({
    center,
    id: news.id,
    publishedAt: news.publishedAt,
  })
  const backHref = `/${center}/news`
  const backLabel = 'NEWS&NOTICE'

  return (
    <DetailPage center={center}>
      <DetailBackLink href={backHref} label={backLabel} />

      <DetailContainer>
        <DetailHeader
          dateTime={news.publishedAt}
          description={description}
          eyebrow={news.category}
          title={news.title}
        />

        {body ? (
          <RichText
            className="[&_img]:mx-auto [&_picture]:mx-auto"
            data={body}
            enableGutter={false}
          />
        ) : null}
      </DetailContainer>

      <DetailPager
        listHref={backHref}
        listLabel={backLabel}
        nextHref={adjacent.nextHref}
        previousHref={adjacent.previousHref}
      />
    </DetailPage>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { newsSlug = '', slug } = await paramsPromise
  const center = assertCenter(slug)
  const decodedNewsSlug = decodeURIComponent(newsSlug)
  const news = await queryNewsBySlug({ center, slug: decodedNewsSlug })
  const description = news ? getNewsDescription(news) : undefined
  const imageUrl = news ? getNewsMetaImageUrl(news) : undefined
  const title = news?.meta?.title || news?.title || '뉴스'
  const canonicalPath = news ? getNewsUrl({ id: news.id }, center) : `/${center}/news`

  return {
    description,
    openGraph: mergeOpenGraph(
      {
        description: description || '',
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        title,
        url: canonicalPath,
      },
      { center },
    ),
    title,
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
          id: {
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

const queryAdjacentNews = cache(
  async ({
    center,
    id,
    publishedAt,
  }: {
    center: string
    id: number
    publishedAt?: string | null
  }) => {
    const publishedAtValue = publishedAt?.trim()

    if (!publishedAtValue) {
      return {
        nextHref: null,
        previousHref: null,
      }
    }

    const payload = await getPayload({ config: configPromise })
    const [previous, next] = await Promise.all([
      queryAdjacentNewsItem({
        center,
        direction: 'previous',
        id,
        payload,
        publishedAt: publishedAtValue,
      }),
      queryAdjacentNewsItem({
        center,
        direction: 'next',
        id,
        payload,
        publishedAt: publishedAtValue,
      }),
    ])

    return {
      nextHref: next?.id ? `/${center}/news/${encodeURIComponent(String(next.id))}` : null,
      previousHref: previous?.id ? `/${center}/news/${encodeURIComponent(String(previous.id))}` : null,
    }
  },
)

async function queryAdjacentNewsItem({
  center,
  direction,
  id,
  payload,
  publishedAt,
}: {
  center: string
  direction: 'next' | 'previous'
  id: number
  payload: Awaited<ReturnType<typeof getPayload>>
  publishedAt: string
}) {
  const isNext = direction === 'next'
  const dateOperator = isNext ? 'greater_than' : 'less_than'
  const idOperator = isNext ? 'greater_than' : 'less_than'
  const result = await payload.find({
    collection: 'news',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: isNext ? ['publishedAt', 'id'] : ['-publishedAt', '-id'],
    where: {
      and: [
        publishedNewsWhere(center),
        {
          or: [
            {
              publishedAt: {
                [dateOperator]: publishedAt,
              },
            },
            {
              and: [
                {
                  publishedAt: {
                    equals: publishedAt,
                  },
                },
                {
                  id: {
                    [idOperator]: id,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  })

  return result.docs[0] as Pick<News, 'id'> | undefined
}

function publishedNewsWhere(center: string): Where {
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
}

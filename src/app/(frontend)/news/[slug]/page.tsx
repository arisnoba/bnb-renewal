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

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailPage,
  DetailPager,
} from '../../_components/DetailLayout'

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
  const body = hasLexicalContent(news.body) ? news.body : undefined
  const adjacent = await queryAdjacentNews({ slug: news.slug })

  return (
    <DetailPage>
      <DetailBackLink href="/news" label="NEWS&NOTICE" />

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

const queryAdjacentNews = cache(async ({ slug }: { slug: string }) => {
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
        displayStatus: {
          equals: 'published',
        },
      },
    })
    .catch(() => ({ docs: [] }))

  const index = result.docs.findIndex((item) => item.slug === slug)
  const previous = index >= 0 ? result.docs[index + 1] : undefined
  const next = index > 0 ? result.docs[index - 1] : undefined

  return {
    nextHref: next?.slug ? `/news/${encodeURIComponent(next.slug)}` : null,
    previousHref: previous?.slug ? `/news/${encodeURIComponent(previous.slug)}` : null,
  }
})

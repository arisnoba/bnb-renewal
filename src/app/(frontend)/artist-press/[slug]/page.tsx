import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import type { ArtistPress } from '@/payload-types'
import {
  generateArtistPressMeta,
  getArtistPressDescription,
  getArtistPressThumbnailMedia,
  hasArtistPressLexicalContent,
} from '@/utilities/artistPressFallbacks'
import { publishedArtistPressWhere } from '@/utilities/artistPressVisibility'
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
      collection: 'artist-press',
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

export default async function ArtistPressDetail({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  return <ArtistPressDetailPage slug={decodedSlug} />
}

export async function ArtistPressDetailPage({
  center,
  slug,
}: {
  center?: CenterSlug
  slug: string
}) {
  const artistPress = await queryArtistPressBySlug({ slug }).catch(() => null)

  if (!artistPress) {
    notFound()
  }

  const media = getArtistPressThumbnailMedia(artistPress)
  const description = getArtistPressDescription(artistPress)
  const body = hasArtistPressLexicalContent(artistPress.body) ? artistPress.body : undefined
  const eyebrow = [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')
  const adjacent = await queryAdjacentArtistPress({ center, slug: artistPress.slug })

  return (
    <DetailPage center={center}>
      <DetailBackLink href={center ? `/${center}/artist-press` : '/artist-press'} label="BNB출신 아티스트" />

      <DetailContainer>
        <DetailHeader
          dateTime={artistPress.publishedAt}
          description={description}
          eyebrow={eyebrow}
          title={artistPress.title}
        />

        {media && (
          <div className="mx-auto mb-10 max-w-[600px] overflow-hidden bg-muted md:mb-16">
            <Media
              imgClassName="h-auto w-full object-cover"
              pictureClassName="block w-full"
              priority
              resource={media}
              size="(max-width: 767px) 100vw, 600px"
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

  return generateArtistPressDetailMetadata(decodedSlug)
}

export async function generateArtistPressDetailMetadata(slug: string): Promise<Metadata> {
  const artistPress = await queryArtistPressBySlug({ slug }).catch(() => null)

  return generateArtistPressMeta(artistPress)
}

const queryArtistPressBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'artist-press',
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

  return (result.docs?.[0] as ArtistPress | undefined) || null
})

const queryAdjacentArtistPress = cache(
  async ({ center, slug }: { center?: CenterSlug; slug: string }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload
      .find({
        collection: 'artist-press',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
        },
        sort: '-publishedAt',
        where: publishedArtistPressWhere(center),
      })
      .catch(() => ({ docs: [] }))

    const index = result.docs.findIndex((item) => item.slug === slug)
    const previous = index >= 0 ? result.docs[index + 1] : undefined
    const next = index > 0 ? result.docs[index - 1] : undefined
    const pathPrefix = center ? `/${center}/artist-press` : '/artist-press'

    return {
      nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
      previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
    }
  },
)

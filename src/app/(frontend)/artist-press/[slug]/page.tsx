import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import type { ArtistPress } from '@/payload-types'
import {
  generateArtistPressMeta,
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
  DetailMedia,
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
  const description = artistPress.meta?.description?.trim() || undefined
  const body = hasArtistPressLexicalContent(artistPress.body) ? artistPress.body : undefined
  const eyebrow = [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')
  const adjacent = await queryAdjacentArtistPress({ center, slug: artistPress.slug })
  const backHref = center ? `/${center}/artist-press` : '/artist-press'
  const backLabel = 'BNB출신 아티스트'

  return (
    <DetailPage center={center}>
      <DetailBackLink href={backHref} label={backLabel} />

      <DetailContainer>
        <DetailHeader
          dateTime={artistPress.publishedAt}
          description={description}
          eyebrow={eyebrow}
          title={artistPress.title}
        />

        {media && (
          <DetailMedia
            className="mx-auto mb-10 max-w-[600px] md:mb-16"
            priority
            resource={media}
            size="(max-width: 767px) 100vw, 600px"
          />
        )}

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
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  return generateArtistPressDetailMetadata(decodedSlug)
}

export async function generateArtistPressDetailMetadata(
  slug: string,
  center?: CenterSlug,
): Promise<Metadata> {
  const artistPress = await queryArtistPressBySlug({ slug }).catch(() => null)

  return generateArtistPressMeta(artistPress, center)
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

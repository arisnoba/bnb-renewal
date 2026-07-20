import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import type { ArtistPress } from '@/payload-types'
import {
  generateArtistPressMeta,
  hasArtistPressLexicalContent,
} from '@/utilities/artistPressFallbacks'
import { publishedArtistPressWhere } from '@/utilities/artistPressVisibility'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
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
} from '../_components/DetailLayout'

export async function ArtistPressDetailPage({
  center,
  slug,
}: {
  center?: CenterSlug
  slug: string
}) {
  const artistPress = await queryArtistPressBySlug({ slug })

  if (!artistPress) {
    notFound()
  }

  const description = artistPress.meta?.description?.trim() || undefined
  const body = hasArtistPressLexicalContent(artistPress.body) ? artistPress.body : undefined
  const eyebrow = [artistPress.actorName, artistPress.generation].filter(Boolean).join(' ')
  const adjacent = await queryAdjacentArtistPress({
    center,
    id: artistPress.id,
    publishedAt: artistPress.publishedAt,
  })
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

        {body ? (
          <RichText
            className="[&_img]:mx-auto [&_picture]:mx-auto"
            data={body}
            enableGutter={false}
            linksOpenInNewTab
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

export async function generateArtistPressDetailMetadata(
  slug: string,
  center?: CenterSlug,
) {
  const artistPress = await queryArtistPressBySlug({ slug })

  return generateArtistPressMeta(artistPress, center)
}

const queryArtistPressBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  if (!draft) {
    return unstable_cache(
      () => queryArtistPressDocument({ draft: false, slug }),
      ['frontend-artist-press-detail', slug],
      {
        revalidate: 600,
        tags: ['frontend_artist_press'],
      },
    )()
  }

  return queryArtistPressDocument({ draft: true, slug })
})

async function queryArtistPressDocument({ draft, slug }: { draft: boolean; slug: string }) {
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
          id: {
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
}

const queryAdjacentArtistPress = cache(
  async ({
    center,
    id,
    publishedAt,
  }: {
    center?: CenterSlug
    id: number
    publishedAt?: string | null
  }) => {
    if (!publishedAt) {
      return { nextHref: null, previousHref: null }
    }

    return unstable_cache(
      () => queryAdjacentArtistPressItems({ center, id, publishedAt }),
      ['frontend-artist-press-adjacent', center ?? 'all', String(id), publishedAt],
      {
        revalidate: 600,
        tags: ['frontend_artist_press'],
      },
    )()
  },
)

async function queryAdjacentArtistPressItems({
  center,
  id,
  publishedAt,
}: {
  center?: CenterSlug
  id: number
  publishedAt: string
}) {
    const payload = await getPayload({ config: configPromise })
    const [previous, next] = await Promise.all([
      queryAdjacentArtistPressItem({ center, direction: 'previous', id, payload, publishedAt }),
      queryAdjacentArtistPressItem({ center, direction: 'next', id, payload, publishedAt }),
    ])
    const pathPrefix = center ? `/${center}/artist-press` : '/artist-press'

    return {
      nextHref: next?.id ? `${pathPrefix}/${encodeURIComponent(String(next.id))}` : null,
      previousHref: previous?.id ? `${pathPrefix}/${encodeURIComponent(String(previous.id))}` : null,
    }
}

async function queryAdjacentArtistPressItem({
  center,
  direction,
  id,
  payload,
  publishedAt,
}: {
  center?: CenterSlug
  direction: 'next' | 'previous'
  id: number
  payload: Awaited<ReturnType<typeof getPayload>>
  publishedAt: string
}) {
  const isNext = direction === 'next'
  const dateOperator = isNext ? 'greater_than' : 'less_than'
  const idOperator = isNext ? 'greater_than' : 'less_than'
  const where: Where = {
    and: [
      publishedArtistPressWhere(center),
      {
        or: [
          { publishedAt: { [dateOperator]: publishedAt } },
          {
            and: [
              { publishedAt: { equals: publishedAt } },
              { id: { [idOperator]: id } },
            ],
          },
        ],
      },
    ],
  }
  const result = await payload.find({
    collection: 'artist-press',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    sort: isNext ? ['publishedAt', 'id'] : ['-publishedAt', '-id'],
    where,
  })

  return result.docs[0]
}

import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import RichText from '@/components/RichText'
import type { ArtistPress } from '@/payload-types'
import {
  generateArtistPressMeta,
  getArtistPressDescription,
  getArtistPressThumbnailMedia,
  hasArtistPressLexicalContent,
} from '@/utilities/artistPressFallbacks'
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
  center?: string
  slug: string
}) {
  const artistPress = await queryArtistPressBySlug({ slug }).catch(() => null)

  if (!artistPress) {
    notFound()
  }

  const media = getArtistPressThumbnailMedia(artistPress)
  const description = getArtistPressDescription(artistPress)
  const publishedAt = formatDateTime(artistPress.publishedAt)
  const body = hasArtistPressLexicalContent(artistPress.body) ? artistPress.body : undefined

  return (
    <article className="page page-light page-detail page-top-offset pb-24" data-center={center}>
      <PageClient />

      <header className="container page-heading max-w-5xl">
        <div className="page-eyebrow flex flex-wrap gap-2 text-muted-foreground">
          {artistPress.actorName && <span>{artistPress.actorName}</span>}
          {artistPress.generation && <span>{artistPress.generation}</span>}
          {publishedAt && <time dateTime={artistPress.publishedAt ?? undefined}>{publishedAt}</time>}
        </div>
        <h1 className="page-title max-w-4xl">
          {artistPress.title}
        </h1>
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

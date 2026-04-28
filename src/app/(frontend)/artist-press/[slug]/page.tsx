import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import type { ArtistPress } from '@/payload-types'
import {
  generateArtistPressMeta,
  getArtistPressDescription,
  getArtistPressImageAlt,
  getArtistPressLegacyThumbnailSrc,
  getArtistPressThumbnailMedia,
  hasArtistPressLexicalContent,
} from '@/utilities/artistPressFallbacks'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
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
  const url = `/artist-press/${decodedSlug}`
  const artistPress = await queryArtistPressBySlug({ slug: decodedSlug }).catch(() => null)

  if (!artistPress) {
    return <PayloadRedirects url={url} />
  }

  const media = getArtistPressThumbnailMedia(artistPress)
  const legacySrc = media ? undefined : getArtistPressLegacyThumbnailSrc(artistPress)
  const description = getArtistPressDescription(artistPress)
  const publishedAt = formatDateTime(artistPress.publishedAt)
  const body = hasArtistPressLexicalContent(artistPress.body) ? artistPress.body : undefined

  return (
    <article className="pt-20 pb-24">
      <PageClient />
      <PayloadRedirects disableNotFound url={url} />

      <header className="container max-w-5xl">
        <div className="mb-8 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {artistPress.actorName && <span>{artistPress.actorName}</span>}
          {artistPress.generation && <span>{artistPress.generation}</span>}
          {publishedAt && <time dateTime={artistPress.publishedAt ?? undefined}>{publishedAt}</time>}
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
          {artistPress.title}
        </h1>
        {description && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>}
      </header>

      {(media || legacySrc) && (
        <div className="container mt-10 max-w-5xl">
          <div className="overflow-hidden rounded-lg bg-muted">
            {media ? (
              <Media
                imgClassName="h-auto w-full object-cover"
                pictureClassName="block w-full"
                priority
                resource={media}
                size="(max-width: 1024px) 100vw, 1024px"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={getArtistPressImageAlt(artistPress)}
                className="h-auto w-full object-cover"
                loading="eager"
                src={legacySrc}
              />
            )}
          </div>
        </div>
      )}

      <div className="container mt-12">
        <div className="mx-auto max-w-3xl">
          {body ? (
            <RichText data={body} enableGutter={false} />
          ) : artistPress.bodyHtml ? (
            <div
              className="payload-richtext prose md:prose-md dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: artistPress.bodyHtml }}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const artistPress = await queryArtistPressBySlug({ slug: decodedSlug }).catch(() => null)

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

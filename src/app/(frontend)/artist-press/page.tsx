import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import type { ArtistPress } from '@/payload-types'
import {
  getArtistPressDescription,
  getArtistPressThumbnailMedia,
  getArtistPressUrl,
} from '@/utilities/artistPressFallbacks'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import PageClient from './page.client'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export default async function ArtistPressIndex() {
  const payload = await getPayload({ config: configPromise })
  const artistPress = await payload
    .find({
      collection: 'artist-press',
      depth: 1,
      limit: 24,
      overrideAccess: false,
      select: {
        actorName: true,
        generation: true,
        meta: true,
        publishedAt: true,
        slug: true,
        thumbnailMedia: true,
        title: true,
      },
      where: {
        displayStatus: {
          equals: 'published',
        },
      },
    })
    .catch(() => ({
      docs: [],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }))

  return (
    <main className="page page-light page-artist-press-archive page-top-offset pb-24">
      <PageClient />
      <div className="container mb-12">
        <div className="page-heading max-w-3xl">
          <p className="page-eyebrow uppercase tracking-[0.14em] text-muted-foreground">
            Artist Press
          </p>
          <h1 className="page-title">출신 아티스트</h1>
        </div>
      </div>

      <div className="container">
        {artistPress.docs.length === 0 ? (
          <p className="text-muted-foreground">등록된 출신 아티스트 소식이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {artistPress.docs.map((item) => (
              <ArtistPressCard key={item.id} artistPress={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: '출신 아티스트',
  }
}

function ArtistPressCard({
  artistPress,
}: {
  artistPress: Partial<ArtistPress> & Pick<ArtistPress, 'id' | 'slug' | 'title'>
}) {
  const media = getArtistPressThumbnailMedia(artistPress)
  const description = getArtistPressDescription(artistPress)
  const publishedAt = formatDate(artistPress.publishedAt)

  return (
    <Link className="group block h-full" href={getArtistPressUrl(artistPress)}>
      <article className="h-full overflow-hidden rounded-lg border border-border bg-card transition-colors group-hover:border-muted-foreground/50">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {media ? (
            <Media
              imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              pictureClassName="block h-full w-full"
              resource={media}
              size="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {artistPress.actorName && <span>{artistPress.actorName}</span>}
            {artistPress.generation && <span>{artistPress.generation}</span>}
            {publishedAt && <span>{publishedAt}</span>}
          </div>
          <h2 className="line-clamp-2 type-title-l font-semibold leading-snug tracking-normal">
            {artistPress.title}
          </h2>
          {description && (
            <p className="mt-3 line-clamp-3 type-body-s leading-6 text-muted-foreground">{description}</p>
          )}
        </div>
      </article>
    </Link>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}
